package com.hyperadar.controller;

import com.hyperadar.dto.TrendingTickerDto;
import com.hyperadar.model.HypeScore;
import com.hyperadar.service.HypeDataService;
import com.hyperadar.service.RedisCacheService;
import lombok.AllArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
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

    private final HypeDataService hypeDataService;
    private final RedisCacheService redisCacheService;

    private static final String YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=1d";
    private static final RestTemplate yahooRestTemplate = new RestTemplate();

    private record YahooPrice(Double price, Double priceChange, Double changePercent) {}

    @GetMapping("/trending")
    public ResponseEntity<List<TrendingTickerDto>> getTrending(
            @RequestParam(defaultValue = "10") int limit) {
        Set<String> symbols = redisCacheService.getTopTickers(limit);

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
            double chartPreviousClose = ((Number) meta.get("chartPreviousClose")).doubleValue();
            double priceChange = regularMarketPrice - chartPreviousClose;
            double changePercent = (priceChange / chartPreviousClose) * 100.0;

            return new YahooPrice(regularMarketPrice, priceChange, changePercent);
        } catch (Exception e) {
            return new YahooPrice(null, null, null);
        }
    }
}
