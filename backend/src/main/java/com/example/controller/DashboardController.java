package com.example.controller;

import com.example.dto.UserProgressDTO;
import com.example.entity.User;
import com.example.entity.UserProgress;
import com.example.service.UserProgressReadService;
import com.example.service.UserService;
import com.example.service.WeeklySummaryDashboardQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private UserProgressReadService userProgressReadService;

    @Autowired
    private UserService userService;

    @Autowired
    private WeeklySummaryDashboardQueryService weeklySummaryDashboardQueryService;


    @GetMapping("/progress")
    public UserProgressDTO getProgress(@AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByUserName(userDetails.getUsername());
        UserProgress progress =
                userProgressReadService.getProgressForUser(user.getObjectId());

        UserProgressDTO dto = new UserProgressDTO();
        dto.setCurrentStreak(progress.getCurrentStreak());
        dto.setLongestStreak(progress.getLongestStreak());
        dto.setWeeklyEntryCount(progress.getWeeklyEntryCount());
        dto.setTotalEntries(progress.getTotalEntries());
        dto.setLastEntryDate(progress.getLastEntryDate());

        return dto;
    }

    @GetMapping("/weekly-summary")
    public ResponseEntity<?> getWeeklySummary(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByUserName(userDetails.getUsername());

        return weeklySummaryDashboardQueryService
                .getLatestWeeklySummary(user.getObjectId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

}
