package com.spliteasy.service;

import com.spliteasy.dto.request.ParticipantRequest;
import com.spliteasy.dto.response.ParticipantResponse;

import java.util.List;

public interface ParticipantService {

    List<ParticipantResponse> list(Long groupId);

    ParticipantResponse add(Long groupId, ParticipantRequest request);

    ParticipantResponse rename(Long groupId, Long participantId, ParticipantRequest request);

    /** @throws com.spliteasy.exception.ConflictException if the participant is used in an expense. */
    void delete(Long groupId, Long participantId);

    /** Links an existing, unlinked participant to the caller's account. */
    ParticipantResponse claim(Long groupId, Long participantId, Long userId);
}
