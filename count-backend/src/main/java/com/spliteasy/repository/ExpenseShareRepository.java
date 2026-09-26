package com.spliteasy.repository;

import com.spliteasy.entity.ExpenseShare;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseShareRepository extends JpaRepository<ExpenseShare, Long> {

    boolean existsByParticipantId(Long participantId);
}
