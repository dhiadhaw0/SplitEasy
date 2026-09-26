package com.spliteasy.dto.response;

import java.math.BigDecimal;

/**
 * balance = totalPaid - totalOwed. Positive: this participant is owed money.
 * Negative: this participant owes money.
 */
public record BalanceResponse(
        Long participantId,
        String participantName,
        BigDecimal totalPaid,
        BigDecimal totalOwed,
        BigDecimal balance
) {
}
