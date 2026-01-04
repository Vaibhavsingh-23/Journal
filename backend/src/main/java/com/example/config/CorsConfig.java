package com.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

/**
 * CORS Configuration
 * Allows frontend to communicate with backend from different origins
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        // Create CORS configuration
        CorsConfiguration config = new CorsConfiguration();

        // Allow credentials (needed for Basic Auth)
        config.setAllowCredentials(true);

        // Allow requests from these origins
        // Add your frontend URLs here
        config.setAllowedOrigins(Arrays.asList(
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:8000",
                "http://127.0.0.1:8000"
        ));

        // Allow all headers
        config.addAllowedHeader("*");

        // Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
        config.addAllowedMethod("*");

        // Apply CORS configuration to all endpoints
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}