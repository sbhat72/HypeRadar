package com.hyperadar.repository;

import com.hyperadar.model.SentimentEvent;
import com.hyperadar.model.Ticker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface SentimentEventRepository extends JpaRepository<SentimentEvent, Long> {
    List<SentimentEvent> findByTickerAndCreatedAtAfter(Ticker ticker, LocalDateTime after);
}
