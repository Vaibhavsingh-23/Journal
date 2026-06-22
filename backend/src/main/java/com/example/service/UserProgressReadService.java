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
        if (progress.getLastEntryDate() != null) {
            java.time.LocalDate today = java.time.LocalDate.now();
            if (progress.getLastEntryDate().isBefore(today.minusDays(1))) {
                progress.setCurrentStreak(0);
            }
        }

        return progress;
    }
}
