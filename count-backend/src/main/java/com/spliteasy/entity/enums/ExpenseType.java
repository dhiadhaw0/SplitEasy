package com.spliteasy.entity.enums;

/**
 * Distinguishes a regular expense from a settlement transfer between two participants.
 * A TRANSFER always has splitType = AMOUNTS, exactly one beneficiary and category = OTHER.
 */
public enum ExpenseType {
    EXPENSE,
    TRANSFER
}
