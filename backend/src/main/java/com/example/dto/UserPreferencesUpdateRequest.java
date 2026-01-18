package com.example.dto;

import lombok.Data;

@Data
public class UserPreferencesUpdateRequest {

    private String email;

    private Boolean weeklySummaryEnabled;

    /**
     * 1 = Monday ... 7 = Sunday
     */
    private Integer weeklySummaryDay;

    private Boolean emailNotificationsEnabled;
}
