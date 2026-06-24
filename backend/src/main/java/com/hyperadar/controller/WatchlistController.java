package com.hyperadar.controller;

import com.hyperadar.dto.WatchlistItemDto;
import com.hyperadar.model.Ticker;
import com.hyperadar.model.WatchlistItem;
import com.hyperadar.repository.TickerRepository;
import com.hyperadar.repository.WatchlistItemRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/watchlist")
@AllArgsConstructor
public class WatchlistController {

    private final WatchlistItemRepository watchlistItemRepository;
    private final TickerRepository tickerRepository;

    @GetMapping
    public ResponseEntity<List<WatchlistItemDto>> getWatchlist() {
        List<WatchlistItemDto> items = watchlistItemRepository
                .findByClerkUserId(getClerkUserId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @PostMapping("/{ticker}")
    public ResponseEntity<?> addToWatchlist(@PathVariable String ticker) {
        Optional<Ticker> tickerOpt = tickerRepository.findBySymbol(ticker);
        if (tickerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Ticker not found: " + ticker);
        }

        Ticker tickerEntity = tickerOpt.get();
        String userId = getClerkUserId();

        if (watchlistItemRepository.findByClerkUserIdAndTicker(userId, tickerEntity).isPresent()) {
            return ResponseEntity.badRequest().body("Ticker already in watchlist: " + ticker);
        }

        WatchlistItem item = WatchlistItem.builder()
                .clerkUserId(userId)
                .ticker(tickerEntity)
                .build();

        WatchlistItem saved = watchlistItemRepository.save(item);
        return ResponseEntity.ok(toDto(saved));
    }

    @DeleteMapping("/{ticker}")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable String ticker) {
        Optional<Ticker> tickerOpt = tickerRepository.findBySymbol(ticker);
        if (tickerOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Ticker tickerEntity = tickerOpt.get();
        String userId = getClerkUserId();

        Optional<WatchlistItem> itemOpt = watchlistItemRepository
                .findByClerkUserIdAndTicker(userId, tickerEntity);

        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        watchlistItemRepository.delete(itemOpt.get());
        return ResponseEntity.noContent().build();
    }

    private String getClerkUserId() {
        return SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }

    private WatchlistItemDto toDto(WatchlistItem item) {
        return WatchlistItemDto.builder()
                .id(item.getId())
                .tickerSymbol(item.getTicker().getSymbol())
                .addedAt(item.getCreatedAt())
                .build();
    }
}
