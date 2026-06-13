package com.example.controller;

import com.example.dto.JournalEntryDTO;
import com.example.entity.JournalEntry;
import com.example.entity.User;
import com.example.service.JournalEntryService;
import com.example.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Journal Entry CRUD endpoints — all require authentication.
 *
 * GET    /journal          — Get all entries (paginated)
 * POST   /journal          — Create a new entry
 * GET    /journal/id/{id}  — Get a single entry by ID
 * PUT    /journal/id/{id}  — Update an entry
 * DELETE /journal/id/{id}  — Delete an entry
 * POST   /journal/reanalyze/{id} — Re-run AI analysis
 */
@RestController
@RequestMapping("/journal")
@Tag(name = "Journal Entries", description = "Create, read, update and delete journal entries")
public class JournalEntryController {

    private final JournalEntryService journalEntryService;
    private final UserService userService;

    public JournalEntryController(JournalEntryService journalEntryService,
                                   UserService userService) {
        this.journalEntryService = journalEntryService;
        this.userService = userService;
    }

    /**
     * Get all journal entries for the authenticated user — paginated.
     */
    @GetMapping
    @Operation(summary = "Get all journal entries (paginated)")
    public ResponseEntity<Page<JournalEntryDTO>> getAllJournalEntriesOfUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        User user = userService.findByUserName(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size, Sort.by("date").descending());
        Page<JournalEntryDTO> entries = journalEntryService.getEntriesForUser(user.getId(), pageable);
        return ResponseEntity.ok(entries);
    }

    /**
     * Create a new journal entry.
     */
    @PostMapping
    @Operation(summary = "Create a new journal entry with AI analysis")
    public ResponseEntity<?> createEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody JournalEntryRequest request) {

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
        }

        JournalEntry entry = new JournalEntry(request.getTitle());
        entry.setContent(request.getContent());

        JournalEntry saved = journalEntryService.saveEntry(entry, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(journalEntryService.toDTO(saved));
    }

    /**
     * Get a single journal entry by ID — ownership verified.
     */
    @GetMapping("/id/{id}")
    @Operation(summary = "Get a journal entry by ID")
    public ResponseEntity<?> getJournalEntryById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id) {

        try {
            ObjectId objectId = new ObjectId(id);
            User user = userService.findByUserName(userDetails.getUsername());

            boolean owned = user.getJournalEntryIds().contains(objectId);
            if (!owned) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Entry not found"));
            }

            return journalEntryService.findById(objectId)
                    .map(journalEntryService::toDTO)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID format"));
        }
    }

    /**
     * Update an existing journal entry — ownership verified.
     * Also triggers AI re-analysis if the content changed.
     */
    @PutMapping("/id/{id}")
    @Operation(summary = "Update a journal entry (re-analyzes if content changes)")
    public ResponseEntity<?> updateEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id,
            @RequestBody JournalEntryRequest request) {

        try {
            ObjectId objectId = new ObjectId(id);
            User user = userService.findByUserName(userDetails.getUsername());

            if (!user.getJournalEntryIds().contains(objectId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Entry not found"));
            }

            JournalEntry updated = journalEntryService.updateEntry(
                    objectId, request.getTitle(), request.getContent());

            return ResponseEntity.ok(journalEntryService.toDTO(updated));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID format"));
        }
    }

    /**
     * Delete a journal entry — ownership verified.
     */
    @DeleteMapping("/id/{id}")
    @Operation(summary = "Delete a journal entry")
    public ResponseEntity<?> deleteEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id) {

        try {
            ObjectId objectId = new ObjectId(id);
            journalEntryService.deleteById(objectId, userDetails.getUsername());
            return ResponseEntity.noContent().build();

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID format"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Re-run AI analysis on an existing entry.
     */
    @PostMapping("/reanalyze/{id}")
    @Operation(summary = "Re-run AI analysis on a journal entry")
    public ResponseEntity<?> reanalyzeEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id) {

        try {
            ObjectId objectId = new ObjectId(id);
            User user = userService.findByUserName(userDetails.getUsername());

            if (!user.getJournalEntryIds().contains(objectId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Entry not found"));
            }

            JournalEntry reanalyzed = journalEntryService.reanalyzeEntry(objectId);
            return ResponseEntity.ok(journalEntryService.toDTO(reanalyzed));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID format"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------------------------------
    // Inner request DTO (simple enough to be inline here)
    // -----------------------------------------------------------------------

    @Data
    public static class JournalEntryRequest {
        @NotBlank
        private String title;
        private String content;
    }
}
