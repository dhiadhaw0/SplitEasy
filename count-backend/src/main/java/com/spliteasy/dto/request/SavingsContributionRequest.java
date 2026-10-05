package com.spliteasy.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SavingsContributionRequest(

        @NotNull(message = "Le participant est obligatoire")
        Long participantId,

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant doit être supérieur à 0")
        @Digits(integer = 10, fraction = 2, message = "Le montant doit avoir au plus 10 chiffres entiers et 2 décimales")
        BigDecimal amount,

        @Size(max = 255, message = "La note ne doit pas dépasser 255 caractères")
        String note
) {
}
