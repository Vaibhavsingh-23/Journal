package com.example.controller;

import com.example.entity.User;
import com.example.service.EmailDeliveryService;
import com.example.service.UserService;
import com.example.service.WeeklySummaryCommandService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/test")
public class WeeklySummaryTestController {

    @Autowired
    private WeeklySummaryCommandService weeklySummaryCommandService;

    @Autowired
    private UserService userService;

    @PostMapping("/weekly-summary")
    public String generateWeeklySummaryForCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.findByUserName(userDetails.getUsername());

        // Email is already handled INSIDE the command service
        weeklySummaryCommandService.generateWeeklySummary(user);

        return "Weekly summary generated (email handled internally)";
    }
}
