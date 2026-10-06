package com.spliteasy.service;

import com.spliteasy.dto.request.BudgetRequest;
import com.spliteasy.dto.response.BudgetResponse;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.User;
import com.spliteasy.entity.enums.Category;

import java.math.BigDecimal;
import java.util.List;

public interface BudgetService {

    List<BudgetResponse> list(Long groupId);

    /** @throws com.spliteasy.exception.ConflictException if the group already has a budget for that category. */
    BudgetResponse create(Long groupId, BudgetRequest request);

    BudgetResponse update(Long groupId, Long budgetId, BudgetRequest request);

    void delete(Long groupId, Long budgetId);

    /**
     * Logs a {@code BUDGET_EXCEEDED} activity for every budget (the category-specific one, and/or
     * the group's overall one) that this expense just pushed from under its limit to over it.
     * Called right after an expense is saved; does nothing if no budget was crossed.
     */
    void checkExceededByExpense(ExpenseGroup group, Category expenseCategory, BigDecimal expenseAmount, User actor);
}
