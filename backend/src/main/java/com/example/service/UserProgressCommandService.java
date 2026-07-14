package com.example.service;

import com.example.entity.UserProgress;
import com.example.repository.UserProgressRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserProgressCommandService {

    private final UserProgressRepository userProgressRepository;
    private final com.example.repository.JournalEntryRepository journalEntryRepository;
    private static final Logger log = LoggerFactory.getLogger(UserProgressCommandService.class);

    public UserProgressCommandService(UserProgressRepository userProgressRepository,
            com.example.repository.JournalEntryRepository journalEntryRepository) {
        this.userProgressRepository = userProgressRepository;
        this.journalEntryRepository = journalEntryRepository;
    }

    /**
     * Called every time the user saves a new journal entry.
     * Updates current streak, longest streak, weekly count, and total count
     * by perfectly rebuilding the streak from past entry timestamps in the user's
     * timezone.
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

        java.util.List<com.example.entity.JournalEntry> entries = journalEntryRepository.findByUserId(userId);

        // 2. Extract distinct local dates in the user's timezone, deduplicated and sorted descending
        java.util.Set<LocalDate> entryDateSet = entries.stream()
                .filter(e -> e.getDate() != null)
                .map(e -> {
                    // Log each raw date for debugging
                    LocalDate d = e.getDate().toLocalDate();
                    log.info("STREAK DEBUG - raw entry date: {}", d);
                    return d;
                })
                .collect(java.util.stream.Collectors.toCollection(java.util.TreeSet::new));

        java.util.List<LocalDate> entryDates = new java.util.ArrayList<>(entryDateSet);
        java.util.Collections.sort(entryDates, java.util.Comparator.reverseOrder());
        log.info("STREAK DEBUG - after dedup entryDates: {}", entryDates);

        // 3. Recalculate the streak
        int calculatedStreak = 0;
        LocalDate expectedDate = today;
        for (LocalDate date : entryDates) {
            log.info("STREAK DEBUG - checking date: {} vs expected: {}", date, expectedDate);
            if (date.isEqual(expectedDate)) {
                calculatedStreak++;
                expectedDate = expectedDate.minusDays(1);
            } else if (date.isBefore(expectedDate)) {
                break;
            }
        }
        log.info("STREAK DEBUG - final calculatedStreak: {}", calculatedStreak);

        progress.setCurrentStreak(calculatedStreak);
        progress.setLongestStreak(Math.max(progress.getLongestStreak(), calculatedStreak));
        progress.setLastEntryDate(today);

        if (!entries.isEmpty()) {
            java.time.LocalDateTime latestTime = entries.stream()
                    .map(com.example.entity.JournalEntry::getDate)
                    .filter(java.util.Objects::nonNull)
                    .max(java.time.LocalDateTime::compareTo)
                    .orElse(null);
            progress.setLastEntryAt(latestTime);
        }

        progress.setTotalEntries(entries.size());

        // Recalculate weekly entries
        LocalDate oneWeekAgo = today.minusDays(7);
        long weeklyCount = entryDates.stream().filter(d -> d.isAfter(oneWeekAgo)).count();
        progress.setWeeklyEntryCount((int) weeklyCount);

        userProgressRepository.save(progress);
    }
}
