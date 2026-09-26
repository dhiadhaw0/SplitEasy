package com.spliteasy.entity;

import com.spliteasy.entity.enums.Category;
import com.spliteasy.entity.enums.ExpenseType;
import com.spliteasy.entity.enums.SplitType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * An amount paid by ONE participant on behalf of one or more beneficiary participants.
 * A settlement transfer is stored as an Expense with type = TRANSFER (see {@link ExpenseType}).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"group", "paidBy", "createdBy", "shares"})
@Entity
@Table(name = "expenses")
public class Expense extends BaseEntity {

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private Category category = Category.OTHER;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 10)
    private ExpenseType type = ExpenseType.EXPENSE;

    @Enumerated(EnumType.STRING)
    @Column(name = "split_type", nullable = false, length = 20)
    private SplitType splitType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by", nullable = false)
    private Participant paidBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Builder.Default
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ExpenseShare> shares = new ArrayList<>();

    /** Adds a share to this expense, keeping both sides of the relationship in sync. */
    public void addShare(ExpenseShare share) {
        shares.add(share);
        share.setExpense(this);
    }

    /** Removes every share currently attached to this expense (used before recomputing them on update). */
    public void clearShares() {
        for (ExpenseShare share : new ArrayList<>(shares)) {
            shares.remove(share);
            share.setExpense(null);
        }
    }

    public boolean isTransfer() {
        return type == ExpenseType.TRANSFER;
    }
}
