package com.example.repository;

import com.example.entity.WeeklySummary;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WeeklySummaryRepository
        extends MongoRepository<WeeklySummary, ObjectId> {

    /** Get the most recent summary for the dashboard widget. */
    Optional<WeeklySummary> findTopByUserIdOrderByGeneratedAtDesc(ObjectId userId);

    /** Get all summaries for a user (used for cascade delete). */
    List<WeeklySummary> findAllByUserId(ObjectId userId);
}
