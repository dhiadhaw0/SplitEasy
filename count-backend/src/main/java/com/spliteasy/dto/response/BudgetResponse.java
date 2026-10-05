package com.spliteasy.dto.response;

import com.spliteasy.entity.enums.BudgetPeriod;
import com.spliteasy.entity.enums.Category;

import java.math.BigDecimal;
import java.time.Instant;

public record BudgetResponse(
        Long id,
        /** Null means this budget covers every category combined. */
        Category category,
        BigDecimal amountLimit,
        BudgetPeriod period,
        /** Already spent in the current period (converted to the group's currency). */
        BigDecimal spent,
        BigDecimal remaining,
        /** 0-100+; can exceed 100 when the budget is blown. */
        int percentage,
        boolean exceeded,
        Instant createdAt
) {
}
