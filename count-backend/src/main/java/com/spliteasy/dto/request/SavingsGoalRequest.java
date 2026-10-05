package com.spliteasy.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalRequest(

        @NotBlank(message = "Le nom est obligatoire")
        @Size(max = 80, message = "Le nom ne doit pas dépasser 80 caractères")
        String name,

        @NotNull(message = "Le montant cible est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant cible doit être supérieur à 0")
        @Digits(integer = 10, fraction = 2, message = "Le montant doit avoir au plus 10 chiffres entiers et 2 décimales")
        BigDecimal targetAmount,

        /** Optional, purely informational. */
        LocalDate deadline
) {
}
