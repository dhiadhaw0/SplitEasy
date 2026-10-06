package com.spliteasy.entity.enums;

/** What kind of event an {@link com.spliteasy.entity.Activity} records. */
public enum ActivityType {
    EXPENSE_CREATED,
    EXPENSE_UPDATED,
    EXPENSE_DELETED,
    SETTLEMENT_RECORDED,
    BUDGET_EXCEEDED,
    SAVINGS_GOAL_ACHIEVED,
    PARTICIPANT_JOINED
}
