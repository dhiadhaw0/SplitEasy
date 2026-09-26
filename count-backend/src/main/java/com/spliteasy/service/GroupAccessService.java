package com.spliteasy.service;

import com.spliteasy.entity.ExpenseGroup;
import com.spliteasy.entity.Participant;

import java.util.Optional;

/**
 * Centralizes group-related authorization checks so every controller/service applies the
 * same rule: a user may only read or modify a group they have a linked participant in.
 */
public interface GroupAccessService {

    /** @throws com.spliteasy.exception.ResourceNotFoundException if the group does not exist. */
    ExpenseGroup getGroupOrThrow(Long groupId);

    /** @throws com.spliteasy.exception.ForbiddenException if the user has no linked participant in the group. */
    void checkMember(Long groupId, Long userId);

    /** @throws com.spliteasy.exception.ForbiddenException if the user did not create the group. */
    void checkCreator(Long groupId, Long userId);

    /** The participant linking this user to this group, if any. */
    Optional<Participant> findMyParticipant(Long groupId, Long userId);
}
