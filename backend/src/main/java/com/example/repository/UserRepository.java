package com.example.repository;

import com.example.entity.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface UserRepository extends MongoRepository<User, ObjectId> {

    User findByUserName(String userName);

    boolean deleteByUserName(String userName);
    List<User> findByPreferencesWeeklySummaryEnabledTrueAndPreferencesWeeklySummaryDay(Integer day);

}
