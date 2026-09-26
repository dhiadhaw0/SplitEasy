package com.spliteasy.service;

import com.spliteasy.dto.request.SettlementRequest;
import com.spliteasy.dto.response.ExpenseResponse;
import com.spliteasy.dto.response.SettlementResponse;

import java.util.List;

public interface SettlementService {

    /**
     * Greedy debt-simplification algorithm: repeatedly matches the largest creditor with the
     * largest debtor. Produces at most (n - 1) transfers for n participants; not guaranteed to
     * be the absolute theoretical minimum (an NP-hard problem), but deterministic and stable.
     */
    List<SettlementResponse> suggest(Long groupId);

    /** Records a settlement as a TRANSFER expense: payer = from, single beneficiary = to. */
    ExpenseResponse recordSettlement(Long groupId, SettlementRequest request, Long userId);
}
