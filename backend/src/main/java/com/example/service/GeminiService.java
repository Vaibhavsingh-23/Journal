package com.example.service;

import com.example.dto.GeminiRequest;
import com.example.dto.GeminiResponse;
import com.example.dto.JournalAnalysis;
import com.example.dto.WeeklyAiReflection;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@Slf4j
public class GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Analyze a journal entry using Gemini.
     * Returns mood, emotions, summary, motivational thought, and sentiment score.
     * Falls back gracefully if the API fails.
     */
    public JournalAnalysis analyzeJournalEntry(String journalContent) {
        try {
            String prompt = buildAnalysisPrompt(journalContent);
            String generatedText = callGemini(prompt);
            return parseAnalysisResponse(generatedText);
        } catch (Exception e) {
            log.error("Error calling Gemini API for analysis: {}", e.getMessage(), e);
            return createFallbackAnalysis();
        }
    }

    /**
     * Generate a weekly reflection using Gemini.
     * Returns reflectionText, trend (IMPROVING/DECLINING/MIXED), and a suggestion.
     * Throws on failure — caller should handle with a deterministic fallback.
     */
    public WeeklyAiReflection generateWeeklyReflection(String weeklySignal) {
        try {
            String prompt = buildWeeklyReflectionPrompt(weeklySignal);
            String generatedText = callGemini(prompt);

            // Strip markdown code fences if Gemini wraps JSON in ```json ... ```
            String cleaned = generatedText
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("(?s)```\\s*", "")
                    .trim();

            return objectMapper.readValue(cleaned, WeeklyAiReflection.class);

        } catch (Exception e) {
            log.error("Weekly AI reflection failed", e);
            throw new RuntimeException("Weekly AI reflection failed", e);
        }
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private String callGemini(String prompt) {
        GeminiRequest request = GeminiRequest.create(prompt);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Best practice: Use the header instead of the URL parameter
        // Trim the API key to remove any trailing carriage returns from .env parsing on Windows
        String finalKey = apiKey != null ? apiKey.trim() : "";
        headers.set("x-goog-api-key", finalKey);

        log.info("DEBUG: API Key being used starts with: {}", finalKey.length() >= 4 ? finalKey.substring(0, 4) : finalKey);

        HttpEntity<GeminiRequest> entity = new HttpEntity<>(request, headers);
        String url = apiUrl != null ? apiUrl.trim() : "";

        log.info("Calling Gemini API...");

        ResponseEntity<GeminiResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                GeminiResponse.class
        );

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            String text = response.getBody().getGeneratedText();
            if (text != null) {
                log.info("Gemini call successful.");
                return text;
            }
        }

        throw new RuntimeException("Gemini returned empty or non-OK response: " + response.getStatusCode());
    }

    private String buildAnalysisPrompt(String journalContent) {
        return String.format("""
                Analyze the following journal entry and provide:
                
                1. **Mood**: Identify the primary mood (one word: Happy, Sad, Anxious, Reflective, Grateful, Excited, Neutral, etc.)
                2. **Emotions**: List 2-4 emotions present (comma-separated: Joy, Pride, Hope, Worry, Fear, etc.)
                3. **Summary**: Provide a 2-3 sentence summary of the entry
                4. **Motivational Thought**: Give a personalized, encouraging thought or quote based on the entry (1-2 sentences)
                5. **Sentiment Score**: Rate overall sentiment from -1.0 (very negative) to 1.0 (very positive), 0.0 is neutral
                
                Format your response EXACTLY like this (no extra text):
                Mood: [mood]
                Emotions: [emotion1, emotion2, emotion3]
                Summary: [summary text]
                Motivational Thought: [motivational text]
                Sentiment Score: [score]
                
                Journal Entry:
                "%s"
                """, journalContent);
    }

    private String buildWeeklyReflectionPrompt(String weeklySignal) {
        return """
                You are an assistant that writes a neutral weekly reflection for a journaling app.
                
                Rules:
                - Do NOT address the user directly
                - Do NOT give productivity or medical advice
                - Keep tone neutral and reflective
                
                Tasks:
                1. Write a short weekly reflection (3–4 sentences)
                2. Identify emotional trend: IMPROVING, DECLINING, or MIXED
                3. Suggest ONE gentle emotional reflection step
                
                Return STRICT JSON (no markdown code fences) in this exact format:
                {
                  "reflectionText": "...",
                  "trend": "IMPROVING | DECLINING | MIXED",
                  "suggestion": "..."
                }
                
                Weekly data:
                %s
                """.formatted(weeklySignal);
    }

    private JournalAnalysis parseAnalysisResponse(String responseText) {
        try {
            JournalAnalysis analysis = new JournalAnalysis();
            String[] lines = responseText.split("\n");

            for (String line : lines) {
                if (line.startsWith("Mood:")) {
                    analysis.setMood(extractValue(line));
                } else if (line.startsWith("Emotions:")) {
                    analysis.setEmotions(extractValue(line));
                } else if (line.startsWith("Summary:")) {
                    analysis.setSummary(extractValue(line));
                } else if (line.startsWith("Motivational Thought:")) {
                    analysis.setMotivationalThought(extractValue(line));
                } else if (line.startsWith("Sentiment Score:")) {
                    try {
                        analysis.setSentimentScore(Double.parseDouble(extractValue(line).trim()));
                    } catch (NumberFormatException e) {
                        analysis.setSentimentScore(0.0);
                    }
                }
            }

            // Set defaults for any missing fields
            if (analysis.getMood() == null)              analysis.setMood("Neutral");
            if (analysis.getEmotions() == null)          analysis.setEmotions("Mixed");
            if (analysis.getSummary() == null)           analysis.setSummary("Journal entry recorded.");
            if (analysis.getMotivationalThought() == null) analysis.setMotivationalThought("Keep journaling!");
            if (analysis.getSentimentScore() == null)   analysis.setSentimentScore(0.0);

            return analysis;

        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage());
            return createFallbackAnalysis();
        }
    }

    private String extractValue(String line) {
        int colonIndex = line.indexOf(":");
        if (colonIndex != -1 && colonIndex < line.length() - 1) {
            return line.substring(colonIndex + 1).trim();
        }
        return "";
    }

    private JournalAnalysis createFallbackAnalysis() {
        JournalAnalysis analysis = new JournalAnalysis();
        analysis.setMood("Neutral");
        analysis.setEmotions("Unable to analyze");
        analysis.setSummary("Journal entry saved. AI analysis unavailable at this time.");
        analysis.setMotivationalThought("Every entry is a step forward. Keep writing!");
        analysis.setSentimentScore(0.0);
        return analysis;
    }
}