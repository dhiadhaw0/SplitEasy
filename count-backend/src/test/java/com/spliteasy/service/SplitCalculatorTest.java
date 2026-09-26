package com.spliteasy.service;

import com.spliteasy.dto.request.ShareRequest;
import com.spliteasy.entity.ExpenseShare;
import com.spliteasy.entity.Participant;
import com.spliteasy.entity.enums.SplitType;
import com.spliteasy.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SplitCalculatorTest {

    private final SplitCalculator calculator = new SplitCalculator();

    private Participant participant(long id, String name) {
        Participant p = Participant.builder().name(name).build();
        p.setId(id);
        return p;
    }

    private Map<Long, Participant> participantMap(Participant... participants) {
        Map<Long, Participant> map = new LinkedHashMap<>();
        for (Participant p : participants) {
            map.put(p.getId(), p);
        }
        return map;
    }

    private BigDecimal amountFor(List<ExpenseShare> shares, long participantId) {
        return shares.stream()
                .filter(s -> s.getParticipant().getId() == participantId)
                .findFirst()
                .orElseThrow()
                .getAmount();
    }

    @Test
    void equal_100_divided_by_3_gives_extra_cent_to_lowest_id() {
        Participant p1 = participant(1, "Alice");
        Participant p2 = participant(2, "Bob");
        Participant p3 = participant(3, "Chloé");
        Map<Long, Participant> participants = participantMap(p1, p2, p3);

        List<ShareRequest> requests = List.of(
                new ShareRequest(1L, null),
                new ShareRequest(2L, null),
                new ShareRequest(3L, null)
        );

        List<ExpenseShare> shares = calculator.computeShares(new BigDecimal("100.00"), SplitType.EQUAL, requests, participants);

        assertThat(amountFor(shares, 1)).isEqualByComparingTo("33.34");
        assertThat(amountFor(shares, 2)).isEqualByComparingTo("33.33");
        assertThat(amountFor(shares, 3)).isEqualByComparingTo("33.33");
        assertThat(shares.stream().map(ExpenseShare::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo("100.00");
    }

    @Test
    void shares_2_1_1_split_proportionally() {
        Participant p1 = participant(1, "Alice");
        Participant p2 = participant(2, "Bob");
        Participant p3 = participant(3, "Chloé");
        Map<Long, Participant> participants = participantMap(p1, p2, p3);

        List<ShareRequest> requests = List.of(
                new ShareRequest(1L, new BigDecimal("2")),
                new ShareRequest(2L, new BigDecimal("1")),
                new ShareRequest(3L, new BigDecimal("1"))
        );

        List<ExpenseShare> shares = calculator.computeShares(new BigDecimal("40.00"), SplitType.SHARES, requests, participants);

        assertThat(amountFor(shares, 1)).isEqualByComparingTo("20.00");
        assertThat(amountFor(shares, 2)).isEqualByComparingTo("10.00");
        assertThat(amountFor(shares, 3)).isEqualByComparingTo("10.00");
    }

    @Test
    void shares_distributes_remainder_cents_to_lowest_id() {
        Participant p1 = participant(1, "Alice");
        Participant p2 = participant(2, "Bob");
        Map<Long, Participant> participants = participantMap(p1, p2);

        List<ShareRequest> requests = List.of(
                new ShareRequest(1L, new BigDecimal("1")),
                new ShareRequest(2L, new BigDecimal("2"))
        );

        // 10 * 1/3 = 3.33..., 10 * 2/3 = 6.66... -> DOWN gives 3.33 + 6.66 = 9.99, remainder 0.01 to id 1.
        List<ExpenseShare> shares = calculator.computeShares(new BigDecimal("10.00"), SplitType.SHARES, requests, participants);

        assertThat(amountFor(shares, 1)).isEqualByComparingTo("3.34");
        assertThat(amountFor(shares, 2)).isEqualByComparingTo("6.66");
    }

    @Test
    void amounts_matching_total_are_accepted() {
        Participant p1 = participant(1, "Alice");
        Participant p2 = participant(2, "Bob");
        Map<Long, Participant> participants = participantMap(p1, p2);

        List<ShareRequest> requests = List.of(
                new ShareRequest(1L, new BigDecimal("30.00")),
                new ShareRequest(2L, new BigDecimal("70.00"))
        );

        List<ExpenseShare> shares = calculator.computeShares(new BigDecimal("100.00"), SplitType.AMOUNTS, requests, participants);

        assertThat(amountFor(shares, 1)).isEqualByComparingTo("30.00");
        assertThat(amountFor(shares, 2)).isEqualByComparingTo("70.00");
    }

    @Test
    void amounts_not_matching_total_throws() {
        Participant p1 = participant(1, "Alice");
        Participant p2 = participant(2, "Bob");
        Map<Long, Participant> participants = participantMap(p1, p2);

        List<ShareRequest> requests = List.of(
                new ShareRequest(1L, new BigDecimal("30.00")),
                new ShareRequest(2L, new BigDecimal("60.00"))
        );

        assertThatThrownBy(() ->
                calculator.computeShares(new BigDecimal("100.00"), SplitType.AMOUNTS, requests, participants))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("90.00")
                .hasMessageContaining("100.00");
    }

    @Test
    void percentages_not_summing_to_100_throws() {
        Participant p1 = participant(1, "Alice");
        Participant p2 = participant(2, "Bob");
        Map<Long, Participant> participants = participantMap(p1, p2);

        List<ShareRequest> requests = List.of(
                new ShareRequest(1L, new BigDecimal("40")),
                new ShareRequest(2L, new BigDecimal("50"))
        );

        assertThatThrownBy(() ->
                calculator.computeShares(new BigDecimal("100.00"), SplitType.PERCENTAGES, requests, participants))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("100");
    }

    @Test
    void percentages_33_33_34_are_accepted() {
        Participant p1 = participant(1, "Alice");
        Participant p2 = participant(2, "Bob");
        Participant p3 = participant(3, "Chloé");
        Map<Long, Participant> participants = participantMap(p1, p2, p3);

        List<ShareRequest> requests = List.of(
                new ShareRequest(1L, new BigDecimal("33.33")),
                new ShareRequest(2L, new BigDecimal("33.33")),
                new ShareRequest(3L, new BigDecimal("33.34"))
        );

        List<ExpenseShare> shares = calculator.computeShares(new BigDecimal("100.00"), SplitType.PERCENTAGES, requests, participants);

        assertThat(shares.stream().map(ExpenseShare::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo("100.00");
    }

    @Test
    void duplicate_beneficiary_throws() {
        Participant p1 = participant(1, "Alice");
        Map<Long, Participant> participants = participantMap(p1);

        List<ShareRequest> requests = List.of(
                new ShareRequest(1L, null),
                new ShareRequest(1L, null)
        );

        assertThatThrownBy(() -> calculator.computeShares(new BigDecimal("10.00"), SplitType.EQUAL, requests, participants))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("plusieurs fois");
    }

    @Test
    void beneficiary_outside_group_throws() {
        Participant p1 = participant(1, "Alice");
        Map<Long, Participant> participants = participantMap(p1);

        List<ShareRequest> requests = List.of(new ShareRequest(999L, null));

        assertThatThrownBy(() -> calculator.computeShares(new BigDecimal("10.00"), SplitType.EQUAL, requests, participants))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void zero_weight_in_shares_split_throws() {
        Participant p1 = participant(1, "Alice");
        Participant p2 = participant(2, "Bob");
        Map<Long, Participant> participants = participantMap(p1, p2);

        List<ShareRequest> requests = List.of(
                new ShareRequest(1L, BigDecimal.ZERO),
                new ShareRequest(2L, new BigDecimal("1"))
        );

        assertThatThrownBy(() -> calculator.computeShares(new BigDecimal("10.00"), SplitType.SHARES, requests, participants))
                .isInstanceOf(BadRequestException.class);
    }
}
