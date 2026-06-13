package com.example.repository;

import com.example.entity.JournalEntry;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface JournalEntryRepository extends MongoRepository<JournalEntry, ObjectId> {

    /** Find all entries belonging to a specific user (paginated). */
    Page<JournalEntry> findByUserIdOrderByDateDesc(ObjectId userId, Pageable pageable);

    /** Find all entries belonging to a specific user (unpaginated — for weekly summary). */
    List<JournalEntry> findByUserId(ObjectId userId);
}