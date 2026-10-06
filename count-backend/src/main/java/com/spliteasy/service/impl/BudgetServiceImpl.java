package com.spliteasy.service.impl;

import com.spliteasy.dto.request.BudgetRequest;
import com.spliteasy.dto.response.BudgetResponse;
import com.spliteasy.entity.Budget;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.User;
import com.spliteasy.entity.enums.ActivityType;
import com.spliteasy.entity.enums.Category;
import com.spliteasy.exception.ConflictException;
import com.spliteasy.exception.ResourceNotFoundException;
import com.spliteasy.repository.BudgetRepository;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.service.ActivityService;
import com.spliteasy.service.BudgetService;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final GroupAccessService groupAccessService;
    private final ActivityService activityService;

    @Override
    @Transactional(readOnly = true)
    public List<BudgetResponse> list(Long groupId) {
        return budgetRepository.findByGroupIdOrderByCreatedAtAsc(groupId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public BudgetResponse create(Long groupId, BudgetRequest request) {
        ExpenseGroup group = groupAccessService.getGroupOrThrow(groupId);
        checkNoDuplicateCategory(groupId, request.category(), null);

        Budget budget = Budget.builder()
                .group(group)
                .category(request.category())
                .amountLimit(MoneyUtils.scale(request.amountLimit()))
                .period(request.period())
                .build();
        budget = budgetRepository.save(budget);

        return toResponse(budget);
    }

    @Override
    public BudgetResponse update(Long groupId, Long budgetId, BudgetRequest request) {
        Budget budget = getBudgetOrThrow(groupId, budgetId);
        checkNoDuplicateCategory(groupId, request.category(), budgetId);

        budget.setCategory(request.category());
        budget.setAmountLimit(MoneyUtils.scale(request.amountLimit()));
        budget.setPeriod(request.period());

        return toResponse(budget);
    }

    @Override
    public void delete(Long groupId, Long budgetId) {
        Budget budget = getBudgetOrThrow(groupId, budgetId);
        budgetRepository.delete(budget);
    }

    private void checkNoDuplicateCategory(Long groupId, com.spliteasy.entity.enums.Category category, Long excludingBudgetId) {
        boolean duplicate = budgetRepository.findByGroupIdOrderByCreatedAtAsc(groupId).stream()
                .anyMatch(b -> !b.getId().equals(excludingBudgetId) && Objects.equals(b.getCategory(), category));
        if (duplicate) {
            throw new ConflictException(
                    category == null
                            ? "Un budget global existe déjà pour ce groupe."
                            : "Un budget existe déjà pour cette catégorie.");
        }
    }

    private Budget getBudgetOrThrow(Long groupId, Long budgetId) {
        return budgetRepository.findByIdAndGroupId(budgetId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget introuvable dans ce groupe."));
    }

    private BudgetResponse toResponse(Budget budget) {
        LocalDate[] period = periodFor(budget.getPeriod());
        BigDecimal spent = MoneyUtils.scale(
                expenseRepository.sumAmountForBudget(budget.getGroup().getId(), budget.getCategory(), period[0], period[1]));
        BigDecimal limit = budget.getAmountLimit();
        BigDecimal remaining = MoneyUtils.scale(limit.subtract(spent));
        int percentage = limit.compareTo(BigDecimal.ZERO) == 0
                ? 0
                : spent.multiply(BigDecimal.valueOf(100)).divide(limit, 0, RoundingMode.HALF_UP).intValue();
        boolean exceeded = spent.compareTo(limit) > 0;

        return new BudgetResponse(
                budget.getId(),
                budget.getCategory(),
                limit,
                budget.getPeriod(),
                spent,
                remaining,
                percentage,
                exceeded,
                budget.getCreatedAt());
    }

    @Override
    public void checkExceededByExpense(ExpenseGroup group, Category expenseCategory, BigDecimal expenseAmount, User actor) {
        // A category-specific budget only reacts to expenses in that exact category; the group's
        // overall budget (category == null) reacts to every expense regardless of its category.
        List<Budget> matching = budgetRepository.findByGroupIdOrderByCreatedAtAsc(group.getId()).stream()
                .filter(budget -> budget.getCategory() == null || budget.getCategory() == expenseCategory)
                .toList();

        for (Budget budget : matching) {
            LocalDate[] period = periodFor(budget.getPeriod());
            BigDecimal spentAfter = MoneyUtils.scale(
                    expenseRepository.sumAmountForBudget(group.getId(), budget.getCategory(), period[0], period[1]));
            BigDecimal spentBefore = spentAfter.subtract(expenseAmount);

            boolean justCrossed = spentBefore.compareTo(budget.getAmountLimit()) <= 0
                    && spentAfter.compareTo(budget.getAmountLimit()) > 0;
            if (justCrossed) {
                String label = budget.getCategory() == null ? "Toutes catégories" : categoryLabel(budget.getCategory());
                activityService.log(group, actor, ActivityType.BUDGET_EXCEEDED,
                        actor.getDisplayName() + " a dépassé le budget « " + label + " »");
            }
        }
    }

    private LocalDate[] periodFor(com.spliteasy.entity.enums.BudgetPeriod period) {
        LocalDate start = switch (period) {
            case MONTHLY -> LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
            case YEARLY -> LocalDate.now().with(TemporalAdjusters.firstDayOfYear());
        };
        LocalDate end = switch (period) {
            case MONTHLY -> LocalDate.now().with(TemporalAdjusters.lastDayOfMonth());
            case YEARLY -> LocalDate.now().with(TemporalAdjusters.lastDayOfYear());
        };
        return new LocalDate[] { start, end };
    }

    private String categoryLabel(Category category) {
        return switch (category) {
            case FOOD -> "Nourriture";
            case TRANSPORT -> "Transport";
            case ACCOMMODATION -> "Hébergement";
            case ACTIVITIES -> "Activités";
            case SHOPPING -> "Shopping";
            case GROCERIES -> "Courses";
            case BILLS -> "Factures";
            case OTHER -> "Autre";
        };
    }
}
