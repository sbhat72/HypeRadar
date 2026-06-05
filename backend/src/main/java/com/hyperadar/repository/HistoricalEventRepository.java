package com.hyperadar.repository;

import com.hyperadar.model.HistoricalEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoricalEventRepository extends JpaRepository<HistoricalEvent, Long> {
}
