package com.example.service;

import com.example.dto.WeeklySummaryBaseData;
import com.example.entity.JournalEntry;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WeeklySummaryQueryService {

    private final MongoTemplate mongoTemplate;

    public WeeklySummaryQueryService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Fetch all data needed to generate a weekly summary for the given user.
     * Now that JournalEntry has userId, this query works correctly.
     */
    public WeeklySummaryBaseData fetchWeeklyBaseData(ObjectId userId) {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekAgo = now.minusDays(7);

        // FIXED: Now correctly queries by userId field (was broken before migration)
        Criteria criteria = Criteria.where("userId").is(userId)
                .and("date").gte(weekAgo).lte(now);

        List<JournalEntry> entries = mongoTemplate.find(new Query(criteria), JournalEntry.class);

        WeeklySummaryBaseData base = new WeeklySummaryBaseData();

        if (entries.isEmpty()) {
            base.setHasEntries(false);
            base.setDaysWritten(0);
            base.setDailyAiSummaries(Collections.emptyList());
            base.setDominantMood("N/A");
            base.setWeeklySignal("");
            return base;
        }

        base.setHasEntries(true);

        // Count unique days
        Set<LocalDate> days = entries.stream()
                .map(e -> e.getDate().toLocalDate())
                .collect(Collectors.toSet());
        base.setDaysWritten(days.size());

        // Collect AI summaries (non-null only)
        List<String> summaries = entries.stream()
                .map(JournalEntry::getAiSummary)
                .filter(s -> s != null && !s.isBlank())
                .toList();
        base.setDailyAiSummaries(summaries);

        // Dominant mood
        String dominantMood = entries.stream()
                .map(JournalEntry::getMood)
                .filter(m -> m != null && !m.isBlank())
                .collect(Collectors.groupingBy(m -> m, Collectors.counting()))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Neutral");
        base.setDominantMood(dominantMood);

        // Build weeklySignal here (removes layer violation from command service)
        // FIXED: Filter out entries with incomplete AI analysis to avoid "null" in Gemini prompt
        String weeklySignal = buildWeeklySignal(entries);
        base.setWeeklySignal(weeklySignal);

        return base;
    }

    /**
     * Build a text signal from journal entries for the Gemini weekly reflection prompt.
     * FIXED: Skips entries where AI analysis did not complete (avoids "Mood=null" in prompt).
     */
    private String buildWeeklySignal(List<JournalEntry> entries) {
        StringBuilder sb = new StringBuilder();

        List<JournalEntry> analyzed = entries.stream()
                .filter(e -> Boolean.TRUE.equals(e.getAnalysisCompleted()))
                .toList();

        sb.append("User wrote ").append(entries.size()).append(" entries last week");

        if (analyzed.size() < entries.size()) {
            sb.append(" (").append(analyzed.size()).append(" with AI analysis)");
        }
        sb.append(".\n");

        for (JournalEntry entry : analyzed) {
            sb.append("- ")
                    .append(entry.getDate().toLocalDate())
                    .append(": Mood=").append(entry.getMood())
                    .append(", Sentiment=").append(entry.getSentimentScore())
                    .append(", Summary=\"").append(entry.getAiSummary()).append("\"\n");
        }

        return sb.toString();
    }
}
