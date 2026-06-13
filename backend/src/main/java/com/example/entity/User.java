package com.example.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    @Field("_id")   // keeps the MongoDB field name as _id
    private ObjectId id;

    /**
     * Returns the hex string form of the ObjectId.
     * Used when passing IDs in JSON responses.
     */
    public String getStringId() {
        return id != null ? id.toHexString() : null;
    }

    @Indexed(unique = true)
    @Field("username")
    private String userName;

    private String password;

    private String email;

    private List<String> roles;

    /**
     * List of ObjectId references to this user's journal entries.
     * REMOVED @DBRef — that caused N+1 queries by eager-loading every entry.
     * Entries are now queried directly from journal_entries collection using userId field.
     *
     * We keep this list as a lightweight reference cache (ObjectIds only, not full documents).
     */
    private List<ObjectId> journalEntryIds = new ArrayList<>();

    /**
     * Embedded preferences document (not a separate collection).
     */
    private UserPreferences preferences = new UserPreferences();

    /**
     * Used for cron idempotency — prevents generating duplicate weekly summaries.
     */
    private LocalDate lastWeeklySummaryDate;
}
