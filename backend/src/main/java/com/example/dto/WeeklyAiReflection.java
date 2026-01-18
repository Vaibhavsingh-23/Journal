package com.example.dto;

import lombok.Data;

@Data
public class WeeklyAiReflection {

    private String reflectionText;   // neutral weekly reflection
    private String trend;             // IMPROVING | DECLINING | MIXED
    private String suggestion;        // one emotional suggestion
}
