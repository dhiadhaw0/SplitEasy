package com.spliteasy.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;

/**
 * Money is always represented as BigDecimal with 2 decimal places. Never use double/float
 * for amounts anywhere in this codebase.
 */
public final class MoneyUtils {

    public static final int SCALE = 2;
    public static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    /** Threshold under which a balance is considered settled (see the settlement algorithm). */
    public static final BigDecimal EPSILON = new BigDecimal("0.01");

    public static final BigDecimal ZERO = BigDecimal.ZERO.setScale(SCALE, ROUNDING_MODE);

    private MoneyUtils() {
    }

    /** Normalizes a value to the canonical monetary scale (2 decimals, HALF_UP). */
    public static BigDecimal scale(BigDecimal value) {
        return value.setScale(SCALE, ROUNDING_MODE);
    }

    /** Sums a collection of amounts, returning a properly scaled zero for an empty collection. */
    public static BigDecimal sum(Collection<BigDecimal> values) {
        return values.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(SCALE, ROUNDING_MODE);
    }

    public static boolean isZero(BigDecimal value) {
        return value.compareTo(BigDecimal.ZERO) == 0;
    }

    public static boolean isPositive(BigDecimal value) {
        return value.compareTo(BigDecimal.ZERO) > 0;
    }

    public static boolean isNegative(BigDecimal value) {
        return value.compareTo(BigDecimal.ZERO) < 0;
    }

    /** True if the value's absolute value is strictly below the settlement threshold (0.01). */
    public static boolean isNegligible(BigDecimal value) {
        return value.abs().compareTo(EPSILON) < 0;
    }

    public static boolean amountsEqual(BigDecimal a, BigDecimal b) {
        return scale(a).compareTo(scale(b)) == 0;
    }
}
