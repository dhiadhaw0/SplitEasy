package com.spliteasy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;

/**
 * What a single beneficiary participant owes for a given expense.
 * {@code shareValue} keeps the value the user entered (weight, percentage or exact amount,
 * null for EQUAL) so the split can be edited later without losing the original input.
 * {@code amount} is always the computed amount actually owed, in the group's currency.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"expense", "participant"})
@Entity
@Table(
        name = "expense_shares",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_expense_shares_expense_participant",
                columnNames = {"expense_id", "participant_id"}
        )
)
public class ExpenseShare extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private Participant participant;

    /** Raw value entered by the user: weight, percentage or exact amount. Null for EQUAL. */
    @Column(name = "share_value", precision = 12, scale = 4)
    private BigDecimal shareValue;

    /** Computed amount owed by this participant for this expense. */
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
}
