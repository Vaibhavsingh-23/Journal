package com.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        // Connection timeout: 10 seconds
        factory.setConnectTimeout(10000);

        // Read timeout: 30 seconds (Gemini might take time to analyze)
        factory.setReadTimeout(30000);

        return new RestTemplate(factory);
    }
}