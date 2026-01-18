package com.example.entity;

import lombok.Data;

@Data
public class
UserPreferences {

    // user explicitly opts in
    private boolean weeklySummaryEnabled = false;

    /**
     * 1 = Monday ... 7 = Sunday
     * null means not selected
     */
    private Integer weeklySummaryDay;

    // future use (email-ready)
    private boolean emailNotificationsEnabled = false;
}
