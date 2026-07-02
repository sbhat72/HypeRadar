Read `AGENTS.md` before starting.

# Feature: Processing Engine

## What To Build

Implement three services that form the core computation layer of HypeRadar. These run in strict sequence after each ingestion cycle and transform raw `SentimentEvent` rows into hype scores and bullish/bearish verdicts.

```
SentimentAnalyzerService
    → reads SentimentEvent rows from PostgreSQL
    → computes redditScore and newsScore per ticker

HypeScoreEngineService
    → takes sentiment scores
    → fetches live market data from Alpha Vantage
    → runs the weighted formula
    → writes HypeScore to PostgreSQL and Redis

BullishBearishClassifierService
    → compares hype score delta vs price delta over 24h
    → stamps verdict on the latest HypeScore row
```

All three services are already stubbed in `service/processing/`. Implement them in place.

---

## Service 1: SentimentAnalyzerService

### Location
`service/processing/SentimentAnalyzerService.java`

### Dependencies to inject
- `SentimentEventRepository`
- `TickerRepository`

### What it does

For every ticker in the database, reads all `SentimentEvent` rows created in the past 24 hours and computes two sub-scores:

- **redditScore** — based on events where `source = REDDIT`
- **newsScore** — based on events where `source` is REUTERS, CNBC, MARKETWATCH, or NASDAQ

### Scoring formula

For each source group:

```
positiveCount = count of events where polarity = POSITIVE
negativeCount = count of events where polarity = NEGATIVE
totalCount = total events in that group

rawScore = (positiveCount - negativeCount) / totalCount
score = ((rawScore + 1) / 2) * 100   // maps -1..1 to 0..100
```

If there are no events for a source group, return 50.0 as a neutral default.

### Key methods

```java
public Map<Ticker, Double> computeRedditScores()
public Map<Ticker, Double> computeNewsScores()
```

Both return a map of every tracked ticker to its computed score. Called by `HypeScoreEngineService`.

---

## Service 2: HypeScoreEngineService

### Location
`service/processing/HypeScoreEngineService.java`

### Dependencies to inject
- `SentimentAnalyzerService`
- `MarketDataService`
- `HypeScoreRepository`
- `TickerRepository`
- `RedisCacheService`

### What it does

For every tracked ticker, runs the weighted hype score formula and writes the result to PostgreSQL and Redis.

### Hype score formula

```
HypeScore = (redditScore  × 0.40)
          + (newsScore    × 0.30)
          + (volumeScore  × 0.20)
          + (priceScore   × 0.10)
```

### Sub-score calculations

**redditScore and newsScore**
Pull from `SentimentAnalyzerService.computeRedditScores()` and `computeNewsScores()`.

**volumeScore**
Fetch current volume via `MarketDataService.fetchQuote(ticker)` — this returns `AlphaVantageQuoteDto` which contains the current volume. Normalize against all other tracked tickers in the current cycle:

```
volumeScore = (ticker_volume / max_volume_across_all_tickers) * 100
```
Capped at 100. If Alpha Vantage returns null volume, default to 50.

**priceScore**
Use the change percent from `AlphaVantageQuoteDto.changePercent`:

```
rawChange = parse changePercent string to double (e.g. "1.34%" → 1.34)
priceScore = Math.min(Math.max((rawChange + 10) / 20 * 100, 0), 100)
```
This maps a -10% to +10% daily change onto a 0–100 scale. Beyond that range it clamps.

### After computing the score

1. Build a `HypeScore` entity with all four sub-scores and the computed total
2. Save it to PostgreSQL via `HypeScoreRepository.save()`
3. Update Redis via `RedisCacheService.saveHypeScore(ticker.getSymbol(), score)`
4. Update the trending sorted set via `RedisCacheService.updateTrendingScore(ticker.getSymbol(), score)`

### Key method

```java
public void computeAll()
```

Iterates all tickers, computes scores, persists results. Called by `DataPipelineScheduler`.

