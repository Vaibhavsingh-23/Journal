package com.example.service;

import com.example.entity.User;
import com.example.entity.WeeklySummary;
import com.example.entity.WeeklySummaryDeliveryStatus;
import com.example.repository.WeeklySummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EmailDeliveryService {

    @Autowired
    private EmailService emailService;

    @Autowired
    private WeeklySummaryRepository weeklySummaryRepository;

    public void deliverIfEligible(User user, WeeklySummary summary) {

        if (user.getPreferences() == null) return;

        if (!Boolean.TRUE.equals(user.getPreferences().isEmailNotificationsEnabled()
        ))
            return;

        if (summary.getDeliveryStatus() == WeeklySummaryDeliveryStatus.SENT)
            return;

        if (user.getEmail() == null || user.getEmail().isBlank())
            return;

        String subject = "Your Weekly Journal Summary";
        String body = summary.getSummaryText();

        emailService.send(user.getEmail(), subject, body);

        summary.setDeliveryStatus(WeeklySummaryDeliveryStatus.SENT);
        weeklySummaryRepository.save(summary);
    }
}
