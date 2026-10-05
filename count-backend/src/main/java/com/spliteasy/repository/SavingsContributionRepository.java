package com.spliteasy.repository;

import com.spliteasy.entity.SavingsContribution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SavingsContributionRepository extends JpaRepository<SavingsContribution, Long> {

    Optional<SavingsContribution> findByIdAndGoalId(Long id, Long goalId);
}
