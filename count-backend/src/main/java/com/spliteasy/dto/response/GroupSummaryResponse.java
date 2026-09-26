package com.spliteasy.dto.response;

import com.spliteasy.entity.enums.Currency;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Lightweight view of a group for the "my groups" list, including the caller's own balance.
 */
public record GroupSummaryResponse(
        Long id,
        String name,
        String description,
        Currency currency,
        int participantCount,
        BigDecimal totalSpent,
        BigDecimal myBalance,
        Instant updatedAt
) {
}
