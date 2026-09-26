package com.spliteasy.repository;

import com.spliteasy.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    List<Participant> findByGroupIdOrderByNameAsc(Long groupId);

    Optional<Participant> findByIdAndGroupId(Long id, Long groupId);

    Optional<Participant> findByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndNameIgnoreCase(Long groupId, String name);
}
