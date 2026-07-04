package com.hyperadar.controller;

import com.hyperadar.dto.TrendingTickerDto;
import com.hyperadar.model.HypeScore;
import com.hyperadar.service.HypeDataService;
import com.hyperadar.service.RedisCacheService;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickers")
@AllArgsConstructor
public class TickerController {

    private static final Logger log = LoggerFactory.getLogger(TickerController.class);
    private static final int MAX_LIMIT = 50;
    private static final String YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=1d";
    private static final RestTemplate yahooRestTemplate;

    static {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(8_000);
        yahooRestTemplate = new RestTemplate(factory);
    }

    private final HypeDataService hypeDataService;
    private final RedisCacheService redisCacheService;

    private record YahooPrice(Double price, Double priceChange, Double changePercent) {}

    @GetMapping("/trending")
    public ResponseEntity<List<TrendingTickerDto>> getTrending(
            @RequestParam(defaultValue = "10") int limit) {
        int effectiveLimit = Math.min(limit, MAX_LIMIT);
        Set<String> symbols = redisCacheService.getTopTickers(effectiveLimit);

        List<TrendingTickerDto> trending = symbols.stream()
                .map(symbol -> {
                    HypeScore score = hypeDataService.getLatestScore(symbol).orElse(null);
                    YahooPrice quote = fetchYahooPrice(symbol);
                    int mentionCount = hypeDataService.getMentionCount(symbol);

                    return TrendingTickerDto.builder()
                            .symbol(symbol)
                            .score(score != null ? score.getScore() : null)
                            .redditScore(score != null ? score.getRedditScore() : null)
                            .newsScore(score != null ? score.getNewsScore() : null)
                            .volumeScore(score != null ? score.getVolumeScore() : null)
                            .priceScore(score != null ? score.getFiftyTwoWeekScore() : null)
                            .verdict(score != null ? score.getVerdict() : null)
                            .price(quote.price())
                            .priceChange(quote.priceChange())
                            .changePercent(quote.changePercent())
                            .mentionCount(mentionCount)
                            .build();
                })
                .filter(dto -> dto.getScore() != null)
                .sorted(Comparator.comparingDouble(TrendingTickerDto::getScore).reversed())
                .collect(Collectors.toList());

        return ResponseEntity.ok(trending);
    }

    @SuppressWarnings({"unchecked", "null"})
    private YahooPrice fetchYahooPrice(String symbol) {
        if (!symbol.matches("[A-Z]{1,5}")) {
            log.warn("Skipping invalid ticker symbol: {}", symbol);
            return new YahooPrice(null, null, null);
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String url = String.format(YAHOO_URL, symbol);
            ResponseEntity<Map<String, Object>> response = yahooRestTemplate.exchange(
                    url, HttpMethod.GET, entity, new ParameterizedTypeReference<Map<String, Object>>() {});
            Map<String, Object> body = response.getBody();
            if (body == null) return new YahooPrice(null, null, null);

            Map<String, Object> chart = (Map<String, Object>) body.get("chart");
            List<Map<String, Object>> result = (List<Map<String, Object>>) chart.get("result");
            Map<String, Object> meta = (Map<String, Object>) result.get(0).get("meta");

            double regularMarketPrice = ((Number) meta.get("regularMarketPrice")).doubleValue();
            Number prevCloseNum = (Number) meta.get("chartPreviousClose");
            if (prevCloseNum == null || prevCloseNum.doubleValue() == 0.0) {
                return new YahooPrice(regularMarketPrice, null, null);
            }
            double chartPreviousClose = prevCloseNum.doubleValue();
            double priceChange = regularMarketPrice - chartPreviousClose;
            double changePercent = (priceChange / chartPreviousClose) * 100.0;

            return new YahooPrice(regularMarketPrice, priceChange, changePercent);
        } catch (Exception e) {
            log.warn("Failed to fetch Yahoo Finance price for {}: {}", symbol, e.getMessage());
            return new YahooPrice(null, null, null);
        }
    }
}
