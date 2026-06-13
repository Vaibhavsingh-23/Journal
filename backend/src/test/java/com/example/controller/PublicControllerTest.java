package com.example.controller;

import com.example.dto.AuthResponse;
import com.example.dto.LoginRequest;
import com.example.exception.GlobalExceptionHandler;
import com.example.exception.UserAlreadyExistsException;
import com.example.security.JwtTokenProvider;
import com.example.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for PublicController using standalone MockMvc.
 * No Spring context or MongoDB connection needed.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PublicController Tests")
class PublicControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock private UserService userService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        PublicController controller = new PublicController(
                userService, authenticationManager, jwtTokenProvider);
        // Standalone MockMvc — no Spring context, no MongoDB, no security filter chain
        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /public/login - valid credentials returns 200 with token")
    void login_validCredentials_returns200WithToken() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("john");
        request.setPassword("password123");

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("john", null, List.of());

        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(jwtTokenProvider.generateToken("john")).thenReturn("mocked.jwt.token");
        when(jwtTokenProvider.getExpiryMs()).thenReturn(86400000L);

        mockMvc.perform(post("/public/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.username").value("john"));
    }

    @Test
    @DisplayName("POST /public/login - invalid credentials returns 401")
    void login_invalidCredentials_returns401() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("john");
        request.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/public/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /public/create-user - blank username returns 400")
    void createUser_blankUsername_returns400() throws Exception {
        // Blank username — Bean Validation should catch it
        String body = "{\"userName\":\"\",\"password\":\"password123\",\"email\":\"test@test.com\"}";

        mockMvc.perform(post("/public/create-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /public/create-user - duplicate username returns 409")
    void createUser_duplicateUsername_returns409() throws Exception {
        String body = "{\"userName\":\"existing\",\"password\":\"password123\",\"email\":\"a@b.com\"}";

        doThrow(new UserAlreadyExistsException("existing"))
                .when(userService).saveNewUser(any());

        mockMvc.perform(post("/public/create-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /public/create-user - valid data returns 201")
    void createUser_validData_returns201() throws Exception {
        String body = "{\"userName\":\"newuser\",\"password\":\"password123\",\"email\":\"new@test.com\"}";

        doNothing().when(userService).saveNewUser(any());

        mockMvc.perform(post("/public/create-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").exists());
    }
}
