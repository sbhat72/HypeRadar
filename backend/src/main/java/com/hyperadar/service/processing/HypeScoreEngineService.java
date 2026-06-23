package com.hyperadar.service.processing;

import com.hyperadar.dto.AlphaVantageQuoteDto;
import com.hyperadar.model.HypeScore;
import com.hyperadar.model.Ticker;
import com.hyperadar.repository.HypeScoreRepository;
import com.hyperadar.repository.TickerRepository;
import com.hyperadar.service.RedisCacheService;
import com.hyperadar.service.ingestion.MarketDataService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class HypeScoreEngineService {

    private final SentimentAnalyzerService sentimentAnalyzerService;
    private final MarketDataService marketDataService;
    private final HypeScoreRepository hypeScoreRepository;
    private final TickerRepository tickerRepository;
    private final RedisCacheService redisCacheService;

    @Transactional
    public void computeAll() {
        List<Ticker> tickers = tickerRepository.findAll();
        if (tickers.isEmpty()) {
            return;
        }

        Map<Ticker, Double> redditScores = sentimentAnalyzerService.computeRedditScores();
        Map<Ticker, Double> newsScores = sentimentAnalyzerService.computeNewsScores();

        Map<Ticker, AlphaVantageQuoteDto> quotes = new HashMap<>();
        for (Ticker ticker : tickers) {
            try {
                quotes.put(ticker, marketDataService.fetchQuote(ticker.getSymbol()));
            } catch (Exception e) {
                quotes.put(ticker, null);
            }
        }

        long maxVolume = tickers.stream()
                .mapToLong(t -> {
                    AlphaVantageQuoteDto q = quotes.get(t);
                    return (q != null && q.getVolume() != null) ? q.getVolume() : 0L;
                })
                .max()
                .orElse(1L);
        if (maxVolume == 0) maxVolume = 1L;

        for (Ticker ticker : tickers) {
            double redditScore = redditScores.getOrDefault(ticker, 50.0);
            double newsScore = newsScores.getOrDefault(ticker, 50.0);
            AlphaVantageQuoteDto quote = quotes.get(ticker);

            double volumeScore = computeVolumeScore(quote, maxVolume);
            double priceScore = computePriceScore(quote);

            double totalScore = (redditScore * 0.40)
                    + (newsScore * 0.30)
                    + (volumeScore * 0.20)
                    + (priceScore * 0.10);

            HypeScore hypeScore = HypeScore.builder()
                    .ticker(ticker)
                    .score(totalScore)
                    .redditScore(redditScore)
                    .newsScore(newsScore)
                    .volumeScore(volumeScore)
                    .fiftyTwoWeekScore(priceScore)
                    .build();

            hypeScoreRepository.save(hypeScore);
            redisCacheService.saveHypeScore(ticker.getSymbol(), totalScore);
            redisCacheService.updateTrendingScore(ticker.getSymbol(), totalScore);
        }
    }

    private double computeVolumeScore(AlphaVantageQuoteDto quote, long maxVolume) {
        if (quote == null || quote.getVolume() == null) {
            return 50.0;
        }
        return Math.min((double) quote.getVolume() / maxVolume * 100, 100);
    }

    private double computePriceScore(AlphaVantageQuoteDto quote) {
        if (quote == null || quote.getChangePercent() == null) {
            return 50.0;
        }
        try {
            double rawChange = Double.parseDouble(quote.getChangePercent().replace("%", "").trim());
            return Math.min(Math.max((rawChange + 10) / 20 * 100, 0), 100);
        } catch (NumberFormatException e) {
            return 50.0;
        }
    }
}
