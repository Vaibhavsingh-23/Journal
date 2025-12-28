package com.example.service;

import com.example.dto.GeminiRequest;
import com.example.dto.GeminiResponse;
import com.example.dto.JournalAnalysis;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class GeminiService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    /**
     * Analyze journal entry using Gemini API
     * Returns mood, emotions, summary, motivational thought, and sentiment score
     */
    public JournalAnalysis analyzeJournalEntry(String journalContent) {
        try {
            // Step 1: Build the prompt for Gemini
            String prompt = buildAnalysisPrompt(journalContent);

            // Step 2: Create request payload
            GeminiRequest request = GeminiRequest.create(prompt);

            // Step 3: Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Step 4: Create HTTP entity
            HttpEntity<GeminiRequest> entity = new HttpEntity<>(request, headers);

            // Step 5: Build URL with API key
            String urlWithKey = apiUrl + "?key=" + apiKey;

            log.info("Calling Gemini API for journal analysis...");

            // Step 6: Make POST request to Gemini
            ResponseEntity<GeminiResponse> response = restTemplate.exchange(
                    urlWithKey,
                    HttpMethod.POST,
                    entity,
                    GeminiResponse.class
            );

            // Step 7: Parse response
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String generatedText = response.getBody().getGeneratedText();
                log.info("Gemini analysis completed successfully");
                return parseAnalysisResponse(generatedText);
            } else {
                log.error("Gemini API returned non-OK status: {}", response.getStatusCode());
                return createFallbackAnalysis();
            }

        } catch (Exception e) {
            log.error("Error calling Gemini API: {}", e.getMessage(), e);
            return createFallbackAnalysis();
        }
    }

    /**
     * Build a structured prompt for Gemini to analyze the journal entry
     */
    private String buildAnalysisPrompt(String journalContent) {
        return String.format("""
                Analyze the following journal entry and provide:
                
                1. **Mood**: Identify the primary mood (one word: Happy, Sad, Anxious, Reflective, Grateful, Excited, Neutral, etc.)
                2. **Emotions**: List 2-4 emotions present (comma-separated: Joy, Pride, Hope, Worry, Fear, etc.)
                3. **Summary**: Provide a 2-3 sentence summary of the entry
                4. **Motivational Thought**: Give a personalized, encouraging thought or quote based on the entry (1-2 sentences)
                5. **Sentiment Score**: Rate overall sentiment from -1.0 (very negative) to 1.0 (very positive), 0.0 is neutral
                
                Format your response EXACTLY like this:
                Mood: [mood]
                Emotions: [emotion1, emotion2, emotion3]
                Summary: [summary text]
                Motivational Thought: [motivational text]
                Sentiment Score: [score]
                
                Journal Entry:
                "%s"
                """, journalContent);
    }


    private JournalAnalysis parseAnalysisResponse(String responseText) {
        try {
            JournalAnalysis analysis = new JournalAnalysis();

            // Parse each field using line-by-line extraction
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
                        String scoreStr = extractValue(line).trim();
                        analysis.setSentimentScore(Double.parseDouble(scoreStr));
                    } catch (NumberFormatException e) {
                        analysis.setSentimentScore(0.0);
                    }
                }
            }

            // Validate and set defaults if needed
            if (analysis.getMood() == null) analysis.setMood("Neutral");
            if (analysis.getEmotions() == null) analysis.setEmotions("Mixed");
            if (analysis.getSummary() == null) analysis.setSummary("Journal entry recorded");
            if (analysis.getMotivationalThought() == null)
                analysis.setMotivationalThought("Keep journaling!");
            if (analysis.getSentimentScore() == null) analysis.setSentimentScore(0.0);

            return analysis;

        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage());
            return createFallbackAnalysis();
        }
    }

    /**
     * Extract value after colon in format "Key: Value"
     */
    private String extractValue(String line) {
        int colonIndex = line.indexOf(":");
        if (colonIndex != -1 && colonIndex < line.length() - 1) {
            return line.substring(colonIndex + 1).trim();
        }
        return "";
    }

    /**
     * Create fallback analysis if API fails
     */
    private JournalAnalysis createFallbackAnalysis() {
        JournalAnalysis analysis = new JournalAnalysis();
        analysis.setMood("Neutral");
        analysis.setEmotions("Unable to analyze");
        analysis.setSummary("Journal entry saved. AI analysis unavailable.");
        analysis.setMotivationalThought("Every entry is a step forward. Keep writing!");
        analysis.setSentimentScore(0.0);
        return analysis;
    }
}