package com.spliteasy.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record SavingsContributionResponse(
        Long id,
        Long participantId,
        String participantName,
        BigDecimal amount,
        String note,
        Instant createdAt
) {
}
