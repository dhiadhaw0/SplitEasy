package com.spliteasy.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * A shared "cagnotte": a target amount a group is collectively saving towards, fed by
 * {@link SavingsContribution}s from its participants.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"group", "contributions"})
@Entity
@Table(name = "savings_goals")
public class SavingsGoal extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    @Column(name = "name", nullable = false, length = 80)
    private String name;

    @Column(name = "target_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetAmount;

    /** Optional target date; purely informational. */
    @Column(name = "deadline")
    private LocalDate deadline;

    @Builder.Default
    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SavingsContribution> contributions = new ArrayList<>();

    /** Adds a contribution to this goal, keeping both sides of the relationship in sync. */
    public void addContribution(SavingsContribution contribution) {
        contributions.add(contribution);
        contribution.setGoal(this);
    }
}
