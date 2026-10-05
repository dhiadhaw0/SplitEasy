package com.spliteasy.dto.request;

import com.spliteasy.entity.enums.Category;
import com.spliteasy.entity.enums.Currency;
import com.spliteasy.entity.enums.RecurrenceInterval;
import com.spliteasy.entity.enums.SplitType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ExpenseRequest(

        @NotBlank(message = "Le titre est obligatoire")
        @Size(max = 100, message = "Le titre ne doit pas dépasser 100 caractères")
        String title,

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant doit être supérieur à 0")
        @Digits(integer = 10, fraction = 2, message = "Le montant doit avoir au plus 10 chiffres entiers et 2 décimales")
        BigDecimal amount,

        @NotNull(message = "La date est obligatoire")
        LocalDate date,

        Category category,

        @NotNull(message = "Le payeur est obligatoire")
        Long paidById,

        @NotNull(message = "Le type de répartition est obligatoire")
        SplitType splitType,

        @NotEmpty(message = "Il faut au moins un bénéficiaire")
        @Valid
        List<ShareRequest> shares,

        /** Null/false means a one-off expense; the transfer type ignores this entirely. */
        Boolean recurring,

        /** Required when {@code recurring} is true; validated in the service layer. */
        RecurrenceInterval recurrenceInterval,

        /** Null means "the group's currency" (no conversion). Otherwise {@code amount} is read as
         * this currency and converted to the group's currency via a live exchange rate. */
        Currency currency
) {
    public boolean isRecurring() {
        return Boolean.TRUE.equals(recurring);
    }
}
