package com.example.controller;

import com.example.entity.User;
import com.example.service.UserService;
import com.example.service.WeeklySummaryCommandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only endpoints. Requires ADMIN role (enforced by SpringSecurity config).
 *
 * GET  /admin/all-user              — List all users
 * POST /admin/create-admin-user     — Create an admin account
 * POST /api/admin/weekly-summary    — Manually trigger weekly summary for current user (testing)
 */
@RestController
@Slf4j
@Tag(name = "Admin", description = "Admin-only management endpoints")
public class AdminController {

    private final UserService userService;
    private final WeeklySummaryCommandService weeklySummaryCommandService;

    public AdminController(UserService userService,
                            WeeklySummaryCommandService weeklySummaryCommandService) {
        this.userService = userService;
        this.weeklySummaryCommandService = weeklySummaryCommandService;
    }

    // ------------------------------------------------------------------
    // /admin/** endpoints
    // ------------------------------------------------------------------

    @GetMapping("/admin/all-user")
    @Operation(summary = "Get all users (admin only)")
    public ResponseEntity<List<User>> getAllUsers() {
        log.info("Admin requesting all users");
        return ResponseEntity.ok(userService.getAll());
    }

    @PostMapping("/admin/create-admin-user")
    @Operation(summary = "Create a new admin user")
    public ResponseEntity<?> createAdminUser(@RequestBody User user) {
        if (user.getUserName() == null || user.getUserName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
        }
        if (user.getPassword() == null || user.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }

        User existing = userService.findByUserName(user.getUserName());
        if (existing != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Username already exists"));
        }

        userService.saveAdmin(user);
        log.info("Admin user created: {}", user.getUserName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Admin user created", "username", user.getUserName()));
    }

    // ------------------------------------------------------------------
    // /api/admin/** — admin testing tools
    // MOVED from WeeklySummaryTestController and gated behind ADMIN role
    // ------------------------------------------------------------------

    @PostMapping("/api/admin/weekly-summary")
    @Operation(summary = "Manually trigger weekly summary generation (admin testing)")
    public ResponseEntity<Map<String, String>> triggerWeeklySummary(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByUserName(userDetails.getUsername());
        weeklySummaryCommandService.generateWeeklySummary(user);

        log.info("Admin manually triggered weekly summary for: {}", user.getUserName());
        return ResponseEntity.ok(Map.of("message", "Weekly summary generation triggered"));
    }
}