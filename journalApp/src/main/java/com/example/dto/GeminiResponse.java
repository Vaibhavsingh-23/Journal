package com.example.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GeminiResponse {
    private List<Candidate> candidates;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Candidate {
        private Content content;

        @JsonProperty("finishReason")
        private String finishReason;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Content {
        private List<Part> parts;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Part {
        private String text;
    }

    /**
     * Helper method to extract text from response
     */
    public String getGeneratedText() {
        if (candidates != null && !candidates.isEmpty()) {
            Candidate candidate = candidates.get(0);
            if (candidate.getContent() != null &&
                    candidate.getContent().getParts() != null &&
                    !candidate.getContent().getParts().isEmpty()) {
                return candidate.getContent().getParts().get(0).getText();
            }
        }
        return null;
    }
}