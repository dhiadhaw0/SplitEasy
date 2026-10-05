package com.spliteasy.entity.enums;

import java.time.LocalDate;

/**
 * How often a recurring expense (e.g. rent, a shared subscription) generates a new occurrence.
 */
public enum RecurrenceInterval {
    WEEKLY,
    MONTHLY,
    YEARLY;

    /** The next occurrence date after {@code from}, used both when scheduling the first one and by the scheduler. */
    public LocalDate nextAfter(LocalDate from) {
        return switch (this) {
            case WEEKLY -> from.plusWeeks(1);
            case MONTHLY -> from.plusMonths(1);
            case YEARLY -> from.plusYears(1);
        };
    }
}
