package com.hyperadar.service.processing;
import com.hyperadar.repository.HypeScoreRepository;
import com.hyperadar.service.RedisCacheService;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;


@AllArgsConstructor
public class RedisBootUpService {
    private final RedisCacheService redisCacheService;
    private final HypeScoreRepository hypeScoreRepository;

    @PostConstruct
    public void initializeTrendingTickers() {
        hypeScoreRepository.findAll().forEach(ticker -> {
            redisCacheService.saveHypeScore(ticker.getTicker().getSymbol(), ticker.getScore());
            redisCacheService.updateTrendingScore(ticker.getTicker().getSymbol(), ticker.getScore());
            
        });
        
    }
}
