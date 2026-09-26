package com.spliteasy.service;

import com.spliteasy.dto.request.ExpenseRequest;
import com.spliteasy.dto.response.ExpenseResponse;
import com.spliteasy.dto.response.PageResponse;
import com.spliteasy.entity.enums.Category;
import org.springframework.data.domain.Pageable;

public interface ExpenseService {

    PageResponse<ExpenseResponse> list(Long groupId, Category category, Long participantId, Pageable pageable);

    ExpenseResponse get(Long groupId, Long expenseId);

    ExpenseResponse create(Long groupId, ExpenseRequest request, Long userId);

    /** Replaces every share of the expense (shares are cleared, then recomputed from scratch). */
    ExpenseResponse update(Long groupId, Long expenseId, ExpenseRequest request, Long userId);

    void delete(Long groupId, Long expenseId);
}
