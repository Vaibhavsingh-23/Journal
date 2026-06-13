package com.example.journalApp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Basic smoke test — verifies the Spring context loads.
 * Excludes MongoDB and Mail so no real connections are required.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.autoconfigure.exclude=" +
    "org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration," +
    "org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration," +
    "org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration"
})
class JournalAppApplicationTests {

    @Test
    void contextLoads() {
        // If this runs, the application context starts successfully.
    }
}
