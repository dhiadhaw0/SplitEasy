package com.spliteasy.dto.response;

import java.math.BigDecimal;

public record ParticipantStatResponse(
        Long participantId,
        String name,
        BigDecimal paid,
        BigDecimal consumed
) {
}
