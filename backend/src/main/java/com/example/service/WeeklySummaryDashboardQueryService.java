package com.example.service;

import com.example.dto.WeeklySummaryDashboardDTO;
import com.example.entity.WeeklySummary;
import com.example.repository.WeeklySummaryRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class WeeklySummaryDashboardQueryService {

    private final WeeklySummaryRepository weeklySummaryRepository;

    public WeeklySummaryDashboardQueryService(WeeklySummaryRepository weeklySummaryRepository) {
        this.weeklySummaryRepository = weeklySummaryRepository;
    }

    public Optional<WeeklySummaryDashboardDTO> getLatestWeeklySummary(ObjectId userId) {
        return weeklySummaryRepository
                .findTopByUserIdOrderByGeneratedAtDesc(userId)
                .map(summary -> {
                    WeeklySummaryDashboardDTO dto = new WeeklySummaryDashboardDTO();
                    dto.setSummaryText(summary.getSummaryText());
                    dto.setType(summary.getType().name());
                    dto.setDaysWritten(summary.getDaysWritten());
                    dto.setMood(summary.getMood());
                    dto.setWeekStartDate(summary.getWeekStartDate());
                    dto.setWeekEndDate(summary.getWeekEndDate());
                    dto.setGeneratedAt(summary.getGeneratedAt());
                    return dto;
                });
    }
}
