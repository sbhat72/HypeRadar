package com.hyperadar.service;

import lombok.AllArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@AllArgsConstructor
public class RedisCacheService {

    private final RedisTemplate<String, String> redisTemplate;

    public void saveHypeScore(String ticker, Double score) {
        redisTemplate.opsForValue().set("hype:" + ticker, String.valueOf(score), 10, TimeUnit.MINUTES);
    }

    public String getHypeScore(String ticker) {
        return redisTemplate.opsForValue().get("hype:" + ticker);
    }

    public void updateTrendingScore(String ticker, Double score) {
        redisTemplate.opsForZSet().add("trending", ticker, score);
    }

    public Set<String> getTopTickers(int count) {
        return redisTemplate.opsForZSet().reverseRange("trending", 0, count - 1);
    }

    public boolean isRateLimited(String key, int limit) {
        Long count = redisTemplate.opsForValue().increment("ratelimit:" + key);
        redisTemplate.expire("ratelimit:" + key, 60, TimeUnit.SECONDS);
        return count > limit;
    }

    public void publishAlert(String payload) {
        redisTemplate.convertAndSend("alerts", payload);
    }
}