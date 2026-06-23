package com.hyperadar.service.processing;

import com.hyperadar.dto.AlphaVantageQuoteDto;
import com.hyperadar.model.HypeScore;
import com.hyperadar.model.Ticker;
import com.hyperadar.repository.HypeScoreRepository;
import com.hyperadar.repository.TickerRepository;
import com.hyperadar.service.ingestion.MarketDataService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
public class BullishBearishClassifierService {

    private static final double HYPE_THRESHOLD = 5.0;
    private static final double PRICE_THRESHOLD = 2.0;

    private final HypeScoreRepository hypeScoreRepository;
    private final TickerRepository tickerRepository;
    private final MarketDataService marketDataService;

    @Transactional
    public void classifyAll() {
        List<Ticker> tickers = tickerRepository.findAll();
        for (Ticker ticker : tickers) {
            try {
                classifyTicker(ticker);
            } catch (Exception e) {
                // skip ticker on error without propagating
            }
        }
    }

    private void classifyTicker(Ticker ticker) {
        List<HypeScore> recent = hypeScoreRepository.findByTickerOrderByCreatedAtDesc(ticker);
        if (recent.size() < 2) {
            return;
        }

        double hypeDelta = recent.get(0).getScore() - recent.get(1).getScore();

        AlphaVantageQuoteDto quote;
        try {
            quote = marketDataService.fetchQuote(ticker.getSymbol());
        } catch (Exception e) {
            return;
        }

        if (quote == null || quote.getChangePercent() == null) {
            return;
        }

        double priceDelta;
        try {
            priceDelta = Double.parseDouble(quote.getChangePercent().replace("%", "").trim());
        } catch (NumberFormatException e) {
            return;
        }

        HypeScore.Verdict verdict;
        if (hypeDelta > HYPE_THRESHOLD && priceDelta > PRICE_THRESHOLD) {
            verdict = HypeScore.Verdict.HYPE_CONFIRMED;
        } else if (hypeDelta > HYPE_THRESHOLD) {
            verdict = HypeScore.Verdict.PURE_HYPE;
        } else if (priceDelta > PRICE_THRESHOLD) {
            verdict = HypeScore.Verdict.HIDDEN_MOMENTUM;
        } else {
            verdict = HypeScore.Verdict.BEARISH_CONFIRMATION;
        }

        HypeScore latest = recent.get(0);
        latest.setVerdict(verdict);
        hypeScoreRepository.save(latest);
    }
}
