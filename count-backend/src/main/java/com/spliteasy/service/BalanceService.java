package com.spliteasy.service;

import com.spliteasy.dto.response.BalanceResponse;

import java.math.BigDecimal;
import java.util.List;

public interface BalanceService {

    /**
     * Balances are never persisted: they are recomputed from every expense (including
     * TRANSFERs, which is what keeps the total at zero) on every call.
     */
    List<BalanceResponse> computeBalances(Long groupId);

    /** Convenience accessor for a single participant's balance; defaults to zero if unknown. */
    BigDecimal getBalanceFor(Long groupId, Long participantId);
}
