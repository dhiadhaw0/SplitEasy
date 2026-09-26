package com.spliteasy.dto.response;

import com.spliteasy.entity.enums.Currency;

import java.time.Instant;
import java.util.List;

public record GroupDetailResponse(
        Long id,
        String name,
        String description,
        Currency currency,
        String inviteCode,
        Long createdById,
        List<ParticipantResponse> participants,
        Long myParticipantId,
        Instant createdAt
) {
}
