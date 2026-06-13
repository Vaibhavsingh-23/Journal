package com.example.service;

import com.example.entity.User;
import com.example.entity.WeeklySummary;
import com.example.entity.WeeklySummaryDeliveryStatus;
import com.example.repository.WeeklySummaryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailDeliveryService {

    private final EmailService emailService;
    private final WeeklySummaryRepository weeklySummaryRepository;

    public EmailDeliveryService(EmailService emailService,
                                 WeeklySummaryRepository weeklySummaryRepository) {
        this.emailService = emailService;
        this.weeklySummaryRepository = weeklySummaryRepository;
    }

    /**
     * Send the weekly summary via email if the user is eligible.
     * Eligibility: preferences not null, emailNotificationsEnabled = true,
     * summary not already sent, user has a non-blank email.
     */
    public void deliverIfEligible(User user, WeeklySummary summary) {
        if (user.getPreferences() == null) return;
        if (!user.getPreferences().isEmailNotificationsEnabled()) return;
        if (summary.getDeliveryStatus() == WeeklySummaryDeliveryStatus.SENT) return;
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        try {
            String subject = "Your Weekly Journal Summary";
            String body = summary.getSummaryText();
            emailService.send(user.getEmail(), subject, body);
            summary.setDeliveryStatus(WeeklySummaryDeliveryStatus.SENT);
            weeklySummaryRepository.save(summary);
        } catch (Exception e) {
            log.error("Failed to send weekly summary email to {}: {}", user.getEmail(), e.getMessage());
            // Don't rethrow — email failure should not break the summary generation
        }
    }
}
