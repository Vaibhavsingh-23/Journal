package com.example.service;

import com.example.dto.WeeklySummaryDashboardDTO;
import com.example.entity.WeeklySummary;
import com.example.repository.WeeklySummaryRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class WeeklySummaryDashboardQueryService {

    @Autowired
    private WeeklySummaryRepository weeklySummaryRepository;

    public Optional<WeeklySummaryDashboardDTO> getLatestWeeklySummary(ObjectId userId) {

        Optional<WeeklySummary> summaryOpt =
                weeklySummaryRepository.findTopByUserIdOrderByGeneratedAtDesc(userId);

        return summaryOpt.map(summary -> {
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
