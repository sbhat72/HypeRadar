package com.hyperadar.repository;

import com.hyperadar.model.HypeScore;
import com.hyperadar.model.Ticker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface HypeScoreRepository extends JpaRepository<HypeScore, Long> {
    List<HypeScore> findByTickerOrderByCreatedAtDesc(Ticker ticker);
    Optional<HypeScore> findTopByTickerOrderByCreatedAtDesc(Ticker ticker);
}
