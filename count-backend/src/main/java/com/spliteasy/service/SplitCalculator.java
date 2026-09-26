package com.spliteasy.service;

import com.spliteasy.dto.request.ShareRequest;
import com.spliteasy.entity.ExpenseShare;
import com.spliteasy.entity.Participant;
import com.spliteasy.entity.enums.SplitType;
import com.spliteasy.exception.BadRequestException;
import com.spliteasy.util.MoneyUtils;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Pure, dependency-free computation of expense shares. Takes plain inputs (amount, split
 * type, raw requested values, and the already-loaded Participant entities of the group) and
 * returns ready-to-persist {@link ExpenseShare} instances (not yet attached to an Expense).
 *
 * <p>Rounding rule: each share is first rounded DOWN to 2 decimals, then the leftover cents
 * (always strictly fewer than the number of beneficiaries) are handed out one by one to the
 * beneficiaries with the smallest participant id, so results are deterministic and reproducible.
 */
@Component
public class SplitCalculator {

    private static final BigDecimal ONE_CENT = new BigDecimal("0.01");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    public List<ExpenseShare> computeShares(
            BigDecimal amount, SplitType type, List<ShareRequest> shareRequests, Map<Long, Participant> participantsById) {

        validateNoDuplicates(shareRequests);

        Map<Long, BigDecimal> valuesById = new LinkedHashMap<>();
        List<Long> participantIds = new ArrayList<>();
        for (ShareRequest request : shareRequests) {
            Participant participant = participantsById.get(request.participantId());
            if (participant == null) {
                throw new BadRequestException(
                        "Le bénéficiaire %d n'appartient pas au groupe de la dépense.".formatted(request.participantId()));
            }
            participantIds.add(request.participantId());
            valuesById.put(request.participantId(), request.value());
        }
        participantIds.sort(Long::compareTo);

        Map<Long, BigDecimal> amountsById = switch (type) {
            case EQUAL -> computeEqual(amount, participantIds);
            case AMOUNTS -> computeExactAmounts(amount, participantIds, valuesById);
            case SHARES -> computeWeighted(amount, participantIds, valuesById);
            case PERCENTAGES -> computePercentages(amount, participantIds, valuesById);
        };

        BigDecimal total = MoneyUtils.sum(amountsById.values());
        if (!MoneyUtils.amountsEqual(total, amount)) {
            throw new IllegalStateException(
                    "Erreur interne : la somme des parts (%s) ne correspond pas au montant de la dépense (%s)."
                            .formatted(total, amount));
        }

        List<ExpenseShare> result = new ArrayList<>();
        for (Long id : participantIds) {
            result.add(ExpenseShare.builder()
                    .participant(participantsById.get(id))
                    .shareValue(type == SplitType.EQUAL ? null : valuesById.get(id))
                    .amount(amountsById.get(id))
                    .build());
        }
        return result;
    }

    private Map<Long, BigDecimal> computeEqual(BigDecimal amount, List<Long> ids) {
        BigDecimal base = amount.divide(BigDecimal.valueOf(ids.size()), 2, RoundingMode.DOWN);
        Map<Long, BigDecimal> amounts = new LinkedHashMap<>();
        for (Long id : ids) {
            amounts.put(id, base);
        }
        return distributeRemainder(amount, ids, amounts);
    }

    private Map<Long, BigDecimal> computeExactAmounts(BigDecimal amount, List<Long> ids, Map<Long, BigDecimal> valuesById) {
        Map<Long, BigDecimal> amounts = new LinkedHashMap<>();
        BigDecimal sum = BigDecimal.ZERO;
        for (Long id : ids) {
            BigDecimal value = valuesById.get(id);
            if (value == null) {
                throw new BadRequestException("Un montant est requis pour chaque bénéficiaire en répartition AMOUNTS.");
            }
            if (MoneyUtils.isNegative(value)) {
                throw new BadRequestException("Les montants saisis doivent être positifs ou nuls.");
            }
            BigDecimal scaled = value.setScale(2, RoundingMode.HALF_UP);
            amounts.put(id, scaled);
            sum = sum.add(scaled);
        }
        if (!MoneyUtils.amountsEqual(sum, amount)) {
            throw new BadRequestException(
                    "La somme des montants (%s) ne correspond pas au total (%s).".formatted(sum, amount));
        }
        return amounts;
    }

