package com.spliteasy.repository;

import com.spliteasy.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    Page<Activity> findByGroupIdOrderByCreatedAtDesc(Long groupId, Pageable pageable);
}
