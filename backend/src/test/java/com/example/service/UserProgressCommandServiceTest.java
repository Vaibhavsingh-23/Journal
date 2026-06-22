package com.example.service;

import com.example.entity.JournalEntry;
import com.example.entity.UserProgress;
import com.example.repository.JournalEntryRepository;
import com.example.repository.UserProgressRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserProgressCommandService Tests")
class UserProgressCommandServiceTest {

    @Mock private UserProgressRepository userProgressRepository;
    @Mock private JournalEntryRepository journalEntryRepository;

    private UserProgressCommandService progressService;
    private ObjectId userId;
    private ZoneId userZone;

    @BeforeEach
    void setUp() {
        progressService = new UserProgressCommandService(userProgressRepository, journalEntryRepository);
        userId = new ObjectId();
        userZone = ZoneId.of("Asia/Kolkata");
    }

    private JournalEntry createEntry(LocalDateTime dateTime) {
        JournalEntry entry = new JournalEntry("test title");
        entry.setDate(dateTime);
        return entry;
    }

    @Test
    @DisplayName("First entry ever - sets streak to 1")
    void firstEntry_setsStreakToOne() {
        UserProgress progress = new UserProgress();
        progress.setUserId(userId);

        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));
        
        // Mock 1 entry today
        when(journalEntryRepository.findByUserId(userId)).thenReturn(List.of(
                createEntry(LocalDateTime.now(userZone))
        ));

        progressService.updateProgressOnNewEntry(userId);

        assertThat(progress.getCurrentStreak()).isEqualTo(1);
        assertThat(progress.getTotalEntries()).isEqualTo(1);
        verify(userProgressRepository).save(progress);
    }

    @Test
    @DisplayName("Consecutive day - increments streak")
    void consecutiveDay_incrementsStreak() {
        UserProgress progress = new UserProgress();
        progress.setUserId(userId);

        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));

        // Mock entries for today and yesterday
        when(journalEntryRepository.findByUserId(userId)).thenReturn(List.of(
                createEntry(LocalDateTime.now(userZone)),
                createEntry(LocalDateTime.now(userZone).minusDays(1))
        ));

        progressService.updateProgressOnNewEntry(userId);

        assertThat(progress.getCurrentStreak()).isEqualTo(2);
        assertThat(progress.getTotalEntries()).isEqualTo(2);
    }

    @Test
    @DisplayName("Same day entry - streak remains 1, count increments")
    void sameDayEntry_noStreakChange() {
        UserProgress progress = new UserProgress();
        progress.setUserId(userId);

        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));

        // Mock two entries for today
        when(journalEntryRepository.findByUserId(userId)).thenReturn(List.of(
                createEntry(LocalDateTime.now(userZone)),
                createEntry(LocalDateTime.now(userZone).minusHours(1))
        ));

        progressService.updateProgressOnNewEntry(userId);

        assertThat(progress.getCurrentStreak()).isEqualTo(1); 
        assertThat(progress.getTotalEntries()).isEqualTo(2); 
    }

    @Test
    @DisplayName("Gap of 2+ days - resets streak to 1")
    void gapInDays_resetsStreak() {
        UserProgress progress = new UserProgress();
        progress.setUserId(userId);
        progress.setLongestStreak(7);

        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));

        // Mock entry today and 3 days ago
        when(journalEntryRepository.findByUserId(userId)).thenReturn(List.of(
                createEntry(LocalDateTime.now(userZone)),
                createEntry(LocalDateTime.now(userZone).minusDays(3))
        ));

        progressService.updateProgressOnNewEntry(userId);

        assertThat(progress.getCurrentStreak()).isEqualTo(1);
        assertThat(progress.getLongestStreak()).isEqualTo(7); // preserved
    }
}
