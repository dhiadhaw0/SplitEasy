package com.spliteasy.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SettlementRequest(

        @NotNull(message = "Le participant qui rembourse est obligatoire")
        Long fromParticipantId,

        @NotNull(message = "Le participant qui reçoit le remboursement est obligatoire")
        Long toParticipantId,

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant doit être supérieur à 0")
        @Digits(integer = 10, fraction = 2, message = "Le montant doit avoir au plus 10 chiffres entiers et 2 décimales")
        BigDecimal amount,

        @NotNull(message = "La date est obligatoire")
        LocalDate date
) {
}
