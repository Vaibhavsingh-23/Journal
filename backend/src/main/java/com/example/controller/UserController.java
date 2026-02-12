package com.example.controller;

import com.example.dto.UserPreferencesUpdateRequest;
import com.example.entity.User;
import com.example.repository.UserRepository;
import com.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {
        @Autowired
        private UserService userService;

        @Autowired
        private UserRepository userRepository;

        @PutMapping("/preferences")
        public void updatePreferences(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @RequestBody UserPreferencesUpdateRequest request) {
                User user = userService.findByUserName(userDetails.getUsername());

                userService.updateUserPreferences(
                                user,
                                request.getEmail(),
                                request.getWeeklySummaryEnabled(),
                                request.getWeeklySummaryDay(),
                                request.getEmailNotificationsEnabled());
        }
}