    private Map<Long, BigDecimal> computeWeighted(BigDecimal amount, List<Long> ids, Map<Long, BigDecimal> valuesById) {
        Map<Long, BigDecimal> weights = new LinkedHashMap<>();
        BigDecimal totalWeight = BigDecimal.ZERO;
        for (Long id : ids) {
            BigDecimal weight = valuesById.get(id);
            if (weight == null || !MoneyUtils.isPositive(weight)) {
                throw new BadRequestException("Chaque part (poids) doit être strictement positive en répartition SHARES.");
            }
            weights.put(id, weight);
            totalWeight = totalWeight.add(weight);
        }
        Map<Long, BigDecimal> amounts = new LinkedHashMap<>();
        for (Long id : ids) {
            BigDecimal raw = amount.multiply(weights.get(id)).divide(totalWeight, 2, RoundingMode.DOWN);
            amounts.put(id, raw);
        }
        return distributeRemainder(amount, ids, amounts);
    }

    private Map<Long, BigDecimal> computePercentages(BigDecimal amount, List<Long> ids, Map<Long, BigDecimal> valuesById) {
        Map<Long, BigDecimal> percentages = new LinkedHashMap<>();
        BigDecimal totalPercentage = BigDecimal.ZERO;
        for (Long id : ids) {
            BigDecimal percentage = valuesById.get(id);
            if (percentage == null || MoneyUtils.isNegative(percentage)) {
                throw new BadRequestException("Chaque pourcentage doit être positif ou nul en répartition PERCENTAGES.");
            }
            percentages.put(id, percentage);
            totalPercentage = totalPercentage.add(percentage);
        }
        if (totalPercentage.setScale(2, RoundingMode.HALF_UP).compareTo(ONE_HUNDRED.setScale(2)) != 0) {
            throw new BadRequestException(
                    "La somme des pourcentages (%s) doit être égale à 100.".formatted(totalPercentage));
        }
        Map<Long, BigDecimal> amounts = new LinkedHashMap<>();
        for (Long id : ids) {
            BigDecimal raw = amount.multiply(percentages.get(id)).divide(ONE_HUNDRED, 2, RoundingMode.DOWN);
            amounts.put(id, raw);
        }
        return distributeRemainder(amount, ids, amounts);
    }

    /**
     * Hands out the leftover cents (amount - sum of DOWN-rounded bases) one by one to the
     * beneficiaries with the smallest id, in {@code sortedIds} order.
     */
    private Map<Long, BigDecimal> distributeRemainder(BigDecimal amount, List<Long> sortedIds, Map<Long, BigDecimal> baseAmounts) {
        BigDecimal distributed = MoneyUtils.sum(baseAmounts.values());
        BigDecimal remainder = amount.subtract(distributed);
        int remainderCents = remainder.movePointRight(2).setScale(0, RoundingMode.HALF_UP).intValueExact();

        if (remainderCents < 0 || remainderCents >= sortedIds.size()) {
            throw new IllegalStateException("Erreur interne lors de la distribution des centimes restants.");
        }

        Map<Long, BigDecimal> result = new LinkedHashMap<>(baseAmounts);
        for (int i = 0; i < remainderCents; i++) {
            Long id = sortedIds.get(i);
            result.put(id, result.get(id).add(ONE_CENT));
        }
        return result;
    }

    private void validateNoDuplicates(List<ShareRequest> shares) {
        Set<Long> seen = new HashSet<>();
        for (ShareRequest share : shares) {
            if (!seen.add(share.participantId())) {
                throw new BadRequestException(
                        "Le bénéficiaire %d apparaît plusieurs fois dans la répartition.".formatted(share.participantId()));
            }
        }
    }
}
