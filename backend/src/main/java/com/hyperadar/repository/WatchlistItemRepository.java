package com.hyperadar.repository;

import com.hyperadar.model.Ticker;
import com.hyperadar.model.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {
    List<WatchlistItem> findByClerkUserId(String clerkUserId);
    Optional<WatchlistItem> findByClerkUserIdAndTicker(String clerkUserId, Ticker ticker);
    @Transactional
    void deleteByClerkUserIdAndTicker(String clerkUserId, Ticker ticker);
}
