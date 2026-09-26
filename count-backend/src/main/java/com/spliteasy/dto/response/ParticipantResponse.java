package com.spliteasy.dto.response;

public record ParticipantResponse(
        Long id,
        String name,
        Long userId,
        boolean linked
) {
}
