package com.spliteasy.dto.response;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
