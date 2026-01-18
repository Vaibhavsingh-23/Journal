package com.example.service;

import com.example.entity.UserProgress;
import com.example.repository.UserProgressRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class UserProgressCommandService {

    @Autowired
    private UserProgressRepository userProgressRepository;

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
            progress.setCurrentStreak(1);
        }
        else if (lastDate.equals(today)) {
            // same-day entry → do NOT change streak
            return;
        }
        else if (lastDate.equals(today.minusDays(1))) {
            progress.setCurrentStreak(progress.getCurrentStreak() + 1);
        }
        else {
            progress.setCurrentStreak(1);
        }

        progress.setLongestStreak(
                Math.max(progress.getLongestStreak(), progress.getCurrentStreak())
        );

        progress.setLastEntryDate(today);
        progress.setWeeklyEntryCount(progress.getWeeklyEntryCount() + 1);
        progress.setTotalEntries(progress.getTotalEntries() + 1);

        userProgressRepository.save(progress);
    }
}
