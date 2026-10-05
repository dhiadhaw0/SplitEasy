package com.spliteasy.entity;

import com.spliteasy.entity.enums.BudgetPeriod;
import com.spliteasy.entity.enums.Category;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;

/**
 * A spending limit for a group, either for one {@link Category} or (when {@code category} is
 * null) for the group's overall spending, reset every {@link BudgetPeriod}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "group")
@Entity
@Table(name = "budgets")
public class Budget extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    /** Null means this budget covers every category combined. */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 20)
    private Category category;

    @Column(name = "amount_limit", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountLimit;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "period", nullable = false, length = 20)
    private BudgetPeriod period = BudgetPeriod.MONTHLY;
}
