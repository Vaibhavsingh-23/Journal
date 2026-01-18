package com.example.repository;

import com.example.entity.WeeklySummary;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface WeeklySummaryRepository
        extends MongoRepository<WeeklySummary, ObjectId> {
    Optional<WeeklySummary> findTopByUserIdOrderByGeneratedAtDesc(ObjectId userId);

}
