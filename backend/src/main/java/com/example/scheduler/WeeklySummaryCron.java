package com.example.scheduler;

import com.example.entity.User;
import com.example.service.WeeklySummaryCommandService;
import com.example.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Component
@Slf4j
public class WeeklySummaryCron {

    private final UserService userService;
    private final WeeklySummaryCommandService weeklySummaryCommandService;

    public WeeklySummaryCron(UserService userService,
                              WeeklySummaryCommandService weeklySummaryCommandService) {
        this.userService = userService;
        this.weeklySummaryCommandService = weeklySummaryCommandService;
    }

    /**
     * Runs once daily at 9 AM IST.
     * FIXED: Added timezone = "Asia/Kolkata" so it fires at the correct local time.
     */
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Kolkata")
    public void generateWeeklySummaries() {

        int today = DayOfWeek.from(LocalDate.now()).getValue(); // 1 = Monday, 7 = Sunday

        List<User> eligibleUsers = userService.findUsersForWeeklySummary(today);

        log.info("WeeklySummaryCron: {} user(s) eligible for weekly summary on day {}",
                eligibleUsers.size(), today);

        for (User user : eligibleUsers) {
            try {
                weeklySummaryCommandService.generateWeeklySummary(user);
            } catch (Exception e) {
                log.error("Failed to generate weekly summary for user: {}", user.getUserName(), e);
            }
        }
    }
}
