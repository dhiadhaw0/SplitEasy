package com.spliteasy.service;

import com.spliteasy.dto.request.LoginRequest;
import com.spliteasy.dto.request.RegisterRequest;
import com.spliteasy.dto.response.AuthResponse;

public interface AuthService {

    /** @throws com.spliteasy.exception.ConflictException if the email is already registered. */
    AuthResponse register(RegisterRequest request);

    /** @throws org.springframework.security.authentication.BadCredentialsException if the credentials are invalid. */
    AuthResponse login(LoginRequest request);
}
