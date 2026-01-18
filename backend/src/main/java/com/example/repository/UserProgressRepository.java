package com.example.repository;

import com.example.entity.UserProgress;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserProgressRepository
        extends MongoRepository<UserProgress, ObjectId> {

    Optional<UserProgress> findByUserId(ObjectId userId);
}
