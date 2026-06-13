package com.example.service;

import com.example.dto.WeeklyAiReflection;
import com.example.dto.WeeklySummaryBaseData;
import com.example.entity.*;
import com.example.repository.WeeklySummaryRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WeeklySummaryCommandService Tests")
class WeeklySummaryCommandServiceTest {

    @Mock private WeeklySummaryQueryService queryService;
    @Mock private WeeklySummaryRepository summaryRepository;
    @Mock private GeminiService geminiService;
    @Mock private UserService userService;
    @Mock private EmailDeliveryService emailDeliveryService;

    private WeeklySummaryCommandService commandService;
    private User testUser;

    @BeforeEach
    void setUp() {
        commandService = new WeeklySummaryCommandService(
                queryService, summaryRepository, geminiService, userService, emailDeliveryService);

        testUser = new User();
        testUser.setId(new ObjectId());
        testUser.setUserName("testuser");
        testUser.setPreferences(new UserPreferences());
    }

    @Test
    @DisplayName("Idempotency check - skips if already generated today")
    void generateWeeklySummary_alreadyGeneratedToday_skips() {
        testUser.setLastWeeklySummaryDate(LocalDate.now());

        commandService.generateWeeklySummary(testUser);

        verify(queryService, never()).fetchWeeklyBaseData(any());
        verify(summaryRepository, never()).save(any());
    }

    @Test
    @DisplayName("No entries this week - saves MOTIVATION type summary")
    void generateWeeklySummary_noEntries_savesMotivation() {
        WeeklySummaryBaseData base = new WeeklySummaryBaseData();
        base.setHasEntries(false);
        base.setDaysWritten(0);
        base.setDominantMood("N/A");

        when(queryService.fetchWeeklyBaseData(any())).thenReturn(base);
        when(summaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        commandService.generateWeeklySummary(testUser);

        verify(summaryRepository).save(argThat(s ->
                s.getType() == WeeklySummaryType.MOTIVATION
        ));
        verify(geminiService, never()).generateWeeklyReflection(any());
    }

    @Test
    @DisplayName("Entries exist and AI succeeds - saves AI_REFLECTION type")
    void generateWeeklySummary_withEntries_aiSuccess_savesReflection() {
        WeeklySummaryBaseData base = new WeeklySummaryBaseData();
        base.setHasEntries(true);
        base.setDaysWritten(3);
        base.setDominantMood("Happy");
        base.setWeeklySignal("User wrote 3 entries...");

        WeeklyAiReflection reflection = new WeeklyAiReflection();
        reflection.setReflectionText("A week of growth.");
        reflection.setTrend("IMPROVING");
        reflection.setSuggestion("Journal daily.");

        when(queryService.fetchWeeklyBaseData(any())).thenReturn(base);
        when(geminiService.generateWeeklyReflection(any())).thenReturn(reflection);
        when(summaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        commandService.generateWeeklySummary(testUser);

        verify(summaryRepository).save(argThat(s ->
                s.getType() == WeeklySummaryType.AI_REFLECTION &&
                "IMPROVING".equals(s.getTrend())
        ));
    }

    @Test
    @DisplayName("AI fails - falls back to deterministic SUMMARY type")
    void generateWeeklySummary_aiFailure_savesFallback() {
        WeeklySummaryBaseData base = new WeeklySummaryBaseData();
        base.setHasEntries(true);
        base.setDaysWritten(2);
        base.setDominantMood("Neutral");
        base.setWeeklySignal("signal");

        when(queryService.fetchWeeklyBaseData(any())).thenReturn(base);
        when(geminiService.generateWeeklyReflection(any()))
                .thenThrow(new RuntimeException("Gemini down"));
        when(summaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        commandService.generateWeeklySummary(testUser);

        verify(summaryRepository).save(argThat(s ->
                s.getType() == WeeklySummaryType.SUMMARY
        ));
    }
}
