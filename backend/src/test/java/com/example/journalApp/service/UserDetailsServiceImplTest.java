package com.example.journalApp.service;

import com.example.entity.User;
import com.example.repository.UserRepository;
import com.example.service.UserDetailsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setUserName("vaibhav");
        mockUser.setPassword("password123");
        mockUser.setRoles(List.of("USER")); // Important: no "ROLE_" prefix
    }

    @Test
    void testLoadUserByUsername_UserFound() {
        when(userRepository.findByUserName("vaibhav")).thenReturn(mockUser);

        UserDetails userDetails = userDetailsService.loadUserByUsername("vaibhav");

        assertNotNull(userDetails);
        assertEquals("vaibhav", userDetails.getUsername());
        assertEquals("password123", userDetails.getPassword());
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_USER")));

        verify(userRepository, times(1)).findByUserName("vaibhav");
    }

    @Test
    void testLoadUserByUsername_UserNotFound() {
        when(userRepository.findByUserName("unknown")).thenReturn(null);

        assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("unknown"));

        verify(userRepository, times(1)).findByUserName("unknown");
    }
}
