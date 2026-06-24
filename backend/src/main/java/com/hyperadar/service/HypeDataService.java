package com.hyperadar.service;

import com.hyperadar.dto.AlphaVantageQuoteDto;
import com.hyperadar.model.HypeScore;
import com.hyperadar.model.SentimentEvent;
import com.hyperadar.repository.HypeScoreRepository;
import com.hyperadar.repository.SentimentEventRepository;
import com.hyperadar.repository.TickerRepository;
import com.hyperadar.service.ingestion.MarketDataService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class HypeDataService {

    private final HypeScoreRepository hypeScoreRepository;
    private final TickerRepository tickerRepository;
    private final SentimentEventRepository sentimentEventRepository;
    private final MarketDataService marketDataService;

    public Optional<HypeScore> getLatestScore(String symbol) {
        return tickerRepository.findBySymbol(symbol)
                .flatMap(hypeScoreRepository::findTopByTickerOrderByCreatedAtDesc);
    }

    public List<HypeScore> getScoreHistory(String symbol, int days) {
        return tickerRepository.findBySymbol(symbol)
                .map(ticker -> hypeScoreRepository.findByTickerAndCreatedAtAfterOrderByCreatedAtAsc(
                        ticker, LocalDateTime.now().minusDays(days)))
                .orElse(List.of());
    }

    public List<SentimentEvent> getRecentEvents(String symbol, int limit) {
        return tickerRepository.findBySymbol(symbol)
                .map(ticker -> sentimentEventRepository.findByTickerOrderByCreatedAtDesc(
                        ticker, PageRequest.of(0, limit)))
                .orElse(List.of());
    }

    public int getMentionCount(String symbol) {
        return tickerRepository.findBySymbol(symbol)
                .map(ticker -> sentimentEventRepository
                        .findByTickerAndCreatedAtAfter(ticker, LocalDateTime.now().minusHours(24))
                        .size())
                .orElse(0);
    }

    public AlphaVantageQuoteDto fetchQuote(String symbol) {
        return marketDataService.fetchQuote(symbol);
    }
}
