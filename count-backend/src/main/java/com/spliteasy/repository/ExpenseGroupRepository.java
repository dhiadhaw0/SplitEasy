package com.spliteasy.repository;

import com.spliteasy.entity.ExpenseGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExpenseGroupRepository extends JpaRepository<ExpenseGroup, Long> {

    Optional<ExpenseGroup> findByInviteCode(String inviteCode);

    /**
     * All groups where the given user has a linked participant, most recently updated first.
     */
    @Query("""
            SELECT DISTINCT g FROM ExpenseGroup g
            JOIN g.participants p
            WHERE p.user.id = :userId
            ORDER BY g.updatedAt DESC
            """)
    List<ExpenseGroup> findAllByUserId(@Param("userId") Long userId);
}
