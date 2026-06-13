package com.example.service;

import com.example.entity.UserProgress;
import com.example.repository.UserProgressRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserProgressCommandService Tests")
class UserProgressCommandServiceTest {

    @Mock private UserProgressRepository userProgressRepository;

    private UserProgressCommandService progressService;
    private ObjectId userId;

    @BeforeEach
    void setUp() {
        progressService = new UserProgressCommandService(userProgressRepository);
        userId = new ObjectId();
    }

    @Test
    @DisplayName("First entry ever - sets streak to 1")
    void firstEntry_setsStreakToOne() {
        UserProgress progress = new UserProgress();
        progress.setUserId(userId);
        // lastEntryDate is null → first entry

        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));

        progressService.updateProgressOnNewEntry(userId);

        assertThat(progress.getCurrentStreak()).isEqualTo(1);
        assertThat(progress.getLongestStreak()).isEqualTo(1);
        assertThat(progress.getTotalEntries()).isEqualTo(1);
        assertThat(progress.getLastEntryDate()).isEqualTo(LocalDate.now());
        verify(userProgressRepository).save(progress);
    }

    @Test
    @DisplayName("Consecutive day - increments streak")
    void consecutiveDay_incrementsStreak() {
        UserProgress progress = new UserProgress();
        progress.setUserId(userId);
        progress.setCurrentStreak(3);
        progress.setLastEntryDate(LocalDate.now().minusDays(1));

        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));

        progressService.updateProgressOnNewEntry(userId);

        assertThat(progress.getCurrentStreak()).isEqualTo(4);
    }

    @Test
    @DisplayName("Same day entry - does NOT change streak")
    void sameDayEntry_noStreakChange() {
        UserProgress progress = new UserProgress();
        progress.setUserId(userId);
        progress.setCurrentStreak(5);
        progress.setLastEntryDate(LocalDate.now()); // already wrote today

        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));

        progressService.updateProgressOnNewEntry(userId);

        // Should return early — no save
        verify(userProgressRepository, never()).save(any());
        assertThat(progress.getCurrentStreak()).isEqualTo(5); // unchanged
    }

    @Test
    @DisplayName("Gap of 2+ days - resets streak to 1")
    void gapInDays_resetsStreak() {
        UserProgress progress = new UserProgress();
        progress.setUserId(userId);
        progress.setCurrentStreak(7);
        progress.setLongestStreak(7);   // longest = 7 initially
        progress.setLastEntryDate(LocalDate.now().minusDays(3)); // 3-day gap

        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));

        progressService.updateProgressOnNewEntry(userId);

        assertThat(progress.getCurrentStreak()).isEqualTo(1);
        assertThat(progress.getLongestStreak()).isEqualTo(7); // longest preserved (max(7,1)=7)
    }

    @Test
    @DisplayName("Longest streak updated when current exceeds it")
    void longestStreakUpdated_whenCurrentExceedsIt() {
        UserProgress progress = new UserProgress();
        progress.setUserId(userId);
        progress.setCurrentStreak(9);
        progress.setLongestStreak(9);
        progress.setLastEntryDate(LocalDate.now().minusDays(1));

        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));

        progressService.updateProgressOnNewEntry(userId);

        assertThat(progress.getCurrentStreak()).isEqualTo(10);
        assertThat(progress.getLongestStreak()).isEqualTo(10);
    }
}
