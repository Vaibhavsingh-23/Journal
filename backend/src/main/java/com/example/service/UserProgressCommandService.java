package com.example.service;

import com.example.entity.UserProgress;
import com.example.repository.UserProgressRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class UserProgressCommandService {

    private final UserProgressRepository userProgressRepository;
    private final com.example.repository.JournalEntryRepository journalEntryRepository;

    public UserProgressCommandService(UserProgressRepository userProgressRepository,
                                      com.example.repository.JournalEntryRepository journalEntryRepository) {
        this.userProgressRepository = userProgressRepository;
        this.journalEntryRepository = journalEntryRepository;
    }

    /**
     * Called every time the user saves a new journal entry.
     * Updates current streak, longest streak, weekly count, and total count
     * by perfectly rebuilding the streak from past entry timestamps in the user's timezone.
     */
    public void updateProgressOnNewEntry(ObjectId userId) {
        java.time.ZoneId userZone = java.time.ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(userZone);

        UserProgress progress = userProgressRepository
                .findByUserId(userId)
                .orElseGet(() -> {
                    UserProgress p = new UserProgress();
                    p.setUserId(userId);
                    return p;
                });

        // 1. Fetch all entries for this user
        java.util.List<com.example.entity.JournalEntry> entries = journalEntryRepository.findByUserId(userId);

        // 2. Extract distinct local dates in the user's timezone, sorted descending
        java.util.List<LocalDate> entryDates = entries.stream()
                .filter(e -> e.getDate() != null)
                .map(e -> e.getDate().atZone(java.time.ZoneId.systemDefault()).withZoneSameInstant(userZone).toLocalDate())
                .distinct()
                .sorted(java.util.Comparator.reverseOrder())
                .toList();

        // 3. Recalculate the streak
        int calculatedStreak = 0;
        LocalDate expectedDate = today;

        for (LocalDate date : entryDates) {
            if (date.equals(expectedDate)) {
                calculatedStreak++;
                expectedDate = expectedDate.minusDays(1);
            } else if (date.isBefore(expectedDate)) {
                // Gap found, stop counting
                break;
            }
            // If date is in the future (somehow), ignore it
        }

        // If no entry was made today, check if yesterday was the start of the streak
        if (calculatedStreak == 0 && !entryDates.isEmpty() && entryDates.get(0).equals(today.minusDays(1))) {
            expectedDate = today.minusDays(1);
            for (LocalDate date : entryDates) {
                if (date.equals(expectedDate)) {
                    calculatedStreak++;
                    expectedDate = expectedDate.minusDays(1);
                } else if (date.isBefore(expectedDate)) {
                    break;
                }
            }
        }

        progress.setCurrentStreak(calculatedStreak);

        // Update longest streak if current exceeds it
        progress.setLongestStreak(
                Math.max(progress.getLongestStreak(), progress.getCurrentStreak())
        );

        progress.setLastEntryDate(today);

        // Track the exact timestamp of the last entry
        if (!entries.isEmpty()) {
            java.time.LocalDateTime latestTime = entries.stream()
                    .map(com.example.entity.JournalEntry::getDate)
                    .filter(java.util.Objects::nonNull)
                    .max(java.time.LocalDateTime::compareTo)
                    .orElse(null);
            progress.setLastEntryAt(latestTime);
        }
        
        // Recalculate total entries
        progress.setTotalEntries(entries.size());
        
        // Recalculate weekly entries
        LocalDate oneWeekAgo = today.minusDays(7);
        long weeklyCount = entryDates.stream().filter(d -> d.isAfter(oneWeekAgo)).count();
        progress.setWeeklyEntryCount((int) weeklyCount);

        userProgressRepository.save(progress);
    }
}
