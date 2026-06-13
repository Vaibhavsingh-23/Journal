package com.example.migration;

import com.example.entity.JournalEntry;
import com.example.entity.User;
import com.example.repository.JournalEntryRepository;
import com.example.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * One-time migration: backfill the userId field on all existing JournalEntry documents.
 *
 * Before this migration, journal entries had no userId — ownership was tracked only
 * via the User.journalEntryIds list. This migration reads that list and stamps each
 * entry with its owner's userId.
 *
 * The migration:
 * 1. Runs automatically on startup (after app is ready)
 * 2. Checks how many entries still have null userId — if 0, skips immediately
 * 3. Loops through all users and their journalEntryIds
 * 4. For each entry ID, sets userId = user.id if not already set
 * 5. Logs a summary when done
 *
 * Safe to run multiple times (idempotent — skips already-migrated entries).
 */
@Component
@Slf4j
public class JournalEntryMigrationService {

    private final UserRepository userRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final MongoTemplate mongoTemplate;

    public JournalEntryMigrationService(UserRepository userRepository,
                                         JournalEntryRepository journalEntryRepository,
                                         MongoTemplate mongoTemplate) {
        this.userRepository = userRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void backfillUserIdOnJournalEntries() {

        // Quick check: count entries still missing userId
        long unmigrated = mongoTemplate.count(
                Query.query(Criteria.where("userId").exists(false)),
                JournalEntry.class
        );

        if (unmigrated == 0) {
            log.info("Migration: All journal entries already have userId — skipping.");
            return;
        }

        log.info("Migration: Found {} journal entries without userId. Starting backfill...", unmigrated);

        List<User> allUsers = userRepository.findAll();
        int migrated = 0;
        int skipped = 0;
        int notFound = 0;

        for (User user : allUsers) {
            if (user.getJournalEntryIds() == null || user.getJournalEntryIds().isEmpty()) {
                continue;
            }

            for (ObjectId entryId : user.getJournalEntryIds()) {
                Optional<JournalEntry> opt = journalEntryRepository.findById(entryId);

                if (opt.isEmpty()) {
                    log.warn("Migration: Entry {} referenced by user {} not found in DB",
                            entryId, user.getUserName());
                    notFound++;
                    continue;
                }

                JournalEntry entry = opt.get();

                // Skip if already migrated
                if (entry.getUserId() != null) {
                    skipped++;
                    continue;
                }

                // Stamp the userId using a direct MongoDB update (efficient)
                mongoTemplate.updateFirst(
                        Query.query(Criteria.where("_id").is(entryId)),
                        Update.update("userId", user.getId()),
                        JournalEntry.class
                );
                migrated++;
            }
        }

        log.info("Migration complete — migrated: {}, already done: {}, not found: {}",
                migrated, skipped, notFound);
    }
}
