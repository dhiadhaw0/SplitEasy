package com.spliteasy.dto.response;

import com.spliteasy.entity.enums.Category;
import com.spliteasy.entity.enums.Currency;
import com.spliteasy.entity.enums.ExpenseType;
import com.spliteasy.entity.enums.RecurrenceInterval;
import com.spliteasy.entity.enums.SplitType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ExpenseResponse(
        Long id,
        String title,
        BigDecimal amount,
        LocalDate date,
        Category category,
        ExpenseType type,
        SplitType splitType,
        ParticipantResponse paidBy,
        List<ShareResponse> shares,
        boolean recurring,
        RecurrenceInterval recurrenceInterval,
        LocalDate nextOccurrenceDate,
        /** Null unless this expense was entered in a currency other than the group's. */
        Currency originalCurrency,
        BigDecimal originalAmount,
        BigDecimal exchangeRate,
        Instant createdAt
) {
}
