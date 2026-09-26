package com.spliteasy.service.impl;

import com.spliteasy.dto.request.LoginRequest;
import com.spliteasy.dto.request.RegisterRequest;
import com.spliteasy.dto.response.AuthResponse;
import com.spliteasy.entity.User;
import com.spliteasy.exception.ConflictException;
import com.spliteasy.mapper.UserMapper;
import com.spliteasy.repository.UserRepository;
import com.spliteasy.security.JwtService;
import com.spliteasy.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Un compte existe déjà avec cet email.");
        }

        User user = User.builder()
                .displayName(request.displayName())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .build();
        user = userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, userMapper.toResponse(user));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.email().toLowerCase();

        // Throws BadCredentialsException on failure, translated to a generic 401 by GlobalExceptionHandler.
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Utilisateur authentifié introuvable en base."));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, userMapper.toResponse(user));
    }
}
