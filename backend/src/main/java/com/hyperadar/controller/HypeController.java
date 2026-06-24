package com.hyperadar.controller;

import com.hyperadar.dto.*;
import com.hyperadar.model.HypeScore;
import com.hyperadar.model.SentimentEvent;
import com.hyperadar.repository.HypeScoreRepository;
import com.hyperadar.repository.SentimentEventRepository;
import com.hyperadar.repository.TickerRepository;
import com.hyperadar.service.HypeDataService;
import com.hyperadar.service.ingestion.MarketDataService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hype")
@AllArgsConstructor
public class HypeController {

    private final HypeDataService hypeDataService;
    private final HypeScoreRepository hypeScoreRepository;
    private final SentimentEventRepository sentimentEventRepository;
    private final TickerRepository tickerRepository;
    private final MarketDataService marketDataService;

    @GetMapping("/{ticker}")
    public ResponseEntity<HypeBreakdownDto> getHypeBreakdown(@PathVariable String ticker) {
        if (tickerRepository.findBySymbol(ticker).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        HypeScore latestScore = hypeDataService.getLatestScore(ticker).orElse(null);
        List<HypeScore> history = hypeDataService.getScoreHistory(ticker, 30);
        List<SentimentEvent> events = hypeDataService.getRecentEvents(ticker, 10);
        AlphaVantageQuoteDto quote = marketDataService.fetchQuote(ticker);

        HypeBreakdownDto dto = HypeBreakdownDto.builder()
                .symbol(ticker)
                .currentScore(latestScore != null ? latestScore.getScore() : null)
                .redditScore(latestScore != null ? latestScore.getRedditScore() : null)
                .newsScore(latestScore != null ? latestScore.getNewsScore() : null)
                .volumeScore(latestScore != null ? latestScore.getVolumeScore() : null)
                .priceScore(latestScore != null ? latestScore.getFiftyTwoWeekScore() : null)
                .verdict(latestScore != null ? latestScore.getVerdict() : null)
                .currentPrice(quote != null ? quote.getPrice() : null)
                .priceChange(quote != null ? quote.getChange() : null)
                .changePercent(quote != null ? parseChangePercent(quote.getChangePercent()) : null)
                .scoreHistory(history.stream()
                        .map(h -> HypeScorePointDto.builder()
                                .timestamp(h.getCreatedAt())
                                .score(h.getScore())
                                .build())
                        .collect(Collectors.toList()))
                .sources(events.stream()
                        .map(e -> SentimentSourceDto.builder()
                                .source(e.getSource().name())
                                .content(e.getContent())
                                .polarity(e.getPolarity().name())
                                .build())
                        .collect(Collectors.toList()))
                .build();

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{ticker}/history")
    public ResponseEntity<List<HypeScorePointDto>> getHypeHistory(
            @PathVariable String ticker,
            @RequestParam(defaultValue = "30") int days) {
        if (tickerRepository.findBySymbol(ticker).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<HypeScorePointDto> history = hypeDataService.getScoreHistory(ticker, days).stream()
                .map(h -> HypeScorePointDto.builder()
                        .timestamp(h.getCreatedAt())
                        .score(h.getScore())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }

    private Double parseChangePercent(String changePercent) {
        if (changePercent == null) return null;
        try {
            return Double.parseDouble(changePercent.replace("%", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
