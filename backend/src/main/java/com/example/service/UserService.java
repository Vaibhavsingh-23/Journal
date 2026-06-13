package com.example.service;

import com.example.entity.User;
import com.example.entity.UserPreferences;
import com.example.exception.UserAlreadyExistsException;
import com.example.repository.JournalEntryRepository;
import com.example.repository.UserProgressRepository;
import com.example.repository.UserRepository;
import com.example.repository.WeeklySummaryRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final UserProgressRepository userProgressRepository;
    private final WeeklySummaryRepository weeklySummaryRepository;
    private final PasswordEncoder passwordEncoder;   // FIXED: injected Spring bean, not new instance

    public UserService(UserRepository userRepository,
                       JournalEntryRepository journalEntryRepository,
                       UserProgressRepository userProgressRepository,
                       WeeklySummaryRepository weeklySummaryRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.userProgressRepository = userProgressRepository;
        this.weeklySummaryRepository = weeklySummaryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Register a new user with encoded password and default USER role.
     * @throws UserAlreadyExistsException if the username is already taken
     */
    public void saveNewUser(User user) {
        // Check for duplicate username first — gives a clean error instead of MongoDB exception
        if (userRepository.findByUserName(user.getUserName()) != null) {
            throw new UserAlreadyExistsException(user.getUserName());
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(Arrays.asList("USER"));

        // Initialize default preferences for new users
        if (user.getPreferences() == null) {
            UserPreferences prefs = new UserPreferences();
            prefs.setWeeklySummaryEnabled(false);
            prefs.setWeeklySummaryDay(java.time.DayOfWeek.MONDAY.getValue());
            prefs.setEmailNotificationsEnabled(false);
            user.setPreferences(prefs);
        } else if (user.getPreferences().getWeeklySummaryDay() == null) {
            user.getPreferences().setWeeklySummaryDay(java.time.DayOfWeek.MONDAY.getValue());
        }

        userRepository.save(user);
        log.info("New user created: {}", user.getUserName());
    }

    /**
     * Save an existing user (used for updates — does NOT re-encode password).
     */
    public void saveUser(User user) {
        userRepository.save(user);
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User findByUserName(String userName) {
        return userRepository.findByUserName(userName);
    }

    public void deleteById(ObjectId id) {
        userRepository.deleteById(id);
    }

    /**
     * Create an admin user (with both USER and ADMIN roles).
     */
    public void saveAdmin(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(Arrays.asList("USER", "ADMIN"));
        userRepository.save(user);
        log.info("Admin user created: {}", user.getUserName());
    }

    /**
     * Update username and password for an existing user.
     * Re-encodes the new password, preserves existing roles.
     */
    public void updateExistingUser(User user, String newPassword) {
        log.debug("Updating user: {}, roles preserved: {}", user.getUserName(), user.getRoles());
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.debug("User updated successfully: {}", user.getUserName());
    }

    public List<User> findUsersForWeeklySummary(int day) {
        return userRepository
                .findByPreferencesWeeklySummaryEnabledTrueAndPreferencesWeeklySummaryDay(day);
    }

    /**
     * Partially update user preferences — only updates fields that are non-null in the request.
     */
    public void updateUserPreferences(
            User user,
            String email,
            Boolean weeklySummaryEnabled,
            Integer weeklySummaryDay,
            Boolean emailNotificationsEnabled) {

        if (email != null) {
            user.setEmail(email);
        }

        UserPreferences prefs = user.getPreferences();
        if (prefs == null) {
            prefs = new UserPreferences();
            user.setPreferences(prefs);
        }

        if (weeklySummaryEnabled != null) {
            prefs.setWeeklySummaryEnabled(weeklySummaryEnabled);
        }
        if (weeklySummaryDay != null) {
            prefs.setWeeklySummaryDay(weeklySummaryDay);
        }
        if (emailNotificationsEnabled != null) {
            prefs.setEmailNotificationsEnabled(emailNotificationsEnabled);
        }

        userRepository.save(user);
        log.debug("User preferences updated for: {}", user.getUserName());
    }

    /**
     * Delete a user and ALL associated data (entries, progress, summaries).
     * Runs in a transaction to ensure atomic deletion.
     */
    @Transactional
    public void deleteUserAndAllData(ObjectId userId) {
        // Delete all journal entries
        journalEntryRepository.findByUserId(userId)
                .forEach(entry -> journalEntryRepository.deleteById(entry.getId()));

        // Delete user progress record
        userProgressRepository.findByUserId(userId)
                .ifPresent(progress -> userProgressRepository.deleteById(progress.getId()));

        // Delete all weekly summaries
        weeklySummaryRepository.findAllByUserId(userId)
                .forEach(summary -> weeklySummaryRepository.deleteById(summary.getId()));

        // Finally delete the user
        userRepository.deleteById(userId);

        log.info("User and all associated data deleted for userId: {}", userId);
    }
}
