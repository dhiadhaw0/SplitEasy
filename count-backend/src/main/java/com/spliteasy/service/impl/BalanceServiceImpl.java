package com.spliteasy.service.impl;

import com.spliteasy.dto.response.BalanceResponse;
import com.spliteasy.entity.Expense;
import com.spliteasy.entity.ExpenseShare;
import com.spliteasy.entity.Participant;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.service.BalanceService;
import com.spliteasy.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BalanceServiceImpl implements BalanceService {

    private final ExpenseRepository expenseRepository;
    private final ParticipantRepository participantRepository;

    @Override
    public List<BalanceResponse> computeBalances(Long groupId) {
        List<Participant> participants = participantRepository.findByGroupIdOrderByNameAsc(groupId);

        Map<Long, BigDecimal> totalPaid = new LinkedHashMap<>();
        Map<Long, BigDecimal> totalOwed = new LinkedHashMap<>();
        for (Participant participant : participants) {
            totalPaid.put(participant.getId(), MoneyUtils.ZERO);
            totalOwed.put(participant.getId(), MoneyUtils.ZERO);
        }

        // Includes TRANSFER expenses on purpose: a settlement payment is what brings the
        // payer's and the receiver's balances back towards zero.
        List<Expense> expenses = expenseRepository.findAllByGroupIdWithShares(groupId);
        for (Expense expense : expenses) {
            totalPaid.merge(expense.getPaidBy().getId(), expense.getAmount(), BigDecimal::add);
            for (ExpenseShare share : expense.getShares()) {
                totalOwed.merge(share.getParticipant().getId(), share.getAmount(), BigDecimal::add);
            }
        }

        List<BalanceResponse> result = new ArrayList<>();
        for (Participant participant : participants) {
            BigDecimal paid = MoneyUtils.scale(totalPaid.getOrDefault(participant.getId(), MoneyUtils.ZERO));
            BigDecimal owed = MoneyUtils.scale(totalOwed.getOrDefault(participant.getId(), MoneyUtils.ZERO));
            BigDecimal balance = MoneyUtils.scale(paid.subtract(owed));
            result.add(new BalanceResponse(participant.getId(), participant.getName(), paid, owed, balance));
        }
        return result;
    }

    @Override
    public BigDecimal getBalanceFor(Long groupId, Long participantId) {
        return computeBalances(groupId).stream()
                .filter(balance -> balance.participantId().equals(participantId))
                .map(BalanceResponse::balance)
                .findFirst()
                .orElse(MoneyUtils.ZERO);
    }
}
