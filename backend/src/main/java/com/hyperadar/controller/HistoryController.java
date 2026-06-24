package com.hyperadar.controller;

import com.hyperadar.dto.HistoricalEventDto;
import com.hyperadar.model.HistoricalEvent;
import com.hyperadar.repository.HistoricalEventRepository;
import com.hyperadar.repository.TickerRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/history")
@AllArgsConstructor
public class HistoryController {

    private final HistoricalEventRepository historicalEventRepository;
    private final TickerRepository tickerRepository;

    @GetMapping
    public ResponseEntity<List<HistoricalEventDto>> getAllEvents() {
        List<HistoricalEventDto> events = historicalEventRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    public ResponseEntity<HistoricalEventDto> getEvent(@PathVariable Long id) {
        return historicalEventRepository.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private HistoricalEventDto toDto(HistoricalEvent event) {
        return HistoricalEventDto.builder()
                .id(event.getId())
                .tickerSymbol(event.getTicker().getSymbol())
                .eventName(event.getEventName())
                .description(event.getDescription())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .build();
    }
}