---

## Service 3: BullishBearishClassifierService

### Location
`service/processing/BullishBearishClassifierService.java`

### Dependencies to inject
- `HypeScoreRepository`
- `TickerRepository`
- `MarketDataService`

### What it does

For every tracked ticker, compares the 24-hour hype score delta against the 24-hour price delta and assigns one of four verdicts to the latest `HypeScore` row.

### Getting the deltas

**Hype delta**
Query the two most recent `HypeScore` rows for the ticker:
```java
List<HypeScore> recent = hypeScoreRepository.findByTickerOrderByCreatedAtDesc(ticker);
```
If there are fewer than two rows, skip classification — not enough history yet.

```
hypeDelta = recent.get(0).getScore() - recent.get(1).getScore()
```

**Price delta**
Use `AlphaVantageQuoteDto.changePercent` from `MarketDataService.fetchQuote(ticker)`. Parse the string to a double.

```
priceDelta = changePercent as double (e.g. -1.87)
```

### Verdict logic

```
HYPE_THRESHOLD = 5.0   // hype score points
PRICE_THRESHOLD = 2.0  // price change percent

if hypeDelta > HYPE_THRESHOLD and priceDelta > PRICE_THRESHOLD  → HYPE_CONFIRMED
if hypeDelta > HYPE_THRESHOLD and priceDelta <= PRICE_THRESHOLD → PURE_HYPE
if hypeDelta <= HYPE_THRESHOLD and priceDelta > PRICE_THRESHOLD → HIDDEN_MOMENTUM
else                                                              → BEARISH_CONFIRMATION
```

### After classifying

Set the verdict on the latest `HypeScore` row and save:
```java
HypeScore latest = recent.get(0);
latest.setVerdict(verdict);
hypeScoreRepository.save(latest);
```

### Key method

```java
public void classifyAll()
```

Iterates all tickers, computes deltas, stamps verdict. Called by `DataPipelineScheduler` after `HypeScoreEngineService.computeAll()`.

---

## Important Notes

**Null safety** — Alpha Vantage occasionally returns null fields during off-hours or for tickers with low trading activity. Every field read from `AlphaVantageQuoteDto` must have a null check with a sensible default before being used in a formula.

**Tickers with no recent events** — if a ticker has zero `SentimentEvent` rows in the last 24 hours, still compute a `HypeScore` using 50.0 as the default for reddit and news scores. Do not skip tickers silently.

**Market hours** — the processing engine runs regardless of market hours. Alpha Vantage will return the last available price during off-hours which is acceptable.

**Order of operations** — the three services must run in this exact sequence:
1. `SentimentAnalyzerService` computes scores
2. `HypeScoreEngineService` uses those scores and writes to DB and Redis
3. `BullishBearishClassifierService` reads from DB to classify

Do not make the services call each other directly. The scheduler orchestrates the sequence. Each service exposes one public method (`computeRedditScores/computeNewsScores`, `computeAll`, `classifyAll`) and the scheduler calls them in order.

---

## Check When Done

- [ ] `SentimentAnalyzerService.computeRedditScores()` returns a populated map when SentimentEvent rows exist
- [ ] `SentimentAnalyzerService.computeNewsScores()` returns a populated map when SentimentEvent rows exist
- [ ] Both methods return 50.0 for tickers with no recent events
- [ ] `HypeScoreEngineService.computeAll()` iterates all tickers and saves a HypeScore row per ticker to PostgreSQL
- [ ] All four sub-scores are populated on the saved HypeScore row
- [ ] Redis is updated via RedisCacheService after each score is computed
- [ ] `BullishBearishClassifierService.classifyAll()` reads the two most recent scores per ticker and stamps a verdict
- [ ] Tickers with fewer than two HypeScore rows are skipped by the classifier without throwing an exception
- [ ] All Alpha Vantage null fields are handled with defaults — no NullPointerExceptions
- [ ] All three services compile without errors