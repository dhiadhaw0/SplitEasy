package com.spliteasy.repository;

import com.spliteasy.entity.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {

    List<SavingsGoal> findByGroupIdOrderByCreatedAtAsc(Long groupId);

    Optional<SavingsGoal> findByIdAndGroupId(Long id, Long groupId);
}
