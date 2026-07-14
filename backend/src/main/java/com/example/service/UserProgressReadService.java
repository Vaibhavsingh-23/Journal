package com.example.service;

import com.example.entity.UserProgress;
import com.example.repository.UserProgressRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserProgressReadService {

    private final UserProgressRepository userProgressRepository;

    public UserProgressReadService(UserProgressRepository userProgressRepository) {
        this.userProgressRepository = userProgressRepository;
    }

    public UserProgress getProgressForUser(ObjectId userId) {
        UserProgress progress = userProgressRepository
                .findByUserId(userId)
                .orElseGet(() -> {
                    UserProgress empty = new UserProgress();
                    empty.setUserId(userId);
                    return empty;
                });

        // Dynamic streak calculation based on time passed
        java.time.ZoneId userZone = java.time.ZoneId.of("Asia/Kolkata");
        java.time.LocalDate today = java.time.LocalDate.now(userZone);
        java.time.LocalDate lastEntry = progress.getLastEntryDate();

        if (lastEntry != null) {
            // If last entry was before yesterday, streak is broken
            if (lastEntry.isBefore(today.minusDays(1))) {
                progress.setCurrentStreak(0);
                progress.setLongestStreak(progress.getLongestStreak()); // keep longest
            }
            // If last entry was yesterday or today, streak is valid as saved
            // Do nothing — use the value saved by updateProgressOnNewEntry
        }

        return progress;
    }
}
