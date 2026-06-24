package com.hyperadar.scheduler;

import com.hyperadar.model.Alert;
import com.hyperadar.repository.AlertRepository;
import com.hyperadar.service.RedisCacheService;
import com.hyperadar.service.alert.AlertThresholdService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@AllArgsConstructor
public class AlertScheduler {

    private final AlertRepository alertRepository;
    private final RedisCacheService redisCacheService;
    private final AlertThresholdService alertThresholdService;

    @Scheduled(fixedDelay = 120000)
    public void checkThresholds() {
        List<Alert> activeAlerts = alertRepository.findByIsActiveTrue();
        for (Alert alert : activeAlerts) {
            try {
                String scoreStr = redisCacheService.getHypeScore(alert.getTicker().getSymbol());
                if (scoreStr == null) continue;

                double currentScore = Double.parseDouble(scoreStr);

                if (alert.getLastTriggeredAt() != null &&
                    alert.getLastTriggeredAt().isAfter(LocalDateTime.now().minusHours(4))) {
                    continue;
                }

                if (currentScore >= alert.getThreshold()) {
                    log.info("Alert fired for ticker {} at hype score {}",
                            alert.getTicker().getSymbol(), currentScore);
                    alertThresholdService.fireAlert(alert, currentScore);
                }
            } catch (Exception e) {
                log.error("Alert check failed for alert id {}: {}", alert.getId(), e.getMessage(), e);
            }
        }
    }
}
