Read `AGENTS.md` before starting.

# Feature: Schedulers

## What To Build

Implement two `@Scheduled` beans that orchestrate the entire backend pipeline on a clock. Both classes are already stubbed in `scheduler/`. Implement them in place.

- `DataPipelineScheduler` — runs the full ingestion and processing sequence every 5 minutes
- `AlertScheduler` — checks active alert thresholds every 2 minutes and fires email notifications when crossed

---

## DataPipelineScheduler

### Location
`scheduler/DataPipelineScheduler.java`

### Dependencies to inject
- `RedditPollerService`
- `RssFeedParserService`
- `MarketDataService`
- `SentimentAnalyzerService`
- `HypeScoreEngineService`
- `BullishBearishClassifierService`
- `RedisCacheService`
- `LiveWebSocketController`

### Schedule
Runs every 5 minutes:
```java
@Scheduled(fixedDelay = 300000)
```

Use `fixedDelay` not `fixedRate` — `fixedDelay` waits 5 minutes after the previous run completes. `fixedRate` fires every 5 minutes regardless of whether the previous run finished, which would cause overlap if ingestion takes longer than expected.

### Execution sequence

The main method `runPipeline()` executes in this exact order:

```
1. RedditPollerService.poll()
2. RssFeedParserService.parse()
3. SentimentAnalyzerService.computeRedditScores()  ← result passed to step 5
4. SentimentAnalyzerService.computeNewsScores()    ← result passed to step 5
5. HypeScoreEngineService.computeAll()
6. BullishBearishClassifierService.classifyAll()
7. RedisCacheService — trending sorted set is already updated inside step 5
8. LiveWebSocketController.broadcastUpdate()       ← pushes updated scores to connected clients
```

Steps 3 and 4 do not need to be called explicitly in the scheduler — `HypeScoreEngineService.computeAll()` calls them internally. The scheduler calls only:

```java
@Scheduled(fixedDelay = 300000)
public void runPipeline() {
    redditPollerService.poll();
    rssFeedParserService.parse();
    hypeScoreEngineService.computeAll();
    bullishBearishClassifierService.classifyAll();
    liveWebSocketController.broadcastUpdate();
}
```

### Error handling

Wrap the entire body in a try/catch. A failure in one ingestion source must not abort the rest of the pipeline:

```java
@Scheduled(fixedDelay = 300000)
public void runPipeline() {
    try {
        redditPollerService.poll();
    } catch (Exception e) {
        // log and continue
    }
    try {
        rssFeedParserService.parse();
    } catch (Exception e) {
        // log and continue
    }
    try {
        hypeScoreEngineService.computeAll();
        bullishBearishClassifierService.classifyAll();
        liveWebSocketController.broadcastUpdate();
    } catch (Exception e) {
        // log
    }
}
```

Reddit being down should not stop RSS parsing. RSS being down should not stop scoring.

### Logging

Add a log statement at the start and end of `runPipeline()` with a timestamp so the pipeline activity is visible in logs:

```java
log.info("Pipeline cycle started at {}", LocalDateTime.now());
log.info("Pipeline cycle completed at {}", LocalDateTime.now());
```

Use `@Slf4j` (Lombok) for the logger.

---

## AlertScheduler

### Location
`scheduler/AlertScheduler.java`

### Dependencies to inject
- `AlertRepository`
- `RedisCacheService`
- `AlertThresholdService`

### Schedule
Runs every 2 minutes:
```java
@Scheduled(fixedDelay = 120000)
```

### Execution sequence

The main method `checkThresholds()`:

1. Fetches all active alerts from PostgreSQL:
```java
List<Alert> activeAlerts = alertRepository.findByIsActiveTrue();
```

2. For each alert, reads the current hype score from Redis:
```java
String scoreStr = redisCacheService.getHypeScore(alert.getTicker().getSymbol());
```

3. If the Redis key is null (TTL expired or ticker not yet scored), skip this alert — do not fall back to PostgreSQL for every alert on every cycle as that would generate too many queries.

4. Parse the score and check the deduplication window — skip if `lastTriggeredAt` is not null and is within the past 4 hours:
```java
if (alert.getLastTriggeredAt() != null &&
    alert.getLastTriggeredAt().isAfter(LocalDateTime.now().minusHours(4))) {
    continue;
}
```

5. If the current score exceeds the alert threshold, call `AlertThresholdService.fireAlert(alert, currentScore)`.

```java
@Scheduled(fixedDelay = 120000)
public void checkThresholds() {
    List<Alert> activeAlerts = alertRepository.findByIsActiveTrue();
    for (Alert alert : activeAlerts) {
        try {
            String scoreStr = redisCacheService.getHypeScore(alert.getTicker().getSymbol());
            if (scoreStr == null) continue;
            double currentScore = Double.parseDouble(scoreStr);
            if (alert.getLastTriggeredAt() != null &&
                alert.getLastTriggeredAt().isAfter(LocalDateTime.now().minusHours(4))) {
                continue;
            }
            if (currentScore >= alert.getThreshold()) {
                alertThresholdService.fireAlert(alert, currentScore);
            }
        } catch (Exception e) {
            // log and continue to next alert
        }
    }
}
```

### Error handling

Each alert check is wrapped individually — a failure on one alert must not abort the remaining alerts in the cycle.

### Logging

Log when an alert fires:
```java
log.info("Alert fired for ticker {} at hype score {}", alert.getTicker().getSymbol(), currentScore);
```

---

## Enabling Scheduling

Verify that `@EnableScheduling` is present on `HypeRadarApplication.java`. It was included in the scaffold but confirm it is still there before running:

```java
@SpringBootApplication
@EnableScheduling
public class HypeRadarApplication { ... }
```

---

## Check When Done

- [ ] `DataPipelineScheduler.runPipeline()` is annotated with `@Scheduled(fixedDelay = 300000)`
- [ ] Pipeline runs ingestion then processing in the correct sequence
- [ ] Each ingestion step (Reddit, RSS) is wrapped in its own try/catch so failures are isolated
- [ ] Log statements fire at the start and end of each pipeline cycle
- [ ] `AlertScheduler.checkThresholds()` is annotated with `@Scheduled(fixedDelay = 120000)`
- [ ] Alerts with a null Redis score are skipped without a database fallback
- [ ] 4-hour deduplication window correctly prevents repeated alert firing
- [ ] Each individual alert check is wrapped in try/catch
- [ ] Alert fire events are logged with ticker and score
- [ ] `@EnableScheduling` is confirmed on `HypeRadarApplication`
- [ ] Both classes compile without errors