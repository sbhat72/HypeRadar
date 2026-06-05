package com.hyperadar.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AlertScheduler {

    @Scheduled(fixedRate = 120000)
    public void checkThresholds() {
        // TODO: check alert thresholds every 2 minutes
    }
}
