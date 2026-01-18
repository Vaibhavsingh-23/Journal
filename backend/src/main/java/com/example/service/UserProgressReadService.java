package com.example.service;

import com.example.entity.UserProgress;
import com.example.repository.UserProgressRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserProgressReadService {

    @Autowired
    private UserProgressRepository userProgressRepository;

    public UserProgress getProgressForUser(ObjectId userId) {
        return userProgressRepository
                .findByUserId(userId)
                .orElseGet(() -> {
                    UserProgress empty = new UserProgress();
                    empty.setUserId(userId);
                    return empty;
                });
    }
}
