package com.hyperadar.service.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.hyperadar.model.SentimentEvent;
import com.hyperadar.model.Ticker;
import com.hyperadar.repository.SentimentEventRepository;
import com.hyperadar.repository.TickerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockTwitsService {

    private final TickerRepository tickerRepository;
    private final SentimentEventRepository sentimentEventRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String BASE_URL =
        "https://api.stocktwits.com/api/2/streams/symbol/{symbol}.json";

    public void poll() {
        List<Ticker> tickers = tickerRepository.findAll();

        for (Ticker ticker : tickers) {
            try {
                pollTicker(ticker);
                Thread.sleep(200);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("StockTwits poll failed for {}: {}", ticker.getSymbol(), e.getMessage());
            }
        }
    }

    private void pollTicker(Ticker ticker) {
        JsonNode response = restTemplate.getForObject(
            BASE_URL, JsonNode.class, ticker.getSymbol()
        );

        if (response == null || !response.has("messages")) return;

        for (JsonNode message : response.get("messages")) {
            String body = message.path("body").asText("");
            if (body.isBlank()) continue;

            SentimentEvent.Polarity polarity = extractPolarity(message);

            SentimentEvent event = SentimentEvent.builder()
                .ticker(ticker)
                .source(SentimentEvent.Source.STOCKTWITS)
                .content(body)
                .polarity(polarity)
                .createdAt(LocalDateTime.now())
                .build();

            sentimentEventRepository.save(event);
        }

        log.info("StockTwits polled {} — messages saved", ticker.getSymbol());
    }

    private SentimentEvent.Polarity extractPolarity(JsonNode message) {
        JsonNode sentiment = message.path("entities").path("sentiment");
        if (sentiment.isMissingNode() || sentiment.isNull()) {
            return SentimentEvent.Polarity.NEUTRAL;
        }
        String basic = sentiment.path("basic").asText("");
        if ("Bullish".equalsIgnoreCase(basic)) return SentimentEvent.Polarity.POSITIVE;
        if ("Bearish".equalsIgnoreCase(basic)) return SentimentEvent.Polarity.NEGATIVE;
        return SentimentEvent.Polarity.NEUTRAL;
    }
}
