package com.example.controller;

import com.example.entity.User;
import com.example.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@Slf4j
public class AdminController {

    @Autowired
    private UserService userService;

    /**
     * Get all users - Admin only
     * Returns empty list instead of 404 if no users found
     */
    @GetMapping("/all-user")
    public ResponseEntity<?> getAllUsers(){
        try {
            log.info("Admin requesting all users");
            List<User> all = userService.getAll();

            // Always return 200 OK with the list (even if empty)
            // Empty list is valid response, not an error
            return new ResponseEntity<>(all, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Error fetching all users", e);
            return new ResponseEntity<>("Failed to fetch users: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create admin user - Admin only
     * Better error handling and validation
     */
    @PostMapping("/create-admin-user")
    public ResponseEntity<?> createUser(@RequestBody User user){
        try {
            log.info("Creating admin user: {}", user.getUserName());

            // Validate input
            if (user.getUserName() == null || user.getUserName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Username is required");
            }

            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required");
            }

            if (user.getPassword().length() < 6) {
                return ResponseEntity.badRequest().body("Password must be at least 6 characters");
            }

            // Check if user already exists
            User existingUser = userService.findByUserName(user.getUserName());
            if (existingUser != null) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Username already exists");
            }

            // Save admin user
            userService.saveAdmin(user);

            log.info("Admin user created successfully: {}", user.getUserName());
            return ResponseEntity.status(HttpStatus.CREATED).body(user);

        } catch (Exception e) {
            log.error("Error creating admin user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create admin: " + e.getMessage());
        }
    }
}