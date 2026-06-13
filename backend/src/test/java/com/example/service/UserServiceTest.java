package com.example.service;

import com.example.entity.User;
import com.example.entity.UserPreferences;
import com.example.exception.UserAlreadyExistsException;
import com.example.repository.JournalEntryRepository;
import com.example.repository.UserProgressRepository;
import com.example.repository.UserRepository;
import com.example.repository.WeeklySummaryRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Tests")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private JournalEntryRepository journalEntryRepository;
    @Mock private UserProgressRepository userProgressRepository;
    @Mock private WeeklySummaryRepository weeklySummaryRepository;

    private PasswordEncoder passwordEncoder;
    private UserService userService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        userService = new UserService(
                userRepository,
                journalEntryRepository,
                userProgressRepository,
                weeklySummaryRepository,
                passwordEncoder
        );
    }

    @Test
    @DisplayName("saveNewUser - success: password is encoded and role is USER")
    void saveNewUser_success() {
        // Arrange
        User user = new User();
        user.setUserName("testuser");
        user.setPassword("plainpassword");
        user.setEmail("test@example.com");

        when(userRepository.findByUserName("testuser")).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(user);

        // Act
        userService.saveNewUser(user);

        // Assert
        verify(userRepository).save(user);
        assertThat(user.getRoles()).containsExactly("USER");
        // Password should be encoded (not equal to plain text)
        assertThat(user.getPassword()).isNotEqualTo("plainpassword");
        assertThat(passwordEncoder.matches("plainpassword", user.getPassword())).isTrue();
        // Preferences should be initialized
        assertThat(user.getPreferences()).isNotNull();
        assertThat(user.getPreferences().getWeeklySummaryDay()).isEqualTo(1); // Monday
    }

    @Test
    @DisplayName("saveNewUser - throws UserAlreadyExistsException for duplicate username")
    void saveNewUser_duplicateUsername_throwsException() {
        // Arrange
        User existingUser = new User();
        existingUser.setUserName("taken");
        when(userRepository.findByUserName("taken")).thenReturn(existingUser);

        User newUser = new User();
        newUser.setUserName("taken");
        newUser.setPassword("password");

        // Act & Assert
        assertThatThrownBy(() -> userService.saveNewUser(newUser))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining("taken");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("saveNewUser - sets default preferences when preferences is null")
    void saveNewUser_initializesDefaultPreferences() {
        User user = new User();
        user.setUserName("newuser");
        user.setPassword("password");
        user.setPreferences(null); // no preferences provided

        when(userRepository.findByUserName("newuser")).thenReturn(null);

        userService.saveNewUser(user);

        assertThat(user.getPreferences()).isNotNull();
        assertThat(user.getPreferences().isWeeklySummaryEnabled()).isFalse();
        assertThat(user.getPreferences().isEmailNotificationsEnabled()).isFalse();
    }

    @Test
    @DisplayName("saveAdmin - assigns both USER and ADMIN roles")
    void saveAdmin_assignsAdminRole() {
        User user = new User();
        user.setUserName("admin");
        user.setPassword("adminpass");

        userService.saveAdmin(user);

        verify(userRepository).save(user);
        assertThat(user.getRoles()).containsExactlyInAnyOrder("USER", "ADMIN");
    }

    @Test
    @DisplayName("updateUserPreferences - partial update: only non-null fields are changed")
    void updateUserPreferences_partialUpdate() {
        User user = new User();
        user.setUserName("user1");
        user.setPreferences(new UserPreferences());
        user.getPreferences().setWeeklySummaryEnabled(false);
        user.getPreferences().setWeeklySummaryDay(1);

        // Only enable weekly summary — leave day unchanged
        userService.updateUserPreferences(user, null, true, null, null);

        assertThat(user.getPreferences().isWeeklySummaryEnabled()).isTrue();
        assertThat(user.getPreferences().getWeeklySummaryDay()).isEqualTo(1); // unchanged
        verify(userRepository).save(user);
    }
}
