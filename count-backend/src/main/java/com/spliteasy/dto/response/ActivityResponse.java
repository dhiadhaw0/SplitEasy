package com.spliteasy.dto.response;

import com.spliteasy.entity.enums.ActivityType;

import java.time.Instant;

public record ActivityResponse(
        Long id,
        ActivityType type,
        /** Precomputed, human-readable, already includes the actor's name (e.g. "Sara a ajouté « Restaurant »"). */
        String message,
        Long actorId,
        String actorName,
        Instant createdAt
) {
}
