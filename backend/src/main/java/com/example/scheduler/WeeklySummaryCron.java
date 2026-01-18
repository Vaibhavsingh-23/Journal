package com.example.scheduler;

import com.example.entity.User;
import com.example.service.WeeklySummaryCommandService;
import com.example.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Component
@Slf4j
public class WeeklySummaryCron {

    @Autowired
    private UserService userService;

    @Autowired
    private WeeklySummaryCommandService weeklySummaryCommandService;

    /**
     * Runs once daily at 9 AM
     */

    //@Scheduled(cron = "0 0 9 * * *")
    @Scheduled(cron = "*/30 * * * * *")
    public void generateWeeklySummaries() {

        int today = DayOfWeek.from(LocalDate.now()).getValue(); // 1 = Monday

        List<User> eligibleUsers =
                userService.findUsersForWeeklySummary(today);

        log.info("WeeklySummaryCron: {} users eligible for weekly summary", eligibleUsers.size());

        for (User user : eligibleUsers) {
            try {
                weeklySummaryCommandService.generateWeeklySummary(user);
            } catch (Exception e) {
                log.error("Failed to generate weekly summary for user {}", user.getUserName(), e);
            }
        }
    }
}
