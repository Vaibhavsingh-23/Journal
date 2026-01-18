
package com.example.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class JournalEntryDTO {

    private String id;   //
    private String title;
    private String content;
    private LocalDateTime date;
    private String mood;
    private String emotions;
    private String aiSummary;
    private String motivationalThought;
    private Double sentimentScore;
    private Boolean analysisCompleted;
}
