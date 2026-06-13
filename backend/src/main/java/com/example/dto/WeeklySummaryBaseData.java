package com.example.dto;

import lombok.Data;
import java.util.List;

/**
 * Carries weekly aggregate data for the command service.
 * FIXED: No longer holds JournalEntry entities (layer violation removed).
 * Instead holds only the data the command service actually needs.
 */
@Data
public class WeeklySummaryBaseData {

    private boolean hasEntries;
    private int daysWritten;

    /** AI summaries extracted from entries (for potential future use). */
    private List<String> dailyAiSummaries;

    private String dominantMood;

    /** Signal string pre-built for Gemini (mood + sentiment per entry). */
    private String weeklySignal;
}
