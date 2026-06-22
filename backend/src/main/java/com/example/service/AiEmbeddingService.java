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
 * vector embedding and persist it in ChromaDB.
 *
 * This enables the RAG pipeline: once an entry is embedded here, the user can
 * immediately ask questions about it via POST /ai/query.
 *
 * Design decisions:
 *  - @Async (fire-and-forget): embedEntry() runs in a Spring background thread.
 *    The HTTP response returns to the frontend IMMEDIATELY after MongoDB save.
 *    Embedding takes 3-8s (Gemini API call) — blocking the request thread caused
 *    the UI to show a blank screen while waiting.
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

        try {
            log.info("Sending entry to AI service for embedding: entryId={}, userId={}", entryId, userId);

            // POST request — response is a simple status dict, we log it and move on
            Map<?, ?> response = restTemplate.postForObject(url, request, Map.class);

            log.info("AI service embedding response for entryId={}: {}", entryId, response);

        } catch (Exception e) {
            // IMPORTANT: catch-all so embedding errors NEVER propagate to the caller.
            // The journal entry is already saved in MongoDB — this is just the AI layer.
            log.error(
                    "Failed to embed entryId={} in AI service (URL: {}). " +
                    "Entry is saved in MongoDB but will not be searchable via RAG until " +
                    "embedded. Cause: {}",
                    entryId, url, e.getMessage()
            );
        }
    }
}
