package com.hyperadar.service.processing;

import com.hyperadar.repository.HypeScoreRepository;
import com.hyperadar.repository.TickerRepository;
import com.hyperadar.service.RedisCacheService;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class RedisBootUpService {
    private final RedisCacheService redisCacheService;
    private final HypeScoreRepository hypeScoreRepository;
    private final TickerRepository tickerRepository;

    @PostConstruct
    public void initializeTrendingTickers() {
        tickerRepository.findAll().forEach(ticker ->
                hypeScoreRepository.findTopByTickerOrderByCreatedAtDesc(ticker)
                        .ifPresent(hypeScore -> {
                            redisCacheService.saveHypeScore(ticker.getSymbol(), hypeScore.getScore());
                            redisCacheService.updateTrendingScore(ticker.getSymbol(), hypeScore.getScore());
                        })
        );
    }
}
