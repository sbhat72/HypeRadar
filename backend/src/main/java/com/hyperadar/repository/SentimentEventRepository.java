package com.hyperadar.repository;

import com.hyperadar.model.SentimentEvent;
import com.hyperadar.model.Ticker;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface SentimentEventRepository extends JpaRepository<SentimentEvent, Long> {
    List<SentimentEvent> findByTickerAndCreatedAtAfter(Ticker ticker, LocalDateTime after);
    List<SentimentEvent> findByCreatedAtAfter(LocalDateTime after);
    List<SentimentEvent> findByTickerOrderByCreatedAtDesc(Ticker ticker, Pageable pageable);

    interface TickerMentionCount {
        String getSymbol();
        Long getMentionCount();
    }

    @Query("""
        SELECT t.symbol AS symbol, COUNT(se) AS mentionCount
        FROM SentimentEvent se JOIN se.ticker t
        WHERE se.createdAt >= :since
        GROUP BY t.symbol
        ORDER BY COUNT(se) DESC
        """)
    List<TickerMentionCount> findTopTickersByMentionCountSince(@Param("since") LocalDateTime since, Pageable pageable);
}
