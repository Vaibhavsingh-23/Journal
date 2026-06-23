package com.example.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * AiEmbeddingService
 * ==================
 * Calls the Python AI micro-service to convert a journal entry's text into a
 * vector embedding and persist it in Pinecone.
 *
 * This enables the RAG pipeline: once an entry is embedded here, the user can
 * immediately ask questions about it via POST /ai/query.
 *
 * Design decisions:
 *  - @Async (fire-and-forget): embedEntry() runs in a Spring background thread.
 *    The HTTP response returns to the frontend IMMEDIATELY after MongoDB save.
 *    Embedding takes 3-8s (Gemini API call) — blocking the request thread caused
 *    the UI to show a blank screen while waiting.
 *  - Retries up to 3 times with exponential back-off (1s → 2s → 4s) to handle
 *    Render free-tier cold-starts where the Python service may need 30-60s to wake.
 *  - Failures are logged but NEVER propagate to the caller, so a Python service
 *    outage cannot break the core journalling workflow.
 *  - URL is externalised to application.yml (ai.service.url) so it can be
 *    overridden per environment without recompiling.
 */
@Service
@Slf4j
public class AiEmbeddingService {

    private final RestTemplate restTemplate;

    /**
     * Base URL of the Python AI service.
     * Default: http://localhost:8001  (set in application.yml)
     * Override in production via: AI_SERVICE_URL environment variable.
     */
    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    // Constructor injection — preferred over @Autowired on field
    public AiEmbeddingService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Send a single journal entry to the Python AI service for embedding.
     *
     * The Python endpoint (POST /ai/embed/entry) expects:
     * {
     *   "entry_id": "64a1b2c3d4e5f60012345678",   <- MongoDB ObjectId as string
     *   "text":     "Today was a great day...",
     *   "user_id":  "64a1b2c3d4e5f60000000001",
     *   "date":     "2026-06-21T10:00:00"
     * }
     *
     * Retries up to 3 times with exponential back-off to survive cold-starts.
     *
     * @param entryId  MongoDB ObjectId string of the saved entry
     * @param text     Full plain-text content of the journal entry
     * @param userId   MongoDB ObjectId string of the owning user
     * @param date     Creation/update timestamp of the entry
     */
    @Async  // runs in a background thread — does NOT block the HTTP response
    public void embedEntry(String entryId, String text, String userId, LocalDateTime date) {

        // Skip embedding if the content is blank — nothing useful to embed
        if (text == null || text.isBlank()) {
            log.debug("embedEntry: skipping blank content for entryId={}", entryId);
            return;
        }

        // Warn early if the URL looks like a misconfigured localhost fallback in production
        if (aiServiceUrl.contains("localhost")) {
            log.warn("embedEntry: AI_SERVICE_URL is set to localhost ({}). " +
                     "If running in production, set the AI_SERVICE_URL env var " +
                     "to the actual Python service URL — embeddings will fail otherwise.",
                     aiServiceUrl);
        }

        String url = aiServiceUrl + "/ai/embed/entry";

        // Build the JSON request body as a simple Map — RestTemplate serialises it
        Map<String, String> requestBody = Map.of(
                "entry_id", entryId,
                "text",     text,
                "user_id",  userId,
                "date",     date != null ? date.toString() : ""
        );

        // Set Content-Type: application/json header
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

        // Retry up to 3 times with exponential back-off (1s → 2s → 4s).
        // Handles Render free-tier cold-starts (~30-60s warm-up) and transient failures.
        int maxAttempts = 3;
        long backoffMs  = 1_000;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.info("Embedding entryId={} for userId={} (attempt {}/{})",
                        entryId, userId, attempt, maxAttempts);

                Map<?, ?> response = restTemplate.postForObject(url, request, Map.class);

                log.info("AI service embedding success for entryId={}: {}", entryId, response);
                return; // success — stop retrying

            } catch (Exception e) {
                if (attempt == maxAttempts) {
                    // All attempts exhausted — log clearly so it's easy to spot in Render logs
                    log.error(
                        "embedEntry FAILED after {} attempts for entryId={} (URL: {}). " +
                        "Entry is saved in MongoDB but will NOT be searchable via RAG until embedded. " +
                        "Use POST /ai/embed/all to re-sync manually. Root cause: {}",
                        maxAttempts, entryId, url, e.getMessage()
                    );
                } else {
                    log.warn("embedEntry attempt {}/{} failed for entryId={}: {}. Retrying in {}ms…",
                            attempt, maxAttempts, entryId, e.getMessage(), backoffMs);
                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                    backoffMs *= 2; // exponential back-off: 1s → 2s → 4s
                }
            }
        }
    }
}
