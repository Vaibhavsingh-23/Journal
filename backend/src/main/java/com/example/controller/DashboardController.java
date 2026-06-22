package com.example.controller;

import com.example.dto.UserProgressDTO;
import com.example.entity.User;
import com.example.entity.UserProgress;
import com.example.service.UserProgressReadService;
import com.example.service.UserService;
import com.example.service.WeeklySummaryDashboardQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "User progress and weekly summary for the dashboard")
public class DashboardController {

    private final UserProgressReadService userProgressReadService;
    private final UserService userService;
    private final WeeklySummaryDashboardQueryService weeklySummaryDashboardQueryService;
    private final com.example.service.WeeklySummaryCommandService weeklySummaryCommandService;

    public DashboardController(UserProgressReadService userProgressReadService,
                                UserService userService,
                                WeeklySummaryDashboardQueryService weeklySummaryDashboardQueryService,
                                com.example.service.WeeklySummaryCommandService weeklySummaryCommandService) {
        this.userProgressReadService = userProgressReadService;
        this.userService = userService;
        this.weeklySummaryDashboardQueryService = weeklySummaryDashboardQueryService;
        this.weeklySummaryCommandService = weeklySummaryCommandService;
    }

    @GetMapping("/progress")
    @Operation(summary = "Get user streak and entry count statistics")
    public UserProgressDTO getProgress(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUserName(userDetails.getUsername());
        UserProgress progress = userProgressReadService.getProgressForUser(user.getId()); // FIXED: getId()

        UserProgressDTO dto = new UserProgressDTO();
        dto.setCurrentStreak(progress.getCurrentStreak());
        dto.setLongestStreak(progress.getLongestStreak());
        dto.setWeeklyEntryCount(progress.getWeeklyEntryCount());
        dto.setTotalEntries(progress.getTotalEntries());
        dto.setLastEntryDate(progress.getLastEntryDate());
        dto.setLastEntryAt(progress.getLastEntryAt());
        return dto;
    }

    @GetMapping("/weekly-summary")
    @Operation(summary = "Get the latest weekly summary for the dashboard widget")
    public ResponseEntity<?> getWeeklySummary(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUserName(userDetails.getUsername());
        return weeklySummaryDashboardQueryService
                .getLatestWeeklySummary(user.getId())  // FIXED: getId()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @org.springframework.web.bind.annotation.PostMapping("/weekly-summary")
    @Operation(summary = "Manually trigger weekly summary generation")
    public ResponseEntity<java.util.Map<String, String>> generateWeeklySummary(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUserName(userDetails.getUsername());
        weeklySummaryCommandService.generateWeeklySummary(user);
        return ResponseEntity.ok(java.util.Map.of("message", "Weekly summary generated successfully"));
    }
}
