package com.spliteasy.dto.request;

import com.spliteasy.entity.enums.Currency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GroupRequest(

        @NotBlank(message = "Le nom du groupe est obligatoire")
        @Size(max = 80, message = "Le nom du groupe ne doit pas dépasser 80 caractères")
        String name,

        @Size(max = 255, message = "La description ne doit pas dépasser 255 caractères")
        String description,

        @NotNull(message = "La devise est obligatoire")
        Currency currency
) {
}
