package com.hyperadar.repository;

import com.hyperadar.model.Alert;
import com.hyperadar.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByUserAndIsActiveTrue(User user);
    List<Alert> findByIsActiveTrue();
}
