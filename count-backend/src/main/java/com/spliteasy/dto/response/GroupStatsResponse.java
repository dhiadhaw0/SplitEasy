package com.spliteasy.dto.response;

import com.spliteasy.entity.enums.Category;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Group statistics. TRANSFER expenses are excluded from every figure here.
 */
public record GroupStatsResponse(
        BigDecimal totalSpent,
        long expenseCount,
        Map<Category, BigDecimal> byCategory,
        List<ParticipantStatResponse> byParticipant
) {
}
