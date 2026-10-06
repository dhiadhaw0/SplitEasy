package com.spliteasy.service.impl;

import com.spliteasy.dto.response.BalanceResponse;
import com.spliteasy.dto.response.SettlementResponse;
import com.spliteasy.mapper.ExpenseMapper;
import com.spliteasy.repository.ExpenseRepository;
import com.spliteasy.repository.ParticipantRepository;
import com.spliteasy.repository.UserRepository;
import com.spliteasy.service.ActivityService;
import com.spliteasy.service.BalanceService;
import com.spliteasy.service.GroupAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettlementServiceTest {

    @Mock
    private BalanceService balanceService;
    @Mock
    private GroupAccessService groupAccessService;
    @Mock
    private ParticipantRepository participantRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private ExpenseMapper expenseMapper;
    @Mock
    private ActivityService activityService;

    private SettlementServiceImpl newService() {
        return new SettlementServiceImpl(
                balanceService, groupAccessService, participantRepository, userRepository, expenseRepository, expenseMapper,
                activityService);
    }

    @Test
    void three_participants_A_plus30_B_minus20_C_minus10_produce_two_transfers() {
        when(balanceService.computeBalances(1L)).thenReturn(List.of(
                new BalanceResponse(1L, "A", new BigDecimal("30.00"), BigDecimal.ZERO, new BigDecimal("30.00")),
                new BalanceResponse(2L, "B", BigDecimal.ZERO, new BigDecimal("20.00"), new BigDecimal("-20.00")),
                new BalanceResponse(3L, "C", BigDecimal.ZERO, new BigDecimal("10.00"), new BigDecimal("-10.00"))
        ));

        List<SettlementResponse> settlements = newService().suggest(1L);

        assertThat(settlements).hasSize(2);
        // Largest debtor (B, -20) is matched with the creditor (A) first.
        assertThat(settlements.get(0).fromParticipantId()).isEqualTo(2L);
        assertThat(settlements.get(0).toParticipantId()).isEqualTo(1L);
        assertThat(settlements.get(0).amount()).isEqualByComparingTo("20.00");
        // Then the remaining debtor (C, -10) settles the rest of A's credit.
        assertThat(settlements.get(1).fromParticipantId()).isEqualTo(3L);
        assertThat(settlements.get(1).toParticipantId()).isEqualTo(1L);
        assertThat(settlements.get(1).amount()).isEqualByComparingTo("10.00");
    }

    @Test
    void all_balances_zero_produce_no_settlements() {
        when(balanceService.computeBalances(1L)).thenReturn(List.of(
                new BalanceResponse(1L, "A", new BigDecimal("50.00"), new BigDecimal("50.00"), BigDecimal.ZERO),
                new BalanceResponse(2L, "B", new BigDecimal("50.00"), new BigDecimal("50.00"), BigDecimal.ZERO)
        ));

        List<SettlementResponse> settlements = newService().suggest(1L);

        assertThat(settlements).isEmpty();
    }

    @Test
    void never_produces_more_than_n_minus_one_transfers() {
        // 4 participants, none of whose balances are trivially a multiple of another:
        // A:+15, B:+45, C:-20, D:-40 (sum = 0).
        when(balanceService.computeBalances(1L)).thenReturn(List.of(
                new BalanceResponse(1L, "A", new BigDecimal("15.00"), BigDecimal.ZERO, new BigDecimal("15.00")),
                new BalanceResponse(2L, "B", new BigDecimal("45.00"), BigDecimal.ZERO, new BigDecimal("45.00")),
                new BalanceResponse(3L, "C", BigDecimal.ZERO, new BigDecimal("20.00"), new BigDecimal("-20.00")),
                new BalanceResponse(4L, "D", BigDecimal.ZERO, new BigDecimal("40.00"), new BigDecimal("-40.00"))
        ));

        List<SettlementResponse> settlements = newService().suggest(1L);

        assertThat(settlements.size()).isLessThanOrEqualTo(3); // n - 1 for n = 4

        BigDecimal totalTransferred = settlements.stream()
                .map(SettlementResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalTransferred).isEqualByComparingTo("60.00"); // total debt actually settled
    }
}
