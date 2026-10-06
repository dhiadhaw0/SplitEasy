package com.spliteasy.service.impl;

import com.spliteasy.dto.response.OnboardingResponse;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.repository.BudgetRepository;
import com.spliteasy.repository.ExpenseGroupRepository;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.repository.SavingsGoalRepository;
import com.spliteasy.service.OnboardingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OnboardingServiceImpl implements OnboardingService {

    private final ParticipantRepository participantRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseGroupRepository groupRepository;
    private final BudgetRepository budgetRepository;
    private final SavingsGoalRepository savingsGoalRepository;

    @Override
    public OnboardingResponse getStatus(Long userId) {
        boolean hasGroup = participantRepository.existsByUserId(userId);
        boolean hasExpense = expenseRepository.existsByCreatedById(userId);
        boolean hasInvitedSomeone = participantRepository.existsOtherLinkedParticipantInMyGroups(userId);

        List<Long> myGroupIds = groupRepository.findAllByUserId(userId).stream().map(ExpenseGroup::getId).toList();
        boolean hasBudgetOrGoal = !myGroupIds.isEmpty()
                && (budgetRepository.existsByGroupIdIn(myGroupIds) || savingsGoalRepository.existsByGroupIdIn(myGroupIds));

        return new OnboardingResponse(hasGroup, hasExpense, hasInvitedSomeone, hasBudgetOrGoal);
    }
}
