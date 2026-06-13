package com.example.entity;

import lombok.Data;
import lombok.NonNull;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "journal_entries")
@Data
public class JournalEntry {

    @Id
    private ObjectId id;

    /**
     * Reference to the owning user.
     * Used for all user-scoped queries (weekly summary, etc.)
     * INDEXED for fast user-based queries.
     */
    @Indexed
    private ObjectId userId;

    @NonNull
    private String title;

    private String content;

    private LocalDateTime date;

    private String mood;

    private String emotions;

    private String aiSummary;

    private String motivationalThought;

    private Double sentimentScore;

    private Boolean analysisCompleted = false;
}