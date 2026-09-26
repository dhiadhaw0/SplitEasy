package com.spliteasy.service.impl;

import com.spliteasy.dto.response.BalanceResponse;
import com.spliteasy.entity.Expense;
import com.spliteasy.entity.ExpenseShare;
import com.spliteasy.entity.Participant;
import com.spliteasy.entity.enums.Category;
import com.spliteasy.entity.enums.ExpenseType;
import com.spliteasy.entity.enums.SplitType;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.repository.ParticipantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BalanceServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private ParticipantRepository participantRepository;

    private BalanceServiceImpl service() {
        return new BalanceServiceImpl(expenseRepository, participantRepository);
    }

    private Participant participant(long id, String name) {
        Participant p = Participant.builder().name(name).build();
        p.setId(id);
        return p;
    }

    private Expense expense(ExpenseType type, Participant paidBy, BigDecimal amount, List<ExpenseShare> shares) {
        Expense expense = Expense.builder()
                .title("Test")
                .amount(amount)
                .date(LocalDate.now())
                .category(Category.OTHER)
                .type(type)
                .splitType(SplitType.EQUAL)
                .paidBy(paidBy)
                .build();
        for (ExpenseShare share : shares) {
            expense.addShare(share);
        }
        return expense;
    }

    private ExpenseShare share(Participant participant, BigDecimal amount) {
        return ExpenseShare.builder().participant(participant).amount(amount).build();
    }

    @Test
    void sum_of_all_balances_is_always_zero() {
        Participant p1 = participant(1, "Alice");
        Participant p2 = participant(2, "Bob");
        Participant p3 = participant(3, "Chloé");

        Expense dinner = expense(ExpenseType.EXPENSE, p1, new BigDecimal("90.00"), List.of(
                share(p1, new BigDecimal("30.00")),
                share(p2, new BigDecimal("30.00")),
                share(p3, new BigDecimal("30.00"))
        ));

        when(participantRepository.findByGroupIdOrderByNameAsc(1L)).thenReturn(List.of(p1, p2, p3));
        when(expenseRepository.findAllByGroupIdWithShares(1L)).thenReturn(List.of(dinner));

        List<BalanceResponse> balances = service().computeBalances(1L);

        BigDecimal sum = balances.stream().map(BalanceResponse::balance).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sum).isEqualByComparingTo(BigDecimal.ZERO);

        assertThat(balanceOf(balances, 1L)).isEqualByComparingTo("60.00");
        assertThat(balanceOf(balances, 2L)).isEqualByComparingTo("-30.00");
        assertThat(balanceOf(balances, 3L)).isEqualByComparingTo("-30.00");
    }

    @Test
    void a_transfer_settles_the_balance_between_its_two_participants() {
        Participant p1 = participant(1, "Alice"); // creditor
        Participant p2 = participant(2, "Bob");   // debtor
        Participant p3 = participant(3, "Chloé");

        Expense dinner = expense(ExpenseType.EXPENSE, p1, new BigDecimal("90.00"), List.of(
                share(p1, new BigDecimal("30.00")),
                share(p2, new BigDecimal("30.00")),
                share(p3, new BigDecimal("30.00"))
        ));
        // Bob (debtor) reimburses Alice (creditor) his full 30.00 debt.
        Expense transfer = expense(ExpenseType.TRANSFER, p2, new BigDecimal("30.00"), List.of(
                share(p1, new BigDecimal("30.00"))
        ));

        when(participantRepository.findByGroupIdOrderByNameAsc(1L)).thenReturn(List.of(p1, p2, p3));
        when(expenseRepository.findAllByGroupIdWithShares(1L)).thenReturn(List.of(dinner, transfer));

        List<BalanceResponse> balances = service().computeBalances(1L);

        // Bob's debt (-30.00) is fully settled by the transfer.
        assertThat(balanceOf(balances, 2L)).isEqualByComparingTo(BigDecimal.ZERO);
        // Alice's credit drops from 60 to 30 (she is still owed 30 by Chloé).
        assertThat(balanceOf(balances, 1L)).isEqualByComparingTo("30.00");
        assertThat(balanceOf(balances, 3L)).isEqualByComparingTo("-30.00");

        BigDecimal sum = balances.stream().map(BalanceResponse::balance).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sum).isEqualByComparingTo(BigDecimal.ZERO);
    }

    private BigDecimal balanceOf(List<BalanceResponse> balances, long participantId) {
        return balances.stream()
                .filter(b -> b.participantId() == participantId)
                .findFirst()
                .orElseThrow()
                .balance();
    }
}
