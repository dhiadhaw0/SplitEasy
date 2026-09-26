package com.spliteasy.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Either {@code participantId} (claim an existing, unlinked participant) or
 * {@code newParticipantName} (create a new one) must be provided, never both, never neither.
 */
public record JoinGroupRequest(

        @NotBlank(message = "Le code d'invitation est obligatoire")
        String inviteCode,

        Long participantId,

        @Size(max = 50, message = "Le nom du participant ne doit pas dépasser 50 caractères")
        String newParticipantName
) {

    @AssertTrue(message = "Il faut choisir un participant existant OU indiquer le nom d'un nouveau participant, pas les deux")
    public boolean isChoiceValid() {
        boolean hasExisting = participantId != null;
        boolean hasNew = newParticipantName != null && !newParticipantName.isBlank();
        return hasExisting ^ hasNew;
    }
}
