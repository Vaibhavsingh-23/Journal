package com.example.service;

import com.example.dto.JournalAnalysis;
import com.example.dto.JournalEntryDTO;
import com.example.entity.JournalEntry;
import com.example.entity.User;
import com.example.repository.JournalEntryRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
public class JournalEntryService {

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private UserProgressCommandService userProgressService;

    /**
     * Save journal entry with AI analysis
     * This method now includes automatic sentiment analysis using Gemini API
     */
    @Transactional
    public void saveEntry(JournalEntry journalEntry, String userName) {
        try {
            // Step 1: Get user and set date
            User user = userService.findByUserName(userName);
            journalEntry.setDate(LocalDateTime.now());

            // Step 2: Perform AI analysis if content is present
            if (journalEntry.getContent() != null && !journalEntry.getContent().trim().isEmpty()) {
                log.info("Starting AI analysis for journal entry...");

                try {
                    // Call Gemini API for analysis
                    JournalAnalysis analysis = geminiService.analyzeJournalEntry(journalEntry.getContent());

                    // Set analysis results
                    journalEntry.setMood(analysis.getMood());
                    journalEntry.setEmotions(analysis.getEmotions());
                    journalEntry.setAiSummary(analysis.getSummary());
                    journalEntry.setMotivationalThought(analysis.getMotivationalThought());
                    journalEntry.setSentimentScore(analysis.getSentimentScore());
                    journalEntry.setAnalysisCompleted(true);

                    log.info("AI analysis completed. Mood: {}, Sentiment: {}",
                            analysis.getMood(), analysis.getSentimentScore());

                } catch (Exception e) {
                    log.error("AI analysis failed, saving entry without analysis: {}", e.getMessage());
                    journalEntry.setAnalysisCompleted(false);
                }
            } else {
                log.warn("Journal entry has no content, skipping AI analysis");
                journalEntry.setAnalysisCompleted(false);
            }

            // Step 3: Save to database
            JournalEntry saved = journalEntryRepository.save(journalEntry);

            // Step 4: Add to user's journal list
            user.getJournalEntries().add(saved);
            userService.saveUser(user);
            // Step 5: Update user progress & streaks  ✅ ADD THIS
            userProgressService.updateProgressOnNewEntry(user.get_id());
            log.info("Journal entry saved successfully with ID: {}", saved.getId());

        } catch (Exception e) {
            log.error("Exception while saving journal entry", e);
            throw new RuntimeException("An error occurred while saving the entry", e);
        }
    }

    /**
     * Save entry without user association (used for updates)
     */
    public void saveEntry(JournalEntry journalEntry) {
        try {
            journalEntryRepository.save(journalEntry);

        } catch (Exception e) {
            log.error("Exception while saving journal entry", e);
        }
    }
//---------------------------------------------------------------------------------

    public JournalEntryDTO toDTO(JournalEntry entry) {
        JournalEntryDTO dto = new JournalEntryDTO();

        dto.setId(entry.getId().toHexString()); // 🔥 THIS FIXES EVERYTHING
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

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



    /**
     * Get all journal entries
     */
    public List<JournalEntry> getAll() {
        return journalEntryRepository.findAll();
    }

    /**
     * Find journal entry by ID
     */
    public Optional<JournalEntry> findById(ObjectId id) {
        return journalEntryRepository.findById(id);
    }

    /**
     * Delete journal entry by ID
     */
    @Transactional
    public void deleteById(ObjectId id, String userName) {
        try {
            User user = userService.findByUserName(userName);
            boolean removed = user.getJournalEntries().removeIf(x -> x.getId().equals(id));
            if (removed) {
                userService.saveUser(user);
                journalEntryRepository.deleteById(id);
                log.info("Journal entry deleted successfully: {}", id);
            }
        } catch (Exception e) {
            log.error("Exception while deleting journal entry", e);
            throw new RuntimeException("An error occurred while deleting the entry.", e);
        }
    }

    /**
     * Re-analyze an existing journal entry
     * Useful if user wants to refresh the AI analysis
     */
    public JournalEntry reanalyzeEntry(ObjectId entryId) {
        try {
            Optional<JournalEntry> optionalEntry = findById(entryId);
            if (optionalEntry.isPresent()) {
                JournalEntry entry = optionalEntry.get();

                if (entry.getContent() != null && !entry.getContent().trim().isEmpty()) {
                    JournalAnalysis analysis = geminiService.analyzeJournalEntry(entry.getContent());

                    entry.setMood(analysis.getMood());
                    entry.setEmotions(analysis.getEmotions());
                    entry.setAiSummary(analysis.getSummary());
                    entry.setMotivationalThought(analysis.getMotivationalThought());
                    entry.setSentimentScore(analysis.getSentimentScore());
                    entry.setAnalysisCompleted(true);

                    saveEntry(entry);
                    log.info("Entry re-analyzed successfully");
                    return entry;
                }
            }
            throw new RuntimeException("Entry not found or has no content");
        } catch (Exception e) {
            log.error("Error re-analyzing entry: {}", e.getMessage());
            throw new RuntimeException("Failed to re-analyze entry", e);
        }
    }
}