package com.spliteasy.entity;

import com.spliteasy.entity.enums.Currency;
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

import java.util.ArrayList;
import java.util.List;

/**
 * A "tricount": a group of participants sharing common expenses.
 * Table is named "expense_groups" because GROUP is a reserved SQL word.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"participants", "expenses"})
@Entity
@Table(name = "expense_groups")
public class ExpenseGroup extends BaseEntity {

    @Column(name = "name", nullable = false, length = 80)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "currency", nullable = false, length = 3)
    private Currency currency;

    /** 10-character alphanumeric code, unique, generated via SecureRandom. */
    @Column(name = "invite_code", nullable = false, unique = true, length = 10)
    private String inviteCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Builder.Default
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Participant> participants = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Expense> expenses = new ArrayList<>();

    /** Adds a participant to this group, keeping both sides of the relationship in sync. */
    public void addParticipant(Participant participant) {
        participants.add(participant);
        participant.setGroup(this);
    }

    /** Removes a participant from this group, keeping both sides of the relationship in sync. */
    public void removeParticipant(Participant participant) {
        participants.remove(participant);
        participant.setGroup(null);
    }

    /** Adds an expense to this group, keeping both sides of the relationship in sync. */
    public void addExpense(Expense expense) {
        expenses.add(expense);
        expense.setGroup(this);
    }
}
