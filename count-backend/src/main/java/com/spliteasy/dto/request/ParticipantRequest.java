package com.spliteasy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ParticipantRequest(

        @NotBlank(message = "Le nom du participant est obligatoire")
        @Size(max = 50, message = "Le nom du participant ne doit pas dépasser 50 caractères")
        String name
) {
}
