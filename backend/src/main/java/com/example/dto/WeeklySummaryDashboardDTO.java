package com.example.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class WeeklySummaryDashboardDTO {

    private String summaryText;
    private String type;
    private int daysWritten;
    private String mood;

    private LocalDate weekStartDate;
    private LocalDate weekEndDate;
    private LocalDateTime generatedAt;
}
