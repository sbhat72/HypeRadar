package com.hyperadar.service.processing;

import com.hyperadar.repository.HypeScoreRepository;
import com.hyperadar.service.RedisCacheService;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class RedisBootUpService {
    private final RedisCacheService redisCacheService;
    private final HypeScoreRepository hypeScoreRepository;

    @PostConstruct
    public void initializeTrendingTickers() {
        hypeScoreRepository.findAll().forEach(hypeScore -> {
            redisCacheService.saveHypeScore(hypeScore.getTicker().getSymbol(), hypeScore.getScore());
            redisCacheService.updateTrendingScore(hypeScore.getTicker().getSymbol(), hypeScore.getScore());
        });
    }
}
