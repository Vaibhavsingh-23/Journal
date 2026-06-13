package com.example.mapper;

import com.example.dto.JournalEntryDTO;
import com.example.entity.JournalEntry;
import org.springframework.stereotype.Component;

/**
 * Converts JournalEntry entities to JournalEntryDTO objects.
 * Extracted from JournalEntryService to follow single-responsibility principle.
 */
@Component
public class JournalEntryMapper {

    /**
     * Map a JournalEntry entity to its DTO representation.
     * The DTO is what gets sent to the frontend — no ObjectId types, no internal fields.
     */
    public JournalEntryDTO toDTO(JournalEntry entry) {
        JournalEntryDTO dto = new JournalEntryDTO();
        dto.setId(entry.getId().toHexString());
        dto.setTitle(entry.getTitle());
        dto.setContent(entry.getContent());
        dto.setDate(entry.getDate());
        dto.setMood(entry.getMood());
        dto.setEmotions(entry.getEmotions());
        dto.setAiSummary(entry.getAiSummary());
        dto.setMotivationalThought(entry.getMotivationalThought());
        dto.setSentimentScore(entry.getSentimentScore());
        dto.setAnalysisCompleted(entry.getAnalysisCompleted());
        return dto;
    }
}
