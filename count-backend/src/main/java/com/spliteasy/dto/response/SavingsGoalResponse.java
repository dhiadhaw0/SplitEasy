package com.spliteasy.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record SavingsGoalResponse(
        Long id,
        String name,
        BigDecimal targetAmount,
        LocalDate deadline,
        BigDecimal currentAmount,
        /** 0-100+; can exceed 100 if contributions overshoot the target. */
        int percentage,
        boolean achieved,
        List<SavingsContributionResponse> contributions,
        Instant createdAt
) {
}
