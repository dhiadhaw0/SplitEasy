package com.spliteasy.service;

import com.spliteasy.dto.request.BudgetRequest;
import com.spliteasy.dto.response.BudgetResponse;

import java.util.List;

public interface BudgetService {

    List<BudgetResponse> list(Long groupId);

    /** @throws com.spliteasy.exception.ConflictException if the group already has a budget for that category. */
    BudgetResponse create(Long groupId, BudgetRequest request);

    BudgetResponse update(Long groupId, Long budgetId, BudgetRequest request);

    void delete(Long groupId, Long budgetId);
}
