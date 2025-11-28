package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class JournalAnalysis {

    private String mood;

    private String emotions;

    private String summary;

    private String motivationalThought;

    private Double sentimentScore;
}