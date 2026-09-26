package com.spliteasy.dto.response;

import java.math.BigDecimal;

public record ShareResponse(
        Long participantId,
        String participantName,
        BigDecimal value,
        BigDecimal amount
) {
}
