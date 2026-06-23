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

@Service
@AllArgsConstructor
public class SentimentAnalyzerService {

    private final SentimentEventRepository sentimentEventRepository;
    private final TickerRepository tickerRepository;

    private static final Set<SentimentEvent.Source> NEWS_SOURCES = EnumSet.of(
            SentimentEvent.Source.REUTERS,
            SentimentEvent.Source.CNBC,
            SentimentEvent.Source.MARKETWATCH,
            SentimentEvent.Source.NASDAQ
    );

    public Map<Ticker, Double> computeRedditScores() {
        List<Ticker> tickers = tickerRepository.findAll();
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        Map<Ticker, Double> scores = new HashMap<>();

        for (Ticker ticker : tickers) {
            List<SentimentEvent> events = sentimentEventRepository
                    .findByTickerAndCreatedAtAfter(ticker, since)
                    .stream()
                    .filter(e -> e.getSource() == SentimentEvent.Source.REDDIT)
                    .toList();
            scores.put(ticker, computeScore(events));
        }
        return scores;
    }

    public Map<Ticker, Double> computeNewsScores() {
        List<Ticker> tickers = tickerRepository.findAll();
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        Map<Ticker, Double> scores = new HashMap<>();

        for (Ticker ticker : tickers) {
            List<SentimentEvent> events = sentimentEventRepository
                    .findByTickerAndCreatedAtAfter(ticker, since)
                    .stream()
                    .filter(e -> NEWS_SOURCES.contains(e.getSource()))
                    .toList();
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
