package com.spliteasy.dto.response;

import java.math.BigDecimal;

/**
 * One suggested transfer in the minimal-settlement plan: "fromName owes amount to toName".
 */
public record SettlementResponse(
        Long fromParticipantId,
        String fromName,
        Long toParticipantId,
        String toName,
        BigDecimal amount
) {
}
