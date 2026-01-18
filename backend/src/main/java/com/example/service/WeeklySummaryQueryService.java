package com.example.service;

import com.example.dto.WeeklySummaryBaseData;
import com.example.entity.JournalEntry;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    private MongoTemplate mongoTemplate;

    public WeeklySummaryBaseData fetchWeeklyBaseData(ObjectId userId) {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekAgo = now.minusDays(7);

        Criteria criteria = Criteria.where("userId").is(userId)
                .and("date").gte(weekAgo).lte(now);

        Query query = new Query(criteria);

        List<JournalEntry> entries =
                mongoTemplate.find(query, JournalEntry.class);

        WeeklySummaryBaseData base = new WeeklySummaryBaseData();

        if (entries.isEmpty()) {
            base.setHasEntries(false);
            base.setDaysWritten(0);
            base.setDailyAiSummaries(Collections.emptyList());
            base.setDominantMood("N/A");
            return base;
        }

        base.setHasEntries(true);

        // count unique days
        Set<LocalDate> days = entries.stream()
                .map(e -> e.getDate().toLocalDate())
                .collect(Collectors.toSet());
        base.setDaysWritten(days.size());

        // collect ai summaries (only non-null)
        List<String> summaries = entries.stream()
                .map(JournalEntry::getAiSummary)
                .filter(s -> s != null && !s.isBlank())
                .toList();
        base.setDailyAiSummaries(summaries);

        // dominant mood
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

        return base;
    }
}
