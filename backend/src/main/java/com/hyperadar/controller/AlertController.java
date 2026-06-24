package com.hyperadar.controller;

import com.hyperadar.dto.AlertRequestDto;
import com.hyperadar.dto.AlertResponseDto;
import com.hyperadar.model.Alert;
import com.hyperadar.model.Ticker;
import com.hyperadar.repository.AlertRepository;
import com.hyperadar.repository.TickerRepository;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alerts")
@AllArgsConstructor
public class AlertController {

    private final AlertRepository alertRepository;
    private final TickerRepository tickerRepository;

    @GetMapping
    public ResponseEntity<List<AlertResponseDto>> getAlerts() {
        List<AlertResponseDto> alerts = alertRepository
                .findByClerkUserIdAndIsActiveTrue(getClerkUserId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(alerts);
    }

    @PostMapping
    public ResponseEntity<?> createAlert(@Valid @RequestBody AlertRequestDto request) {
        Optional<Ticker> tickerOpt = tickerRepository.findBySymbol(request.getTickerSymbol());
        if (tickerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Ticker not found: " + request.getTickerSymbol());
        }

        Ticker ticker = tickerOpt.get();
        String userId = getClerkUserId();

        if (alertRepository.findByClerkUserIdAndTickerAndIsActiveTrue(userId, ticker).isPresent()) {
            return ResponseEntity.badRequest()
                    .body("Active alert already exists for " + request.getTickerSymbol());
        }

        Alert alert = Alert.builder()
                .clerkUserId(userId)
                .ticker(ticker)
                .threshold(request.getThreshold())
                .notificationType(Alert.NotificationType.EMAIL)
                .isActive(true)
                .build();

        Alert saved = alertRepository.save(alert);
        return ResponseEntity.ok(toDto(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlert(@PathVariable Long id) {
        Optional<Alert> alertOpt = alertRepository.findById(id);
        if (alertOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Alert alert = alertOpt.get();
        if (!alert.getClerkUserId().equals(getClerkUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        alert.setActive(false);
        alertRepository.save(alert);
        return ResponseEntity.noContent().build();
    }

    private String getClerkUserId() {
        return SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }

    private AlertResponseDto toDto(Alert alert) {
        return AlertResponseDto.builder()
                .id(alert.getId())
                .tickerSymbol(alert.getTicker().getSymbol())
                .threshold(alert.getThreshold())
                .notificationType(alert.getNotificationType().name())
                .createdAt(alert.getCreatedAt())
                .lastTriggeredAt(alert.getLastTriggeredAt())
                .build();
    }
}
