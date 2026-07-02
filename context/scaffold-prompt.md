# HypeRadar — Full Project Scaffold Prompt

Paste this entire prompt into Claude Code to generate the complete project structure.

---

Create the complete HypeRadar project structure. The backend is a Spring Boot 3 / Java 21
Maven project. The frontend is a Next.js 15 TypeScript app. Models and repositories are
fully populated. All other classes are stubs with the correct package, imports, annotations,
and a TODO comment — no implementation logic yet.

---

## BACKEND

### backend/pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <groupId>com.hyperadar</groupId>
    <artifactId>hyperadar-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>hyperadar-backend</name>

    <properties>
        <java.version>21</java.version>
        <jjwt.version>0.11.5</jjwt.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-websocket</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.rometools</groupId>
            <artifactId>rome</artifactId>
            <version>2.1.0</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

---

### backend/src/main/resources/application.properties

```properties
# Database
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# Redis
spring.data.redis.url=${REDIS_URL}

# JWT
jwt.secret=${JWT_SECRET}
jwt.expiration-ms=86400000

# Finnhub
finnhub.api-key=${FINNHUB_API_KEY}
finnhub.base-url=https://finnhub.io/api/v1

# Reddit
reddit.client-id=${REDDIT_CLIENT_ID}
reddit.client-secret=${REDDIT_CLIENT_SECRET}

# Resend
resend.api-key=${RESEND_API_KEY}

# Scheduling
spring.task.scheduling.enabled=true
```

---

### backend/src/main/java/com/hyperadar/HypeRadarApplication.java

```java
package com.hyperadar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HypeRadarApplication {
    public static void main(String[] args) {
        SpringApplication.run(HypeRadarApplication.class, args);
    }
}
```

---

## MODELS — fully populated

### backend/src/main/java/com/hyperadar/model/Ticker.java

```java
package com.hyperadar.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 10)
    private String symbol;

    @Column(nullable = false)
    private String name;

    @Column
    private String sector;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

---

### backend/src/main/java/com/hyperadar/model/HypeScore.java

```java
package com.hyperadar.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "hype_scores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HypeScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ticker_id", nullable = false)
    private Ticker ticker;

    @Column(nullable = false)
    private Double score;

    @Column(name = "reddit_score")
    private Double redditScore;

    @Column(name = "news_score")
    private Double newsScore;

    @Column(name = "volume_score")
    private Double volumeScore;

    @Column(name = "fifty_two_week_score")
    private Double fiftyTwoWeekScore;

    @Enumerated(EnumType.STRING)
    @Column
    private Verdict verdict;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Verdict {
        HYPE_CONFIRMED,
        PURE_HYPE,
        HIDDEN_MOMENTUM,
        BEARISH_CONFIRMATION
    }
}
```

---

### backend/src/main/java/com/hyperadar/model/SentimentEvent.java

```java
package com.hyperadar.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "sentiment_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ticker_id", nullable = false)
    private Ticker ticker;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Source source;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Polarity polarity;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Source {
        REDDIT,
        REUTERS,
        CNBC
    }

    public enum Polarity {
        POSITIVE,
        NEGATIVE,
        NEUTRAL
    }
}
```

---

### backend/src/main/java/com/hyperadar/model/Alert.java

```java
package com.hyperadar.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "ticker_id", nullable = false)
    private Ticker ticker;

    @Column(nullable = false)
    private Double threshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType notificationType;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "last_triggered_at")
    private LocalDateTime lastTriggeredAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        EMAIL
    }
}
```

---

### backend/src/main/java/com/hyperadar/model/HistoricalEvent.java

```java
package com.hyperadar.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "historical_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricalEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ticker_id", nullable = false)
    private Ticker ticker;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

---

### backend/src/main/java/com/hyperadar/model/User.java

```java
package com.hyperadar.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
```

---

## REPOSITORIES — fully populated

### backend/src/main/java/com/hyperadar/repository/TickerRepository.java

```java
package com.hyperadar.repository;

import com.hyperadar.model.Ticker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TickerRepository extends JpaRepository<Ticker, Long> {
    Optional<Ticker> findBySymbol(String symbol);
}
```

---

### backend/src/main/java/com/hyperadar/repository/HypeScoreRepository.java

```java
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
```

---

### backend/src/main/java/com/hyperadar/repository/SentimentEventRepository.java

```java
package com.hyperadar.repository;

import com.hyperadar.model.SentimentEvent;
import com.hyperadar.model.Ticker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface SentimentEventRepository extends JpaRepository<SentimentEvent, Long> {
    List<SentimentEvent> findByTickerAndCreatedAtAfter(Ticker ticker, LocalDateTime after);
}
```

