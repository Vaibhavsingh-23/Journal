package com.example.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Journal App API")
                        .version("2.0")
                        .description("REST API for journaling with Gemini AI analysis. " +
                                "Authenticate via POST /public/login to receive a JWT. " +
                                "Click 'Authorize' and enter: Bearer <your_token>")
                        .contact(new Contact()
                                .name("Vaibhav Singh")
                                .email("vaibhav@example.com")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT token (without 'Bearer ' prefix)")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}