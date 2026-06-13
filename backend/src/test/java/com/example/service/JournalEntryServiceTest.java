package com.example.service;

import com.example.dto.JournalAnalysis;
import com.example.entity.JournalEntry;
import com.example.entity.User;
import com.example.mapper.JournalEntryMapper;
import com.example.repository.JournalEntryRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JournalEntryService Tests")
class JournalEntryServiceTest {

    @Mock private JournalEntryRepository journalEntryRepository;
    @Mock private UserService userService;
    @Mock private GeminiService geminiService;
    @Mock private UserProgressCommandService userProgressService;

    private JournalEntryMapper mapper;
    private JournalEntryService journalEntryService;

    private User testUser;
    private ObjectId userId;

    @BeforeEach
    void setUp() {
        mapper = new JournalEntryMapper();
        journalEntryService = new JournalEntryService(
                journalEntryRepository, userService, geminiService, userProgressService, mapper);

        userId = new ObjectId();
        testUser = new User();
        testUser.setId(userId);
        testUser.setUserName("testuser");
        testUser.setJournalEntryIds(new ArrayList<>());
    }

    @Test
    @DisplayName("saveEntry - sets userId and runs AI analysis when content present")
    void saveEntry_withContent_runsAiAnalysis() {
        JournalEntry entry = new JournalEntry("Test Entry");
        entry.setContent("Today was a great day at work.");

        JournalAnalysis mockAnalysis = new JournalAnalysis("Happy", "Joy, Pride", "Great day summary", "Keep it up!", 0.9);

        when(userService.findByUserName("testuser")).thenReturn(testUser);
        when(geminiService.analyzeJournalEntry(anyString())).thenReturn(mockAnalysis);
        when(journalEntryRepository.save(any())).thenAnswer(inv -> {
            JournalEntry saved = inv.getArgument(0);
            saved.setId(new ObjectId());
            return saved;
        });

        journalEntryService.saveEntry(entry, "testuser");

        assertThat(entry.getUserId()).isEqualTo(userId);
        assertThat(entry.getMood()).isEqualTo("Happy");
        assertThat(entry.getSentimentScore()).isEqualTo(0.9);
        assertThat(entry.getAnalysisCompleted()).isTrue();
        verify(geminiService).analyzeJournalEntry("Today was a great day at work.");
        verify(userProgressService).updateProgressOnNewEntry(userId);
    }

    @Test
    @DisplayName("saveEntry - saves without analysis when AI fails")
    void saveEntry_aiFailure_savesWithoutAnalysis() {
        JournalEntry entry = new JournalEntry("Test");
        entry.setContent("Some content");

        when(userService.findByUserName("testuser")).thenReturn(testUser);
        when(geminiService.analyzeJournalEntry(anyString()))
                .thenThrow(new RuntimeException("AI timeout"));
        when(journalEntryRepository.save(any())).thenAnswer(inv -> {
            JournalEntry e = inv.getArgument(0);
            e.setId(new ObjectId());
            return e;
        });

        // Should not throw
        assertThatNoException().isThrownBy(() ->
                journalEntryService.saveEntry(entry, "testuser"));

        assertThat(entry.getAnalysisCompleted()).isFalse();
    }

    @Test
    @DisplayName("saveEntry - skips AI analysis when content is blank")
    void saveEntry_noContent_skipsAnalysis() {
        JournalEntry entry = new JournalEntry("Empty Entry");
        entry.setContent("   "); // blank

        when(userService.findByUserName("testuser")).thenReturn(testUser);
        when(journalEntryRepository.save(any())).thenAnswer(inv -> {
            JournalEntry e = inv.getArgument(0);
            e.setId(new ObjectId());
            return e;
        });

        journalEntryService.saveEntry(entry, "testuser");

        verify(geminiService, never()).analyzeJournalEntry(anyString());
        assertThat(entry.getAnalysisCompleted()).isFalse();
    }

    @Test
    @DisplayName("deleteById - succeeds when user owns the entry")
    void deleteById_ownershipCheck_passes() {
        ObjectId entryId = new ObjectId();
        testUser.getJournalEntryIds().add(entryId);

        when(userService.findByUserName("testuser")).thenReturn(testUser);

        journalEntryService.deleteById(entryId, "testuser");

        verify(journalEntryRepository).deleteById(entryId);
        assertThat(testUser.getJournalEntryIds()).doesNotContain(entryId);
    }

    @Test
    @DisplayName("deleteById - throws when user does not own the entry")
    void deleteById_notOwned_throws() {
        ObjectId entryId = new ObjectId();
        // Don't add entryId to user's list → not owned

        when(userService.findByUserName("testuser")).thenReturn(testUser);

        assertThatThrownBy(() -> journalEntryService.deleteById(entryId, "testuser"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found or access denied");

        verify(journalEntryRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("reanalyzeEntry - success: updates AI fields")
    void reanalyzeEntry_success() {
        ObjectId entryId = new ObjectId();
        JournalEntry entry = new JournalEntry("Existing Entry");
        entry.setId(entryId);
        entry.setContent("I felt lost today.");

        JournalAnalysis analysis = new JournalAnalysis("Sad", "Worry, Confusion", "Felt lost", "Tomorrow is a new day", -0.3);

        when(journalEntryRepository.findById(entryId)).thenReturn(Optional.of(entry));
        when(geminiService.analyzeJournalEntry("I felt lost today.")).thenReturn(analysis);
        when(journalEntryRepository.save(any())).thenReturn(entry);

        JournalEntry result = journalEntryService.reanalyzeEntry(entryId);

        assertThat(result.getMood()).isEqualTo("Sad");
        assertThat(result.getAnalysisCompleted()).isTrue();
    }

    @Test
    @DisplayName("reanalyzeEntry - throws when entry not found")
    void reanalyzeEntry_notFound_throws() {
        ObjectId entryId = new ObjectId();
        when(journalEntryRepository.findById(entryId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> journalEntryService.reanalyzeEntry(entryId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }
}
