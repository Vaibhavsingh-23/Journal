package com.example.service;

import com.example.entity.UserProgress;
import com.example.repository.UserProgressRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class UserProgressCommandService {

    private final UserProgressRepository userProgressRepository;

    public UserProgressCommandService(UserProgressRepository userProgressRepository) {
        this.userProgressRepository = userProgressRepository;
    }

    /**
     * Called every time the user saves a new journal entry.
     * Updates current streak, longest streak, weekly count, and total count.
     *
     * Streak logic:
     * - First entry ever              → streak = 1
     * - Same day as last entry        → no change (multiple entries in one day don't break streak)
     * - Next consecutive day          → streak + 1
     * - Gap of 2+ days                → streak resets to 1
     */
    public void updateProgressOnNewEntry(ObjectId userId) {
        LocalDate today = LocalDate.now();

        UserProgress progress = userProgressRepository
                .findByUserId(userId)
                .orElseGet(() -> {
                    UserProgress p = new UserProgress();
                    p.setUserId(userId);
                    return p;
                });

        LocalDate lastDate = progress.getLastEntryDate();

        if (lastDate == null) {
            // First ever entry
            progress.setCurrentStreak(1);
        } else if (lastDate.equals(today)) {
            // Multiple entries same day — don't change streak
            return;
        } else if (lastDate.equals(today.minusDays(1))) {
            // Consecutive day — extend streak
            progress.setCurrentStreak(progress.getCurrentStreak() + 1);
        } else {
            // Gap — reset streak
            progress.setCurrentStreak(1);
        }

        // Update longest streak if current exceeds it
        progress.setLongestStreak(
                Math.max(progress.getLongestStreak(), progress.getCurrentStreak())
        );

        progress.setLastEntryDate(today);
        progress.setWeeklyEntryCount(progress.getWeeklyEntryCount() + 1);
        progress.setTotalEntries(progress.getTotalEntries() + 1);

        userProgressRepository.save(progress);
    }
}
