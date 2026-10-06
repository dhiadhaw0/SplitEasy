package com.spliteasy.repository;

import com.spliteasy.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByGroupIdOrderByCreatedAtAsc(Long groupId);

    Optional<Budget> findByIdAndGroupId(Long id, Long groupId);

    /** For the "getting started" checklist: has this user set up a budget in any of their groups? */
    boolean existsByGroupIdIn(Collection<Long> groupIds);
}
