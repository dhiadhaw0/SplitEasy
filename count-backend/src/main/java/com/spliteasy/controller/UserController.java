package com.spliteasy.controller;

import com.spliteasy.dto.response.OnboardingResponse;
import com.spliteasy.dto.response.UserResponse;
import com.spliteasy.entity.User;
import com.spliteasy.exception.ResourceNotFoundException;
import com.spliteasy.mapper.UserMapper;
import com.spliteasy.repository.UserRepository;
import com.spliteasy.security.SecurityUtils;
import com.spliteasy.service.OnboardingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Utilisateurs")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final OnboardingService onboardingService;

    @GetMapping("/me")
    public UserResponse me() {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        return userMapper.toResponse(user);
    }

    @GetMapping("/me/onboarding")
    public OnboardingResponse onboarding() {
        return onboardingService.getStatus(SecurityUtils.getCurrentUserId());
    }
}
