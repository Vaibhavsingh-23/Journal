

package com.example.service;

import com.example.entity.User;
import com.example.entity.UserPreferences;
import com.example.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@Slf4j
public class UserService {
    @Autowired
    private UserRepository userRepository;

    //private static final Logger logger =  LoggerFactory.getLogger(UserService.class);


    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public void saveNewUser(User user) {
        try {
            // encode password
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRoles(Arrays.asList("USER"));

            // ✅ FIX: initialize preferences for new users
            if (user.getPreferences() == null) {
                UserPreferences prefs = new UserPreferences();
                prefs.setWeeklySummaryEnabled(false);
                prefs.setWeeklySummaryDay(java.time.DayOfWeek.MONDAY.getValue());
                prefs.setEmailNotificationsEnabled(false);
                user.setPreferences(prefs);
            } else if (user.getPreferences().getWeeklySummaryDay() == null) {
                user.getPreferences().setWeeklySummaryDay(
                        java.time.DayOfWeek.MONDAY.getValue()
                );
            }


            userRepository.save(user);
        } catch (Exception e) {
            log.error("Error while creating new user", e);
        }
    }


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

    public void saveAdmin(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(Arrays.asList("USER","ADMIN"));
        userRepository.save(user);
    }

    public List<User> findUsersForWeeklySummary(int day) {
        return userRepository
                .findByPreferencesWeeklySummaryEnabledTrueAndPreferencesWeeklySummaryDay(day);
    }
    public void updateUserPreferences(
            User user,
            String email,
            Boolean weeklySummaryEnabled,
            Integer weeklySummaryDay,
            Boolean emailNotificationsEnabled
    ) {
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
    }


}
