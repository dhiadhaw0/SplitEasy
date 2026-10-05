package com.spliteasy.service.impl;

import com.spliteasy.dto.response.ExchangeRateHistoryResponse;
import com.spliteasy.dto.response.RatePointResponse;
import com.spliteasy.entity.enums.Currency;
import com.spliteasy.exception.BadRequestException;
import com.spliteasy.service.ExchangeRateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Live exchange rates from exchangerate-api.com's free, keyless endpoint (daily-updated).
 * Responses are cached per base currency for a few hours so adding several expenses in a row
 * doesn't fire one HTTP call each.
 */
@Slf4j
@Service
public class ExchangeRateServiceImpl implements ExchangeRateService {

    private static final java.time.Duration CACHE_TTL = java.time.Duration.of(6, ChronoUnit.HOURS);

    private record CachedRates(Map<String, BigDecimal> rates, Instant fetchedAt) {
        boolean isExpired() {
            return Instant.now().isAfter(fetchedAt.plus(CACHE_TTL));
        }
    }

    private record ApiResponse(String result, Map<String, BigDecimal> rates) {
    }

    /** Frankfurter (ECB-backed) time-series response: date -> currency code -> rate. */
    private record TimeSeriesResponse(String base, Map<String, Map<String, BigDecimal>> rates) {
    }

    private record CachedHistory(ExchangeRateHistoryResponse response, Instant fetchedAt) {
        boolean isExpired() {
            return Instant.now().isAfter(fetchedAt.plus(CACHE_TTL));
        }
    }

    /** Frankfurter is ECB-based: it does not cover TND or MAD, only the other four currencies this app supports. */
    private static final Set<Currency> HISTORY_SUPPORTED =
            EnumSet.of(Currency.EUR, Currency.USD, Currency.GBP, Currency.CHF);

    private final RestClient restClient;
    private final RestClient historyClient;
    private final Map<Currency, CachedRates> cache = new ConcurrentHashMap<>();
    private final Map<String, CachedHistory> historyCache = new ConcurrentHashMap<>();

    public ExchangeRateServiceImpl(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.baseUrl("https://open.er-api.com/v6").build();
        this.historyClient = restClientBuilder.baseUrl("https://api.frankfurter.app").build();
    }

    @Override
    public BigDecimal getRate(Currency from, Currency to) {
        if (from == to) {
            return BigDecimal.ONE;
        }

        Map<String, BigDecimal> rates = ratesFor(from);
        BigDecimal rate = rates.get(to.name());
        if (rate == null) {
            throw new BadRequestException(
                    "Taux de change indisponible pour " + from + " vers " + to + ".");
        }
        return rate;
    }

    @Override
    public ExchangeRateHistoryResponse getHistory(Currency from, Currency to, int days) {
        if (from == to) {
            return new ExchangeRateHistoryResponse(true, List.of(new RatePointResponse(LocalDate.now(), BigDecimal.ONE)));
        }
        if (!HISTORY_SUPPORTED.contains(from) || !HISTORY_SUPPORTED.contains(to)) {
            return new ExchangeRateHistoryResponse(false, List.of());
        }

        String cacheKey = from.name() + "_" + to.name() + "_" + days;
        CachedHistory cached = historyCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.response();
        }

        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);

        try {
            TimeSeriesResponse response = historyClient.get()
                    .uri("/{start}..{end}?from={from}&to={to}", start, end, from.name(), to.name())
                    .retrieve()
                    .body(TimeSeriesResponse.class);

            if (response == null || response.rates() == null) {
                return new ExchangeRateHistoryResponse(false, List.of());
            }

            List<RatePointResponse> points = response.rates().entrySet().stream()
                    .map(entry -> new RatePointResponse(LocalDate.parse(entry.getKey()), entry.getValue().get(to.name())))
                    .filter(point -> point.rate() != null)
                    .sorted(java.util.Comparator.comparing(RatePointResponse::date))
                    .toList();

            ExchangeRateHistoryResponse result = new ExchangeRateHistoryResponse(true, points);
            historyCache.put(cacheKey, new CachedHistory(result, Instant.now()));
            return result;
        } catch (RestClientException e) {
            log.warn("Exchange rate history lookup failed for {} -> {}", from, to, e);
            if (cached != null) {
                return cached.response();
            }
            return new ExchangeRateHistoryResponse(false, List.of());
        }
    }

    private Map<String, BigDecimal> ratesFor(Currency base) {
        CachedRates cached = cache.get(base);
        if (cached != null && !cached.isExpired()) {
            return cached.rates();
        }

        try {
            ApiResponse response = restClient.get()
                    .uri("/latest/{base}", base.name())
                    .retrieve()
                    .body(ApiResponse.class);

            if (response == null || !"success".equals(response.result()) || response.rates() == null) {
                throw new BadRequestException("Impossible de récupérer les taux de change pour le moment.");
            }

            cache.put(base, new CachedRates(response.rates(), Instant.now()));
            return response.rates();
        } catch (RestClientException e) {
            log.warn("Exchange rate lookup failed for base {}", base, e);
            if (cached != null) {
                // Serve a stale-but-present cache rather than hard-failing an expense submission.
                return cached.rates();
            }
            throw new BadRequestException(
                    "Impossible de récupérer le taux de change. Vérifiez votre connexion et réessayez.");
        }
    }
}
