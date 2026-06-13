package com.example.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtTokenProvider Tests")
class JwtTokenProviderTest {

    // A valid 32-char (256-bit) secret — fine for tests
    private static final String TEST_SECRET = "test-secret-key-that-is-long-enough-for-HS256-signing-12345";
    private static final long EXPIRY_MS = 3_600_000L; // 1 hour

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET, EXPIRY_MS);
    }

    @Test
    @DisplayName("generateToken - produces a non-null, non-blank token")
    void generateToken_success() {
        String token = jwtTokenProvider.generateToken("testuser");
        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    @DisplayName("validateToken - returns true for a freshly generated token")
    void validateToken_validToken_returnsTrue() {
        String token = jwtTokenProvider.generateToken("testuser");
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("validateToken - returns false for a tampered token")
    void validateToken_tamperedToken_returnsFalse() {
        String token = jwtTokenProvider.generateToken("testuser");
        String tampered = token + "tampered";
        assertThat(jwtTokenProvider.validateToken(tampered)).isFalse();
    }

    @Test
    @DisplayName("validateToken - returns false for an expired token")
    void validateToken_expiredToken_returnsFalse() throws Exception {
        // Create a provider with 1ms expiry
        JwtTokenProvider shortLived = new JwtTokenProvider(TEST_SECRET, 1L);
        String token = shortLived.generateToken("testuser");
        Thread.sleep(10); // Wait for token to expire
        assertThat(shortLived.validateToken(token)).isFalse();
    }

    @Test
    @DisplayName("extractUsername - correctly extracts subject from valid token")
    void extractUsername_fromValidToken() {
        String token = jwtTokenProvider.generateToken("john_doe");
        String extracted = jwtTokenProvider.extractUsername(token);
        assertThat(extracted).isEqualTo("john_doe");
    }
}
