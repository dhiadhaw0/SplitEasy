package com.spliteasy.service.impl;

import com.spliteasy.dto.request.SettlementRequest;
import com.spliteasy.dto.response.BalanceResponse;
import com.spliteasy.dto.response.ExpenseResponse;
import com.spliteasy.dto.response.SettlementResponse;
import com.spliteasy.entity.Expense;
import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.ExpenseShare;
import com.spliteasy.entity.Participant;
import com.spliteasy.entity.User;
import com.spliteasy.entity.enums.Category;
import com.spliteasy.entity.enums.ExpenseType;
import com.spliteasy.entity.enums.SplitType;
import com.spliteasy.exception.BadRequestException;
import com.spliteasy.exception.ResourceNotFoundException;
import com.spliteasy.mapper.ExpenseMapper;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.repository.UserRepository;
import com.spliteasy.service.BalanceService;
import com.spliteasy.service.GroupAccessService;
import com.spliteasy.service.SettlementService;
import com.spliteasy.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SettlementServiceImpl implements SettlementService {

    private final BalanceService balanceService;
    private final GroupAccessService groupAccessService;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseMapper expenseMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SettlementResponse> suggest(Long groupId) {
        List<BalanceResponse> balances = balanceService.computeBalances(groupId);

        List<MutableAmount> creditors = new ArrayList<>();
        List<MutableAmount> debtors = new ArrayList<>();
        for (BalanceResponse balance : balances) {
            if (MoneyUtils.isPositive(balance.balance())) {
                creditors.add(new MutableAmount(balance.participantId(), balance.participantName(), balance.balance()));
            } else if (MoneyUtils.isNegative(balance.balance())) {
                debtors.add(new MutableAmount(balance.participantId(), balance.participantName(), balance.balance().abs()));
            }
        }

        List<SettlementResponse> settlements = new ArrayList<>();
        // At most (n - 1) transfers are ever needed for n participants: each iteration fully
        // settles at least one side, so this bound also protects against an algorithm bug looping forever.
        int maxIterations = balances.size();

        for (int i = 0; i < maxIterations; i++) {
            creditors.removeIf(c -> MoneyUtils.isNegligible(c.amount));
            debtors.removeIf(d -> MoneyUtils.isNegligible(d.amount));
            if (creditors.isEmpty() || debtors.isEmpty()) {
                break;
            }

            creditors.sort(Comparator.comparing((MutableAmount c) -> c.amount).reversed());
            debtors.sort(Comparator.comparing((MutableAmount d) -> d.amount).reversed());

            MutableAmount topCreditor = creditors.get(0);
            MutableAmount topDebtor = debtors.get(0);
            BigDecimal transferAmount = MoneyUtils.scale(topCreditor.amount.min(topDebtor.amount));

            settlements.add(new SettlementResponse(
                    topDebtor.participantId, topDebtor.name, topCreditor.participantId, topCreditor.name, transferAmount));

            topCreditor.amount = topCreditor.amount.subtract(transferAmount);
            topDebtor.amount = topDebtor.amount.subtract(transferAmount);
        }

        return settlements;
    }

    @Override
    public ExpenseResponse recordSettlement(Long groupId, SettlementRequest request, Long userId) {
        if (request.fromParticipantId().equals(request.toParticipantId())) {
            throw new BadRequestException("Un remboursement doit concerner deux participants différents.");
        }

        ExpenseGroup group = groupAccessService.getGroupOrThrow(groupId);
        Participant from = participantRepository.findByIdAndGroupId(request.fromParticipantId(), groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant introuvable dans ce groupe."));
        Participant to = participantRepository.findByIdAndGroupId(request.toParticipantId(), groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant introuvable dans ce groupe."));
        User createdBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        BigDecimal amount = MoneyUtils.scale(request.amount());

        Expense transfer = Expense.builder()
                .title("Remboursement")
                .amount(amount)
                .date(request.date())
                .category(Category.OTHER)
                .type(ExpenseType.TRANSFER)
                .splitType(SplitType.AMOUNTS)
                .paidBy(from)
                .createdBy(createdBy)
                .build();
        group.addExpense(transfer);
        transfer.addShare(ExpenseShare.builder()
                .participant(to)
                .shareValue(amount)
                .amount(amount)
                .build());

        transfer = expenseRepository.save(transfer);
        return expenseMapper.toResponse(transfer);
    }

    /** Mutable working copy of a balance, used only while running the greedy algorithm. */
    private static final class MutableAmount {
        private final Long participantId;
        private final String name;
        private BigDecimal amount;

        private MutableAmount(Long participantId, String name, BigDecimal amount) {
            this.participantId = participantId;
            this.name = name;
            this.amount = amount;
        }
    }
}
