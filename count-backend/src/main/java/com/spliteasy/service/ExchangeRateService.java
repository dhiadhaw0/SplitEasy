package com.spliteasy.service;

import com.spliteasy.dto.response.ExchangeRateHistoryResponse;
import com.spliteasy.entity.enums.Currency;

import java.math.BigDecimal;

public interface ExchangeRateService {

    /**
     * Live conversion rate such that {@code amountIn(from) * rate = amountIn(to)}.
     * Returns exactly {@link BigDecimal#ONE} when {@code from == to} without any network call.
     *
     * @throws com.spliteasy.exception.BadRequestException if no rate could be obtained.
     */
    BigDecimal getRate(Currency from, Currency to);

    /**
     * Daily rate history over the last {@code days} days. {@link ExchangeRateHistoryResponse#available()}
     * is false (with an empty point list, never an exception) when the pair isn't covered by the
     * free historical provider — the caller decides how to degrade (e.g. hide the chart).
     */
    ExchangeRateHistoryResponse getHistory(Currency from, Currency to, int days);
}
