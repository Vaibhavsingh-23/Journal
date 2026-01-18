package com.example.dto;

import com.example.entity.JournalEntry;
import lombok.Data;
import java.util.List;

@Data
public class WeeklySummaryBaseData {

    private boolean hasEntries;
    private int daysWritten;
    private List<String> dailyAiSummaries;
    private String dominantMood;
    private List<JournalEntry> journalEntries;
}
