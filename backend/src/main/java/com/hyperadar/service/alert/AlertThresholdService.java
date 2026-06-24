package com.hyperadar.service.alert;

import com.hyperadar.model.Alert;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AlertThresholdService {

    // TODO: implement threshold checking logic — send email via EmailDispatcherService, update lastTriggeredAt

    public void fireAlert(Alert alert, double currentScore) {
        log.info("Firing alert id {} for ticker {} (threshold={}, score={})",
                alert.getId(), alert.getTicker().getSymbol(), alert.getThreshold(), currentScore);
    }
}
