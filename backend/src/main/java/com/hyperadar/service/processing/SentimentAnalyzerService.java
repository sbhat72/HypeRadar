package com.hyperadar.service.processing;

import com.hyperadar.model.SentimentEvent;
import com.hyperadar.model.Ticker;
import com.hyperadar.repository.SentimentEventRepository;
import com.hyperadar.repository.TickerRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class SentimentAnalyzerService {

    private final SentimentEventRepository sentimentEventRepository;
    private final TickerRepository tickerRepository;

    private static final Set<SentimentEvent.Source> NEWS_SOURCES = EnumSet.of(
            SentimentEvent.Source.YAHOO_FINANCE,
            SentimentEvent.Source.CNBC,
            SentimentEvent.Source.MARKETWATCH,
            SentimentEvent.Source.NASDAQ
    );

    public Map<Ticker, Double> computeStockTwitsScores() {
        return computeScores(EnumSet.of(SentimentEvent.Source.STOCKTWITS));
    }

    public Map<Ticker, Double> computeNewsScores() {
        return computeScores(NEWS_SOURCES);
    }

    private Map<Ticker, Double> computeScores(Set<SentimentEvent.Source> sources) {
        List<Ticker> tickers = tickerRepository.findAll();
        LocalDateTime since = LocalDateTime.now().minusHours(24);

        Map<Ticker, List<SentimentEvent>> byTicker = sentimentEventRepository
                .findByCreatedAtAfter(since)
                .stream()
                .filter(e -> sources.contains(e.getSource()))
                .collect(Collectors.groupingBy(SentimentEvent::getTicker));

        Map<Ticker, Double> scores = new HashMap<>();
        for (Ticker ticker : tickers) {
            List<SentimentEvent> events = byTicker.getOrDefault(ticker, List.of());
            scores.put(ticker, computeScore(events));
        }
        return scores;
    }

    private double computeScore(List<SentimentEvent> events) {
        if (events.isEmpty()) {
            return 50.0;
        }
        long positive = events.stream().filter(e -> e.getPolarity() == SentimentEvent.Polarity.POSITIVE).count();
        long negative = events.stream().filter(e -> e.getPolarity() == SentimentEvent.Polarity.NEGATIVE).count();
        double rawScore = (double) (positive - negative) / events.size();
        return ((rawScore + 1) / 2) * 100;
    }
}
