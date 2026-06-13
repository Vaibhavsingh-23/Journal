package com.example.controller;

import com.example.dto.AuthResponse;
import com.example.dto.CreateUserRequest;
import com.example.dto.LoginRequest;
import com.example.entity.User;
import com.example.security.JwtTokenProvider;
import com.example.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

/**
 * Public endpoints — no authentication required.
 *
 * POST /public/login       — Authenticate and receive a JWT
 * POST /public/create-user — Register a new user account
 * GET  /public/health-check — Liveness probe
 */
@RestController
@RequestMapping("/public")
public class PublicController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public PublicController(UserService userService,
                            AuthenticationManager authenticationManager,
                            JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Authenticate user and return a JWT.
     * The client should store this token and send it as:
     * Authorization: Bearer <token>
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            String username = authentication.getName();
            String token = jwtTokenProvider.generateToken(username);
            Instant expiresAt = Instant.now().plusMillis(jwtTokenProvider.getExpiryMs());

            return ResponseEntity.ok(new AuthResponse(token, username, expiresAt));

        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "Invalid credentials",
                            "message", "The username or password you entered is incorrect."
                    ));
        }
    }

    /**
     * Register a new user account.
     */
    @PostMapping("/create-user")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        User user = new User();
        user.setUserName(request.getUserName());
        user.setPassword(request.getPassword());
        user.setEmail(request.getEmail());

        // saveNewUser throws UserAlreadyExistsException if username taken
        userService.saveNewUser(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Account created successfully. Please log in.",
                        "username", request.getUserName()
                ));
    }

    /**
     * Simple liveness probe.
     */
    @GetMapping("/health-check")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
