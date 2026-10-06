package com.spliteasy.service.impl;

import com.spliteasy.dto.request.GroupRequest;
import com.spliteasy.dto.request.JoinGroupRequest;
import com.spliteasy.dto.response.GroupDetailResponse;
import com.spliteasy.dto.response.GroupSummaryResponse;
import com.spliteasy.dto.response.InvitePreviewResponse;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.Participant;
import com.spliteasy.entity.User;
import com.spliteasy.entity.enums.ActivityType;
import com.spliteasy.entity.enums.ExpenseType;
import com.spliteasy.exception.ConflictException;
import com.spliteasy.exception.ResourceNotFoundException;
import com.spliteasy.mapper.GroupMapper;
import com.spliteasy.repository.ExpenseGroupRepository;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.repository.UserRepository;
import com.spliteasy.service.ActivityService;
import com.spliteasy.service.BalanceService;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.service.GroupService;
import com.spliteasy.util.InviteCodeGenerator;
import com.spliteasy.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupServiceImpl implements GroupService {

    private static final int MAX_INVITE_CODE_ATTEMPTS = 20;

    private final ExpenseGroupRepository groupRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final GroupAccessService groupAccessService;
    private final BalanceService balanceService;
    private final GroupMapper groupMapper;
    private final ActivityService activityService;

    @Override
    @Transactional(readOnly = true)
    public List<GroupSummaryResponse> getMyGroups(Long userId) {
        return groupRepository.findAllByUserId(userId).stream()
                .map(group -> toSummary(group, userId))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public GroupDetailResponse getGroup(Long groupId, Long userId) {
        ExpenseGroup group = groupAccessService.getGroupOrThrow(groupId);
        Long myParticipantId = groupAccessService.findMyParticipant(groupId, userId).map(Participant::getId).orElse(null);
        return groupMapper.toDetailResponse(group, myParticipantId);
    }

    @Override
    public GroupDetailResponse createGroup(GroupRequest request, Long userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        ExpenseGroup group = ExpenseGroup.builder()
                .name(request.name())
                .description(request.description())
                .currency(request.currency())
                .inviteCode(generateUniqueInviteCode())
                .createdBy(creator)
                .build();

        // The creator automatically becomes a participant linked to their own account.
        Participant creatorParticipant = Participant.builder()
                .name(creator.getDisplayName())
                .user(creator)
                .build();
        group.addParticipant(creatorParticipant);

        group = groupRepository.save(group);
        Participant saved = group.getParticipants().get(0);
        return groupMapper.toDetailResponse(group, saved.getId());
    }

    @Override
    public GroupDetailResponse updateGroup(Long groupId, GroupRequest request, Long userId) {
        ExpenseGroup group = groupAccessService.getGroupOrThrow(groupId);

        if (group.getCurrency() != request.currency() && expenseRepository.existsByGroupId(groupId)) {
            throw new ConflictException(
                    "Impossible de changer la devise d'un groupe qui contient déjà des dépenses.");
        }

        group.setName(request.name());
        group.setDescription(request.description());
        group.setCurrency(request.currency());
        group = groupRepository.save(group);

        Long myParticipantId = groupAccessService.findMyParticipant(groupId, userId).map(Participant::getId).orElse(null);
        return groupMapper.toDetailResponse(group, myParticipantId);
    }

    @Override
    public void deleteGroup(Long groupId, Long userId) {
        groupAccessService.checkCreator(groupId, userId);
        groupRepository.deleteById(groupId);
    }

    @Override
    public GroupDetailResponse regenerateInviteCode(Long groupId, Long userId) {
        ExpenseGroup group = groupAccessService.getGroupOrThrow(groupId);
        group.setInviteCode(generateUniqueInviteCode());
        group = groupRepository.save(group);

        Long myParticipantId = groupAccessService.findMyParticipant(groupId, userId).map(Participant::getId).orElse(null);
        return groupMapper.toDetailResponse(group, myParticipantId);
    }

    @Override
    @Transactional(readOnly = true)
    public InvitePreviewResponse previewInvite(String inviteCode) {
        ExpenseGroup group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new ResourceNotFoundException("Code d'invitation invalide."));

        List<Participant> unlinked = group.getParticipants().stream()
                .filter(participant -> !participant.isLinked())
                .toList();

        return groupMapper.toInvitePreviewResponse(group, unlinked);
    }

    @Override
    public GroupDetailResponse joinGroup(JoinGroupRequest request, Long userId) {
        ExpenseGroup group = groupRepository.findByInviteCode(request.inviteCode())
                .orElseThrow(() -> new ResourceNotFoundException("Code d'invitation invalide."));

        if (participantRepository.existsByGroupIdAndUserId(group.getId(), userId)) {
            throw new ConflictException("Vous êtes déjà membre de ce groupe.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        Participant participant;
        if (request.participantId() != null) {
            participant = participantRepository.findByIdAndGroupId(request.participantId(), group.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Participant introuvable dans ce groupe."));
            if (participant.isLinked()) {
                throw new ConflictException("Ce participant est déjà lié à un compte utilisateur.");
            }
            participant.setUser(user);
        } else {
            String name = request.newParticipantName();
            if (participantRepository.existsByGroupIdAndNameIgnoreCase(group.getId(), name)) {
                throw new ConflictException("Un participant porte déjà ce nom dans ce groupe.");
            }
            participant = Participant.builder().name(name).user(user).build();
            group.addParticipant(participant);
        }
        participant = participantRepository.save(participant);

        activityService.log(group, user, ActivityType.PARTICIPANT_JOINED,
                user.getDisplayName() + " a rejoint le groupe");

        return groupMapper.toDetailResponse(group, participant.getId());
    }

    private GroupSummaryResponse toSummary(ExpenseGroup group, Long userId) {
        Long myParticipantId = groupAccessService.findMyParticipant(group.getId(), userId)
                .map(Participant::getId)
                .orElse(null);
        BigDecimal totalSpent = MoneyUtils.scale(
                expenseRepository.sumAmountByGroupIdAndType(group.getId(), ExpenseType.EXPENSE));
        BigDecimal myBalance = myParticipantId == null
                ? MoneyUtils.ZERO
                : balanceService.getBalanceFor(group.getId(), myParticipantId);
        return groupMapper.toSummaryResponse(group, group.getParticipants().size(), totalSpent, myBalance);
    }

    private String generateUniqueInviteCode() {
        for (int attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt++) {
            String candidate = InviteCodeGenerator.generate();
            if (groupRepository.findByInviteCode(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new IllegalStateException("Impossible de générer un code d'invitation unique après plusieurs tentatives.");
    }
}
