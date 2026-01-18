package com.example.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "weekly_summaries")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class WeeklySummary {

    @Id
    private ObjectId id;

    // which user this summary belongs to
    private ObjectId userId;

    // week range
    private LocalDate weekStartDate;
    private LocalDate weekEndDate;

    // generated content
    private WeeklySummaryType type; // SUMMARY or MOTIVATION
    private String summaryText;
    private String mood;
    private int daysWritten;

    // delivery handling
    private WeeklySummaryDeliveryStatus deliveryStatus;

    // timestamps
    private LocalDateTime generatedAt;
    private String trend;        // IMPROVING | DECLINING | MIXED
    private String suggestion;   // one emotional suggestion
}
