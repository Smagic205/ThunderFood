package com.thunderfood.backend.config.security;

import com.thunderfood.backend.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            return Optional.ofNullable(userDetails.getUser());
        }
        return Optional.empty();
    }

    public static Optional<Long> getCurrentUserId() {
        return getCurrentUser().map(User::getId);
    }

    public static boolean hasRole(String roleName) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_" + roleName) || a.getAuthority().equalsIgnoreCase(roleName));
        }
        return false;
    }

    public static boolean isAdmin() {
        return hasRole("ADMIN");
    }

    public static boolean isStaffOrAdmin() {
        return hasRole("STAFF") || hasRole("ADMIN");
    }
}
