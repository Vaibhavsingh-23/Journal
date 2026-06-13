package com.example.service;

import com.example.dto.JournalAnalysis;
import com.example.dto.JournalEntryDTO;
import com.example.entity.JournalEntry;
import com.example.entity.User;
import com.example.mapper.JournalEntryMapper;
import com.example.repository.JournalEntryRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service   // FIXED: was @Component
@Slf4j
public class JournalEntryService {

    private final JournalEntryRepository journalEntryRepository;
    private final UserService userService;
    private final GeminiService geminiService;
    private final UserProgressCommandService userProgressService;
    private final JournalEntryMapper mapper;

    public JournalEntryService(JournalEntryRepository journalEntryRepository,
                                UserService userService,
                                GeminiService geminiService,
                                UserProgressCommandService userProgressService,
                                JournalEntryMapper mapper) {
        this.journalEntryRepository = journalEntryRepository;
        this.userService = userService;
        this.geminiService = geminiService;
        this.userProgressService = userProgressService;
        this.mapper = mapper;
    }

    /**
     * Save a new journal entry for the given user.
     * Performs AI analysis synchronously, falling back gracefully if AI fails.
     */
    @Transactional
    public JournalEntry saveEntry(JournalEntry journalEntry, String userName) {
        User user = userService.findByUserName(userName);

        journalEntry.setDate(LocalDateTime.now());
        journalEntry.setUserId(user.getId());  // CRITICAL: set ownership

        // AI analysis — best-effort (failure does not block saving)
        if (journalEntry.getContent() != null && !journalEntry.getContent().trim().isEmpty()) {
            log.info("Starting AI analysis for new journal entry...");
            try {
                JournalAnalysis analysis = geminiService.analyzeJournalEntry(journalEntry.getContent());
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
            log.warn("Journal entry has no content — skipping AI analysis");
            journalEntry.setAnalysisCompleted(false);
        }

        JournalEntry saved = journalEntryRepository.save(journalEntry);

        // Add entry ID to user's reference list
        user.getJournalEntryIds().add(saved.getId());
        userService.saveUser(user);

        // Update streaks and progress
        userProgressService.updateProgressOnNewEntry(user.getId());

        log.info("Journal entry saved with ID: {}", saved.getId());
        return saved;
    }

    /**
     * Update the title and content of an existing entry (ownership verified by controller).
     * Triggers re-analysis if content changed.
     */
    @Transactional
    public JournalEntry updateEntry(ObjectId entryId, String newTitle, String newContent) {
        JournalEntry entry = journalEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entry not found: " + entryId));

        boolean contentChanged = !newContent.equals(entry.getContent());
        entry.setTitle(newTitle);
        entry.setContent(newContent);

        if (contentChanged && newContent != null && !newContent.trim().isEmpty()) {
            log.info("Content changed — re-running AI analysis on updated entry...");
            try {
                JournalAnalysis analysis = geminiService.analyzeJournalEntry(newContent);
                entry.setMood(analysis.getMood());
                entry.setEmotions(analysis.getEmotions());
                entry.setAiSummary(analysis.getSummary());
                entry.setMotivationalThought(analysis.getMotivationalThought());
                entry.setSentimentScore(analysis.getSentimentScore());
                entry.setAnalysisCompleted(true);
            } catch (Exception e) {
                log.error("AI re-analysis failed on update: {}", e.getMessage());
            }
        }

        return journalEntryRepository.save(entry);
    }

    /**
     * Get all journal entries for a user — paginated.
     */
    public Page<JournalEntryDTO> getEntriesForUser(ObjectId userId, Pageable pageable) {
        return journalEntryRepository
                .findByUserIdOrderByDateDesc(userId, pageable)
                .map(mapper::toDTO);
    }

    /**
     * Find a single entry by ID.
     */
    public Optional<JournalEntry> findById(ObjectId id) {
        return journalEntryRepository.findById(id);
    }

    /**
     * Delete a journal entry (ownership must be verified by the caller / controller).
     */
    @Transactional
    public void deleteById(ObjectId entryId, String userName) {
        User user = userService.findByUserName(userName);
        boolean owned = user.getJournalEntryIds().contains(entryId);

        if (!owned) {
            log.warn("User {} attempted to delete entry {} which they don't own", userName, entryId);
            throw new RuntimeException("Entry not found or access denied");
        }

        user.getJournalEntryIds().remove(entryId);
        userService.saveUser(user);
        journalEntryRepository.deleteById(entryId);
        log.info("Journal entry deleted: {}", entryId);
    }

    /**
     * Re-run AI analysis on an existing entry.
     */
    public JournalEntry reanalyzeEntry(ObjectId entryId) {
        JournalEntry entry = journalEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entry not found: " + entryId));

        if (entry.getContent() == null || entry.getContent().trim().isEmpty()) {
            throw new RuntimeException("Entry has no content to analyze");
        }

        JournalAnalysis analysis = geminiService.analyzeJournalEntry(entry.getContent());
        entry.setMood(analysis.getMood());
        entry.setEmotions(analysis.getEmotions());
        entry.setAiSummary(analysis.getSummary());
        entry.setMotivationalThought(analysis.getMotivationalThought());
        entry.setSentimentScore(analysis.getSentimentScore());
        entry.setAnalysisCompleted(true);

        JournalEntry saved = journalEntryRepository.save(entry);
        log.info("Entry re-analyzed successfully: {}", entryId);
        return saved;
    }

    /**
     * Convert entity to DTO — delegates to mapper.
     */
    public JournalEntryDTO toDTO(JournalEntry entry) {
        return mapper.toDTO(entry);
    }
}