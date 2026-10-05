package com.spliteasy.dto.request;

import com.spliteasy.entity.enums.BudgetPeriod;
import com.spliteasy.entity.enums.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BudgetRequest(

        /** Null means this budget covers every category combined. */
        Category category,

        @NotNull(message = "Le montant limite est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant limite doit être supérieur à 0")
        @Digits(integer = 10, fraction = 2, message = "Le montant doit avoir au plus 10 chiffres entiers et 2 décimales")
        BigDecimal amountLimit,

        @NotNull(message = "La période est obligatoire")
        BudgetPeriod period
) {
}
