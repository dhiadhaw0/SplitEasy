package com.spliteasy.dto.response;

import java.util.List;

/**
 * What an authenticated user sees before joining a group via its invite code:
 * the group's name and the list of participants not yet linked to any account
 * (so they can pick "I am Sara" instead of creating a duplicate participant).
 */
public record InvitePreviewResponse(
        Long groupId,
        String groupName,
        List<ParticipantResponse> unlinkedParticipants
) {
}
