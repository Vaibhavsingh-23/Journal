package com.example.service;

import com.example.dto.WeeklyAiReflection;
import com.example.dto.WeeklySummaryBaseData;
import com.example.entity.*;
import com.example.repository.WeeklySummaryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@Slf4j
public class WeeklySummaryCommandService {

    private final WeeklySummaryQueryService weeklySummaryQueryService;
    private final WeeklySummaryRepository weeklySummaryRepository;
    private final GeminiService geminiService;
    private final UserService userService;
    private final EmailDeliveryService emailDeliveryService;

    public WeeklySummaryCommandService(WeeklySummaryQueryService weeklySummaryQueryService,
                                        WeeklySummaryRepository weeklySummaryRepository,
                                        GeminiService geminiService,
                                        UserService userService,
                                        EmailDeliveryService emailDeliveryService) {
        this.weeklySummaryQueryService = weeklySummaryQueryService;
        this.weeklySummaryRepository = weeklySummaryRepository;
        this.geminiService = geminiService;
        this.userService = userService;
        this.emailDeliveryService = emailDeliveryService;
    }

    public void generateWeeklySummary(User user) {

        // Step 1: Idempotency check — skip if already generated today
        if (user.getLastWeeklySummaryDate() != null &&
                user.getLastWeeklySummaryDate().isEqual(LocalDate.now())) {
            log.info("Weekly summary already generated today for user: {}", user.getUserName());
            return;
        }

        // Step 2: Fetch data from read-side
        WeeklySummaryBaseData base = weeklySummaryQueryService.fetchWeeklyBaseData(user.getId());

        // Step 3: Build base summary object
        WeeklySummary summary = new WeeklySummary();
        summary.setUserId(user.getId());
        summary.setWeekStartDate(LocalDate.now().minusDays(7));
        summary.setWeekEndDate(LocalDate.now());
        summary.setGeneratedAt(LocalDateTime.now());
        summary.setDeliveryStatus(WeeklySummaryDeliveryStatus.DASHBOARD_ONLY);

        // Case A: No entries this week → motivational message
        if (!base.isHasEntries()) {
            summary.setType(WeeklySummaryType.MOTIVATION);
            summary.setSummaryText(
                    "You didn't write anything last week. Even a few lines can help clear your mind. Want to start today?"
            );
            summary.setDaysWritten(0);
            summary.setMood("N/A");

            saveAndDeliver(summary, user);
            return;
        }

        // Case B: AI reflection (happy path)
        try {
            // weeklySignal is now pre-built in query service (null-safe, no entity in DTO)
            WeeklyAiReflection aiReflection =
                    geminiService.generateWeeklyReflection(base.getWeeklySignal());

            summary.setType(WeeklySummaryType.AI_REFLECTION);
            summary.setSummaryText(aiReflection.getReflectionText());
            summary.setTrend(aiReflection.getTrend());
            summary.setSuggestion(aiReflection.getSuggestion());
            summary.setDaysWritten(base.getDaysWritten());
            summary.setMood(base.getDominantMood());

            saveAndDeliver(summary, user);
            return;

        } catch (Exception e) {
            log.warn("AI weekly reflection failed for user {}, using deterministic fallback: {}",
                    user.getUserName(), e.getMessage());
        }

        // Case C: Deterministic fallback
        summary.setType(WeeklySummaryType.SUMMARY);
        summary.setSummaryText(
                String.format("You wrote on %d day(s) this week. Your overall mood was mostly %s.",
                        base.getDaysWritten(), base.getDominantMood())
        );
        summary.setDaysWritten(base.getDaysWritten());
        summary.setMood(base.getDominantMood());

        saveAndDeliver(summary, user);
    }

    /**
     * Save the summary, stamp the user's lastWeeklySummaryDate, and optionally email.
     */
    private void saveAndDeliver(WeeklySummary summary, User user) {
        weeklySummaryRepository.save(summary);
        user.setLastWeeklySummaryDate(LocalDate.now());
        userService.saveUser(user);
        emailDeliveryService.deliverIfEligible(user, summary);
        log.info("Weekly summary saved for user: {}", user.getUserName());
    }
}
