package com.hyperadar.repository;

import com.hyperadar.model.Alert;
import com.hyperadar.model.Ticker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByClerkUserIdAndIsActiveTrue(String clerkUserId);
    Optional<Alert> findByClerkUserIdAndTickerAndIsActiveTrue(String clerkUserId, Ticker ticker);
    List<Alert> findByIsActiveTrue();
}
