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

/**
 * A person inside a group. May or may not be linked to a registered {@link User}
 * (e.g. "Grandma" who does not use the app).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"group", "user"})
@Entity
@Table(
        name = "participants",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_participants_group_name", columnNames = {"group_id", "name"}),
                @UniqueConstraint(name = "uk_participants_group_user", columnNames = {"group_id", "user_id"})
        }
)
public class Participant extends BaseEntity {

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    /** Nullable: a participant is not required to have an app account. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    public boolean isLinked() {
        return user != null;
    }
}
