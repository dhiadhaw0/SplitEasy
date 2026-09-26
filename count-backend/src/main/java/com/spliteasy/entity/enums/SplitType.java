package com.spliteasy.entity.enums;

/**
 * How the amount of an expense is split between its beneficiaries.
 */
public enum SplitType {
    /** Equal shares between all beneficiaries. */
    EQUAL,
    /** Exact amounts entered by the user; their sum must equal the expense total. */
    AMOUNTS,
    /** Weights/shares (e.g. 2 shares for a couple, 1 for a single person). */
    SHARES,
    /** Percentages; their sum must equal 100. */
    PERCENTAGES
}
