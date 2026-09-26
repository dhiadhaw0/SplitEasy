package com.spliteasy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
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
 * A registered person, identified by email + password.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "participants")
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "display_name", nullable = false, length = 50)
    private String displayName;

    /** Always stored in lowercase; uniqueness is enforced at the database level. */
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    /** BCrypt hash, never the plain-text password. */
    @Column(name = "password", nullable = false)
    private String password;

    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Participant> participants = new ArrayList<>();
}
