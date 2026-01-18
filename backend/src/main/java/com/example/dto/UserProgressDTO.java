package com.example.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UserProgressDTO {

    private int currentStreak;
    private int longestStreak;
    private int weeklyEntryCount;
    private int totalEntries;
    private LocalDate lastEntryDate;
}