---

### backend/src/main/java/com/hyperadar/repository/AlertRepository.java

```java
package com.hyperadar.repository;

import com.hyperadar.model.Alert;
import com.hyperadar.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByUserAndIsActiveTrue(User user);
    List<Alert> findByIsActiveTrue();
}
```

---

### backend/src/main/java/com/hyperadar/repository/HistoricalEventRepository.java

```java
package com.hyperadar.repository;

import com.hyperadar.model.HistoricalEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoricalEventRepository extends JpaRepository<HistoricalEvent, Long> {
}
```

---

### backend/src/main/java/com/hyperadar/repository/UserRepository.java

```java
package com.hyperadar.repository;

import com.hyperadar.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
```

---

## CONTROLLERS — stubs only

Create each of the following as a stub with the correct package, annotation, and a TODO comment.

- `controller/TickerController.java` — `@RestController @RequestMapping("/api/tickers")`
- `controller/HypeController.java` — `@RestController @RequestMapping("/api/hype")`
- `controller/AlertController.java` — `@RestController @RequestMapping("/api/alerts")`
- `controller/HistoryController.java` — `@RestController @RequestMapping("/api/history")`
- `controller/AuthController.java` — `@RestController @RequestMapping("/api/auth")`
- `controller/LiveWebSocketController.java` — `@Controller`

---

## SERVICES — stubs only

Create each of the following as a stub with the correct package, `@Service` annotation, and a TODO comment.

**Ingestion:**
- `service/ingestion/RedditPollerService.java`
- `service/ingestion/FinnhubClientService.java`
- `service/ingestion/RssFeedParserService.java`

**Processing:**
- `service/processing/SentimentAnalyzerService.java`
- `service/processing/HypeScoreEngineService.java`
- `service/processing/BullishBearishClassifierService.java`

**Alert:**
- `service/alert/AlertThresholdService.java`
- `service/alert/EmailDispatcherService.java`

**Core:**
- `service/RedisCacheService.java`
- `service/HypeDataService.java`
- `service/UserService.java`

---

## SCHEDULERS — stubs only

Create each with `@Component` and a `@Scheduled` method stub.

- `scheduler/DataPipelineScheduler.java` — method `runPipeline()` scheduled every 5 minutes
- `scheduler/AlertScheduler.java` — method `checkThresholds()` scheduled every 2 minutes

---

## DTOs — stubs only

Create each as a plain `@Data @Builder @NoArgsConstructor @AllArgsConstructor` class with no fields yet.

- `dto/TrendingTickerDto.java`
- `dto/HypeBreakdownDto.java`
- `dto/AlertRequestDto.java`
- `dto/AlertResponseDto.java`
- `dto/HypeUpdateMessage.java`
- `dto/AuthRequestDto.java`
- `dto/AuthResponseDto.java`

---

## CONFIG — stubs only

- `config/SecurityConfig.java` — `@Configuration @EnableWebSecurity` stub
- `config/RedisConfig.java` — `@Configuration` stub
- `config/WebSocketConfig.java` — `@Configuration @EnableWebSocketMessageBroker` stub
- `config/JwtUtil.java` — `@Component` stub

---

## EXCEPTIONS — stubs only

- `exception/TickerNotFoundException.java` — extends `RuntimeException`
- `exception/GlobalExceptionHandler.java` — `@RestControllerAdvice` stub

---

## FRONTEND

### frontend/package.json

```json
{
  "name": "hyperadar-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "recharts": "^2.10.0",
    "@stomp/stompjs": "^7.0.0",
    "sockjs-client": "^1.6.1"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

### Frontend pages — create as empty stubs with a single placeholder div

- `src/app/layout.tsx` — root layout with `<html>` and `<body>`
- `src/app/page.tsx` — redirects to `/dashboard`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/ticker/[symbol]/page.tsx`
- `src/app/alerts/page.tsx`
- `src/app/history/page.tsx`

### Frontend components — create as empty stub components

- `src/components/dashboard/HypeDashboard.tsx`
- `src/components/dashboard/TrendingTickerCard.tsx`
- `src/components/ticker/HypeVsPriceChart.tsx`
- `src/components/ticker/SignalBreakdown.tsx`
- `src/components/ticker/VerdictBadge.tsx`
- `src/components/alerts/AlertManager.tsx`
- `src/components/ui/HypeScoreBadge.tsx`

### Frontend lib — create as empty stub

- `src/lib/api.ts` — axios or fetch wrapper for backend calls

---

After creating all files, confirm the complete directory tree.
