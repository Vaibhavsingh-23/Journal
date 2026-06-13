package com.example.entity;

import lombok.Data;

@Data
public class UserPreferences {

    // User explicitly opts in to weekly summaries
    private boolean weeklySummaryEnabled = false;

    /**
     * Preferred day for weekly summary delivery.
     * Uses ISO-8601: 1 = Monday, 7 = Sunday.
     * null means not selected yet.
     */
    private Integer weeklySummaryDay;

    // Whether to deliver the summary via email (in addition to dashboard)
    private boolean emailNotificationsEnabled = false;
}
