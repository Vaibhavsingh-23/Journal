package com.example.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "user_progress")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProgress {

    @Id
    private ObjectId id;

    // reference to User
    private ObjectId userId;

    // streak tracking
    private int currentStreak = 0;
    private int longestStreak = 0;

    // last day user wrote an entry
    private LocalDate lastEntryDate;

    // counters
    private int weeklyEntryCount = 0;
    private int totalEntries = 0;
}
