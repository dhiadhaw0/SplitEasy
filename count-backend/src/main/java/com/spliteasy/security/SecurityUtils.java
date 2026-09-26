package com.spliteasy.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Reads the id of the currently authenticated user, set as the Authentication's principal
 * by {@link JwtAuthenticationFilter}.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof Long userId)) {
            throw new IllegalStateException("Aucun utilisateur authentifié dans le contexte de sécurité.");
        }
        return userId;
    }
}
