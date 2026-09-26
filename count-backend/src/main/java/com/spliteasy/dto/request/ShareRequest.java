package com.spliteasy.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * One beneficiary's raw input for an expense split: a weight, a percentage or an exact
 * amount depending on the expense's {@code splitType}. Null {@code value} for EQUAL.
 */
public record ShareRequest(

        @NotNull(message = "L'identifiant du bénéficiaire est obligatoire")
        Long participantId,

        BigDecimal value
) {
}
