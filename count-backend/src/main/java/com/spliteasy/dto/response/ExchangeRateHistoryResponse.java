package com.spliteasy.dto.response;

import java.util.List;

/**
 * {@code available} is false when the pair isn't covered by the free historical rates provider
 * (currently only EUR/USD/GBP/CHF) — the "latest" single-rate conversion used when creating an
 * expense has broader coverage (includes TND/MAD) but no history, so the two can disagree.
 */
public record ExchangeRateHistoryResponse(boolean available, List<RatePointResponse> points) {
}
