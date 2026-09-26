package com.spliteasy.dto.response;

public record UserResponse(
        Long id,
        String displayName,
        String email
) {
}
