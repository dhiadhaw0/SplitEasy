package com.spliteasy.repository;

import com.spliteasy.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    List<Participant> findByGroupIdOrderByNameAsc(Long groupId);

    Optional<Participant> findByIdAndGroupId(Long id, Long groupId);

    Optional<Participant> findByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndNameIgnoreCase(Long groupId, String name);

    /** For the "getting started" checklist: is this user a member of at least one group? */
    boolean existsByUserId(Long userId);

    /**
     * For the "getting started" checklist: did anyone else (a real linked account, not just an
     * offline participant name) ever join one of this user's groups?
     */
    @Query("""
            SELECT COUNT(p) > 0 FROM Participant p
            WHERE p.user IS NOT NULL AND p.user.id <> :userId
            AND p.group.id IN (SELECT p2.group.id FROM Participant p2 WHERE p2.user.id = :userId)
            """)
    boolean existsOtherLinkedParticipantInMyGroups(@Param("userId") Long userId);
}
