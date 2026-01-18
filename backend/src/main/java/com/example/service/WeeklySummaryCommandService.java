package com.example.service;

import com.example.dto.WeeklyAiReflection;
import com.example.dto.WeeklySummaryBaseData;
import com.example.entity.*;
import com.example.repository.WeeklySummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@Service
public class WeeklySummaryCommandService {

    @Autowired
    private WeeklySummaryQueryService weeklySummaryQueryService;

    @Autowired
    private WeeklySummaryRepository weeklySummaryRepository;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private UserService userService;

    @Autowired
    private EmailDeliveryService emailDeliveryService;

    public void generateWeeklySummary(User user) {

        // 1️⃣ Idempotency check
        if (user.getLastWeeklySummaryDate() != null &&
                user.getLastWeeklySummaryDate().isEqual(LocalDate.now())) {
            return;
        }

        // 2️⃣ Fetch read-side data
        WeeklySummaryBaseData base =
                weeklySummaryQueryService.fetchWeeklyBaseData(user.getObjectId());

        WeeklySummary summary = new WeeklySummary();
        summary.setUserId(user.getObjectId());
        summary.setWeekStartDate(LocalDate.now().minusDays(7));
        summary.setWeekEndDate(LocalDate.now());
        summary.setGeneratedAt(LocalDateTime.now());
        summary.setDeliveryStatus(WeeklySummaryDeliveryStatus.DASHBOARD_ONLY);

        // 3️⃣ Case A: No entries
        if (!base.isHasEntries()) {

            summary.setType(WeeklySummaryType.MOTIVATION);
            summary.setSummaryText(
                    "You didn’t write anything last week. Even a few lines can help clear your mind. Want to start today?"
            );
            summary.setDaysWritten(0);
            summary.setMood("N/A");

            weeklySummaryRepository.save(summary);

            user.setLastWeeklySummaryDate(LocalDate.now());
            userService.saveUser(user);

            emailDeliveryService.deliverIfEligible(user, summary);
            return;
        }

        // 4️⃣ Case B: AI reflection
        try {
            String weeklySignal = buildWeeklySignal(base.getJournalEntries());

            WeeklyAiReflection aiReflection =
                    geminiService.generateWeeklyReflection(weeklySignal);

            summary.setType(WeeklySummaryType.AI_REFLECTION);
            summary.setSummaryText(aiReflection.getReflectionText());
            summary.setTrend(aiReflection.getTrend());
            summary.setSuggestion(aiReflection.getSuggestion());
            summary.setDaysWritten(base.getDaysWritten());
            summary.setMood(base.getDominantMood());

            weeklySummaryRepository.save(summary);

            user.setLastWeeklySummaryDate(LocalDate.now());
            userService.saveUser(user);

            emailDeliveryService.deliverIfEligible(user, summary);
            return;

        } catch (Exception e) {
            // fallback below
        }

        // 5️⃣ Case C: Deterministic fallback
        summary.setType(WeeklySummaryType.SUMMARY);
        summary.setSummaryText(
                String.format(
                        "You wrote on %d days this week. Your overall mood was mostly %s.",
                        base.getDaysWritten(),
                        base.getDominantMood()
                )
        );
        summary.setDaysWritten(base.getDaysWritten());
        summary.setMood(base.getDominantMood());

        weeklySummaryRepository.save(summary);

        user.setLastWeeklySummaryDate(LocalDate.now());
        userService.saveUser(user);

        emailDeliveryService.deliverIfEligible(user, summary);
    }

    private String buildWeeklySignal(List<JournalEntry> entries) {

        StringBuilder sb = new StringBuilder();
        sb.append("User wrote ").append(entries.size()).append(" entries last week.\n");

        for (JournalEntry entry : entries) {
            sb.append("- ")
                    .append(entry.getDate().toLocalDate())
                    .append(": Mood=")
                    .append(entry.getMood())
                    .append(", Sentiment=")
                    .append(entry.getSentimentScore())
                    .append(", Summary=\"")
                    .append(entry.getAiSummary())
                    .append("\"\n");
        }

        return sb.toString();
    }
}
