package com.example.controller;

import com.example.dto.UserPreferencesUpdateRequest;
import com.example.entity.User;
import com.example.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * User profile and preferences endpoints.
 *
 * GET  /user/me          — Get current user info
 * PUT  /user/preferences — Update notification and summary preferences
 * PUT  /user             — Update username / password
 * DELETE /user           — Delete account and all data
 */
@RestController
@RequestMapping("/user")
@Tag(name = "User", description = "User profile and preferences management")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Get the current user's profile info (for settings page).
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user info")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUserName(userDetails.getUsername());
        return ResponseEntity.ok(Map.of(
                "id", user.getId() != null ? user.getId().toString() : "",
                "username", user.getUserName(),
                "email", user.getEmail() != null ? user.getEmail() : "",
                "preferences", user.getPreferences()
        ));
    }

    /**
     * Update weekly summary and email notification preferences.
     */
    @PutMapping("/preferences")
    @Operation(summary = "Update user preferences")
    public ResponseEntity<?> updatePreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserPreferencesUpdateRequest request) {

        User user = userService.findByUserName(userDetails.getUsername());
        userService.updateUserPreferences(
                user,
                request.getEmail(),
                request.getWeeklySummaryEnabled(),
                request.getWeeklySummaryDay(),
                request.getEmailNotificationsEnabled());

        return ResponseEntity.ok(Map.of("message", "Preferences updated successfully"));
    }

    /**
     * Update username and/or password.
     * The client must re-login after this to get a new JWT (old token stays valid until expiry).
     */
    @PutMapping
    @Operation(summary = "Update username and password")
    public ResponseEntity<?> updateUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateUserRequest request) {

        User user = userService.findByUserName(userDetails.getUsername());

        if (request.getUserName() != null && !request.getUserName().isBlank()) {
            user.setUserName(request.getUserName());
        }

        userService.updateExistingUser(user, request.getPassword());

        return ResponseEntity.ok(Map.of(
                "message", "Profile updated. Please log in again with your new credentials.",
                "username", user.getUserName()
        ));
    }

    /**
     * Delete the authenticated user's account and all associated data.
     */
    @DeleteMapping
    @Operation(summary = "Delete user account and all data")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUserName(userDetails.getUsername());
        userService.deleteUserAndAllData(user.getId());
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }

    // -----------------------------------------------------------------------
    // Inner request DTO
    // -----------------------------------------------------------------------

    @Data
    public static class UpdateUserRequest {
        @Size(min = 3, max = 30)
        private String userName;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
    }
}
