package com.hyperadar.controller;

import com.hyperadar.dto.AlphaVantageQuoteDto;
import com.hyperadar.dto.TrendingTickerDto;
import com.hyperadar.model.HypeScore;
import com.hyperadar.service.HypeDataService;
import com.hyperadar.service.RedisCacheService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickers")
@AllArgsConstructor
public class TickerController {

    private final HypeDataService hypeDataService;
    private final RedisCacheService redisCacheService;

    @GetMapping("/trending")
    public ResponseEntity<List<TrendingTickerDto>> getTrending(
            @RequestParam(defaultValue = "10") int limit) {
        Set<String> symbols = redisCacheService.getTopTickers(limit);

        List<TrendingTickerDto> trending = symbols.stream()
                .map(symbol -> {
                    HypeScore score = hypeDataService.getLatestScore(symbol).orElse(null);
                    AlphaVantageQuoteDto quote = hypeDataService.fetchQuote(symbol);
                    int mentionCount = hypeDataService.getMentionCount(symbol);

                    return TrendingTickerDto.builder()
                            .symbol(symbol)
                            .score(score != null ? score.getScore() : null)
                            .redditScore(score != null ? score.getRedditScore() : null)
                            .newsScore(score != null ? score.getNewsScore() : null)
                            .volumeScore(score != null ? score.getVolumeScore() : null)
                            .priceScore(score != null ? score.getFiftyTwoWeekScore() : null)
                            .verdict(score != null ? score.getVerdict() : null)
                            .priceChange(quote != null ? quote.getChange() : null)
                            .changePercent(quote != null ? parseChangePercent(quote.getChangePercent()) : null)
                            .mentionCount(mentionCount)
                            .build();
                })
                .filter(dto -> dto.getScore() != null)
                .sorted(Comparator.comparingDouble(TrendingTickerDto::getScore).reversed())
                .collect(Collectors.toList());

        return ResponseEntity.ok(trending);
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
