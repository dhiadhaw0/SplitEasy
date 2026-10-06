package com.spliteasy.service.impl;

import com.spliteasy.dto.request.SavingsContributionRequest;
import com.spliteasy.dto.request.SavingsGoalRequest;
import com.spliteasy.dto.response.SavingsContributionResponse;
import com.spliteasy.dto.response.SavingsGoalResponse;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.Participant;
import com.spliteasy.entity.SavingsContribution;
import com.spliteasy.entity.SavingsGoal;
import com.spliteasy.entity.User;
import com.spliteasy.entity.enums.ActivityType;
import com.spliteasy.exception.BadRequestException;
import com.spliteasy.exception.ResourceNotFoundException;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.repository.SavingsContributionRepository;
import com.spliteasy.repository.SavingsGoalRepository;
import com.spliteasy.repository.UserRepository;
import com.spliteasy.service.ActivityService;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.service.SavingsGoalService;
import com.spliteasy.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SavingsGoalServiceImpl implements SavingsGoalService {

    private final SavingsGoalRepository savingsGoalRepository;
    private final SavingsContributionRepository savingsContributionRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final GroupAccessService groupAccessService;
    private final ActivityService activityService;

    @Override
    @Transactional(readOnly = true)
    public List<SavingsGoalResponse> list(Long groupId) {
        return savingsGoalRepository.findByGroupIdOrderByCreatedAtAsc(groupId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public SavingsGoalResponse create(Long groupId, SavingsGoalRequest request) {
        ExpenseGroup group = groupAccessService.getGroupOrThrow(groupId);

        SavingsGoal goal = SavingsGoal.builder()
                .group(group)
                .name(request.name())
                .targetAmount(MoneyUtils.scale(request.targetAmount()))
                .deadline(request.deadline())
                .build();
        goal = savingsGoalRepository.save(goal);

        return toResponse(goal);
    }

    @Override
    public SavingsGoalResponse update(Long groupId, Long goalId, SavingsGoalRequest request) {
        SavingsGoal goal = getGoalOrThrow(groupId, goalId);

        goal.setName(request.name());
        goal.setTargetAmount(MoneyUtils.scale(request.targetAmount()));
        goal.setDeadline(request.deadline());

        return toResponse(goal);
    }

    @Override
    public void delete(Long groupId, Long goalId) {
        SavingsGoal goal = getGoalOrThrow(groupId, goalId);
        savingsGoalRepository.delete(goal);
    }

    @Override
    public SavingsGoalResponse addContribution(Long groupId, Long goalId, SavingsContributionRequest request, Long userId) {
        SavingsGoal goal = getGoalOrThrow(groupId, goalId);
        Participant participant = participantRepository.findByIdAndGroupId(request.participantId(), groupId)
                .orElseThrow(() -> new BadRequestException("Le participant n'appartient pas à ce groupe."));

        BigDecimal currentAmountBefore = MoneyUtils.sum(goal.getContributions().stream().map(SavingsContribution::getAmount).toList());
        boolean wasAchieved = currentAmountBefore.compareTo(goal.getTargetAmount()) >= 0;

        SavingsContribution contribution = SavingsContribution.builder()
                .participant(participant)
                .amount(MoneyUtils.scale(request.amount()))
                .note(request.note())
                .build();
        goal.addContribution(contribution);
        // Explicit save (not just relying on cascade at commit time): with GenerationType.IDENTITY
        // the id/createdAt are only populated once actually inserted, and toResponse() below reads
        // both straight away to build the response.
        savingsContributionRepository.save(contribution);

        SavingsGoalResponse response = toResponse(goal);

        if (!wasAchieved && response.achieved()) {
            User actor = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
            activityService.log(goal.getGroup(), actor, ActivityType.SAVINGS_GOAL_ACHIEVED,
                    "L'objectif « " + goal.getName() + " » a été atteint !");
        }

        return response;
    }

    @Override
    public SavingsGoalResponse deleteContribution(Long groupId, Long goalId, Long contributionId) {
        SavingsGoal goal = getGoalOrThrow(groupId, goalId);
        SavingsContribution contribution = savingsContributionRepository.findByIdAndGoalId(contributionId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Contribution introuvable pour cette cagnotte."));

        goal.getContributions().remove(contribution);
        contribution.setGoal(null);
        savingsContributionRepository.delete(contribution);

        return toResponse(goal);
    }

    private SavingsGoal getGoalOrThrow(Long groupId, Long goalId) {
        return savingsGoalRepository.findByIdAndGroupId(goalId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Cagnotte introuvable dans ce groupe."));
    }

    private SavingsGoalResponse toResponse(SavingsGoal goal) {
        BigDecimal currentAmount = MoneyUtils.sum(goal.getContributions().stream().map(SavingsContribution::getAmount).toList());
        BigDecimal target = goal.getTargetAmount();
        int percentage = target.compareTo(BigDecimal.ZERO) == 0
                ? 0
                : currentAmount.multiply(BigDecimal.valueOf(100)).divide(target, 0, RoundingMode.HALF_UP).intValue();
        boolean achieved = currentAmount.compareTo(target) >= 0;

        List<SavingsContributionResponse> contributions = goal.getContributions().stream()
                .sorted(Comparator.comparing(SavingsContribution::getCreatedAt).reversed())
                .map(c -> new SavingsContributionResponse(
                        c.getId(),
                        c.getParticipant().getId(),
                        c.getParticipant().getName(),
                        c.getAmount(),
                        c.getNote(),
                        c.getCreatedAt()))
                .toList();

        return new SavingsGoalResponse(
                goal.getId(),
                goal.getName(),
                target,
                goal.getDeadline(),
                currentAmount,
                percentage,
                achieved,
                contributions,
                goal.getCreatedAt());
    }
}
