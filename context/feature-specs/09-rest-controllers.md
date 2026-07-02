Read `AGENTS.md` before starting.

# Feature: REST Controllers

## What To Build

Implement five REST controllers that expose backend data to the Next.js frontend. All controllers are already stubbed in `controller/`. Implement them in place. All endpoints require a valid Clerk JWT in the `Authorization: Bearer {token}` header except where noted.

The Clerk JWT verification is handled by `SecurityConfig` — controllers do not need to validate tokens themselves. Every protected endpoint will automatically reject unauthenticated requests with a 401.

---

## Response Conventions

All controllers follow these rules:

- Return `ResponseEntity<T>` for all endpoints
- On success: `ResponseEntity.ok(dto)`
- On not found: `ResponseEntity.notFound().build()`
- On bad request: `ResponseEntity.badRequest().body(errorMessage)`
- Never return raw entity objects — always map to a DTO before returning
- All endpoints produce `application/json`

---

## TickerController

### Location
`controller/TickerController.java`

### Base mapping
`/api/tickers`

### Dependencies to inject
- `HypeDataService`
- `RedisCacheService`

### Endpoints

**GET `/api/tickers/trending`**

Returns the top 10 most hyped tickers from Redis.

```java
@GetMapping("/trending")
public ResponseEntity<List<TrendingTickerDto>> getTrending(
    @RequestParam(defaultValue = "10") int limit)
```

- Calls `RedisCacheService.getTopTickers(limit)`
- For each ticker symbol returned, fetch the latest `HypeScore` from PostgreSQL via `HypeDataService`
- Maps to `TrendingTickerDto`
- Returns the list ordered by hype score descending

**TrendingTickerDto fields:**
```java
String symbol
Double score
Double redditScore
Double newsScore
Double volumeScore
Double priceScore
HypeScore.Verdict verdict
Double priceChange      // from AlphaVantageQuoteDto.change
Double changePercent    // from AlphaVantageQuoteDto.changePercent
Integer mentionCount    // count of SentimentEvents in last 24h
```

---

## HypeController

### Location
`controller/HypeController.java`

### Base mapping
`/api/hype`

### Dependencies to inject
- `HypeDataService`
- `HypeScoreRepository`
- `SentimentEventRepository`
- `TickerRepository`
- `MarketDataService`

### Endpoints

**GET `/api/hype/{ticker}`**

Returns the full deep dive breakdown for a single ticker.

```java
@GetMapping("/{ticker}")
public ResponseEntity<HypeBreakdownDto> getHypeBreakdown(@PathVariable String ticker)
```

- Finds the `Ticker` entity by symbol — returns 404 if not found
- Fetches the latest `HypeScore` row from PostgreSQL
- Fetches the last 30 days of `HypeScore` rows for the history chart
- Fetches the 10 most recent `SentimentEvent` rows for the sources section
- Fetches current market data from `MarketDataService.fetchQuote(ticker)`
- Maps everything to `HypeBreakdownDto`

**HypeBreakdownDto fields:**
```java
String symbol
Double currentScore
Double redditScore
Double newsScore
Double volumeScore
Double priceScore
HypeScore.Verdict verdict
Double currentPrice
Double priceChange
Double changePercent
List<HypeScorePointDto> scoreHistory   // 30 days of scores for the chart
List<SentimentSourceDto> sources       // 10 most recent sentiment events
```

**HypeScorePointDto fields:**
```java
LocalDateTime timestamp
Double score
```

**SentimentSourceDto fields:**
```java
String source        // REDDIT, REUTERS, CNBC, MARKETWATCH, NASDAQ
String content       // truncated headline or post title
String polarity      // POSITIVE, NEGATIVE, NEUTRAL
```

**GET `/api/hype/{ticker}/history`**

Returns hype score history for a ticker over a given number of days.

```java
@GetMapping("/{ticker}/history")
public ResponseEntity<List<HypeScorePointDto>> getHypeHistory(
    @PathVariable String ticker,
    @RequestParam(defaultValue = "30") int days)
```

- Fetches HypeScore rows for the ticker from the past N days
- Returns as a list of `HypeScorePointDto` ordered by timestamp ascending
- Used by the frontend to overlay hype score on the price chart

---

## AlertController

### Location
`controller/AlertController.java`

### Base mapping
`/api/alerts`

### Dependencies to inject
- `AlertRepository`
- `TickerRepository`

### Clerk User ID

Extract the authenticated Clerk user ID from the JWT using Spring Security:

```java
private String getClerkUserId() {
    return SecurityContextHolder.getContext()
        .getAuthentication()
        .getName();
}
```

This returns the Clerk `userId` string (e.g. `user_2abc123`) which is used to scope alerts to the authenticated user.

### Endpoints

**GET `/api/alerts`**

Returns all active alerts for the authenticated user.

```java
@GetMapping
public ResponseEntity<List<AlertResponseDto>> getAlerts()
```

- Filters alerts by `clerkUserId` matching the authenticated user
- Returns only `isActive = true` alerts

**AlertResponseDto fields:**
```java
Long id
String tickerSymbol
Double threshold
String notificationType
LocalDateTime createdAt
LocalDateTime lastTriggeredAt
```

**POST `/api/alerts`**

Creates a new alert for the authenticated user.

```java
@PostMapping
public ResponseEntity<AlertResponseDto> createAlert(@RequestBody AlertRequestDto request)
```

**AlertRequestDto fields:**
```java
String tickerSymbol     // validated: not blank, uppercase, 1–5 chars
Double threshold        // validated: 0.0–100.0
```

- Validates that the ticker exists in the database — returns 400 if not found
- Checks if an active alert already exists for this user + ticker combination — returns 400 with message `"Active alert already exists for {ticker}"` if so
- Sets `clerkUserId` from `getClerkUserId()`
- Sets `notificationType = EMAIL`
- Saves and returns the created alert as `AlertResponseDto`

**DELETE `/api/alerts/{id}`**

Deactivates an alert.

```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteAlert(@PathVariable Long id)
```

- Fetches the alert — returns 404 if not found
- Verifies the `clerkUserId` on the alert matches the authenticated user — returns 403 if not
- Sets `isActive = false` (soft delete — do not hard delete so triggered history is preserved)
- Saves and returns 204 No Content

---

## HistoryController

### Location
`controller/HistoryController.java`

### Base mapping
`/api/history`

### Dependencies to inject
- `HistoricalEventRepository`
- `TickerRepository`

### Endpoints

**GET `/api/history`**

Returns all curated historical events.

```java
@GetMapping
public ResponseEntity<List<HistoricalEventDto>> getAllEvents()
```

**HistoricalEventDto fields:**
```java
Long id
String tickerSymbol
String eventName
String description
LocalDate startDate
LocalDate endDate
```

**GET `/api/history/{id}`**

Returns a single historical event by ID.

```java
@GetMapping("/{id}")
public ResponseEntity<HistoricalEventDto> getEvent(@PathVariable Long id)
```

Returns 404 if not found.

---

## WatchlistController

### Location
`controller/WatchlistController.java`

### Base mapping
`/api/watchlist`

### Note on current state

The frontend watchlist currently uses `localStorage`. This controller will be wired up in a future session when localStorage is migrated to the database. For now, implement the endpoints fully so they are ready — the frontend will switch to calling them when persistence is moved to the backend.

### Dependencies to inject
- `WatchlistItemRepository` — this does not exist yet. Create `model/WatchlistItem.java` and `repository/WatchlistItemRepository.java` as part of this task.
- `TickerRepository`

### WatchlistItem model

Create this entity at `model/WatchlistItem.java`:

```java
@Entity
@Table(name = "watchlist_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clerk_user_id", nullable = false)
    private String clerkUserId;

    @ManyToOne
    @JoinColumn(name = "ticker_id", nullable = false)
    private Ticker ticker;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

### WatchlistItemRepository

Create at `repository/WatchlistItemRepository.java`:

```java
public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {
    List<WatchlistItem> findByClerkUserId(String clerkUserId);
    Optional<WatchlistItem> findByClerkUserIdAndTicker(String clerkUserId, Ticker ticker);
    void deleteByClerkUserIdAndTicker(String clerkUserId, Ticker ticker);
}
```

### Endpoints

**GET `/api/watchlist`**

Returns all watchlisted tickers for the authenticated user.

```java
@GetMapping
public ResponseEntity<List<WatchlistItemDto>> getWatchlist()
```

**WatchlistItemDto fields:**
```java
Long id
String tickerSymbol
LocalDateTime addedAt
```

**POST `/api/watchlist/{ticker}`**

Adds a ticker to the authenticated user's watchlist.

```java
@PostMapping("/{ticker}")
public ResponseEntity<WatchlistItemDto> addToWatchlist(@PathVariable String ticker)
```

- Validates ticker exists in the database — returns 400 if not
- Checks it's not already in the watchlist — returns 400 if duplicate
- Saves and returns the created `WatchlistItemDto`

**DELETE `/api/watchlist/{ticker}`**

Removes a ticker from the authenticated user's watchlist.

```java
@DeleteMapping("/{ticker}")
public ResponseEntity<Void> removeFromWatchlist(@PathVariable String ticker)
```

- Verifies the item belongs to the authenticated user — returns 403 if not
- Deletes and returns 204 No Content

---

## HypeDataService

### Location
`service/HypeDataService.java`

This service already exists as a stub. Implement it now as it is used by both `TickerController` and `HypeController`.

### Dependencies to inject
- `HypeScoreRepository`
- `TickerRepository`
- `SentimentEventRepository`
- `MarketDataService`

### Methods to implement

```java
public Optional<HypeScore> getLatestScore(String symbol)
// Finds ticker by symbol, returns latest HypeScore row

public List<HypeScore> getScoreHistory(String symbol, int days)
// Returns HypeScore rows for the ticker from the past N days ordered by createdAt ASC

public List<SentimentEvent> getRecentEvents(String symbol, int limit)
// Returns the most recent N SentimentEvent rows for the ticker
```

---

## Check When Done

- [ ] `GET /api/tickers/trending` returns a list of `TrendingTickerDto` from Redis + PostgreSQL
- [ ] `GET /api/hype/{ticker}` returns a full `HypeBreakdownDto` including score history and sources
- [ ] `GET /api/hype/{ticker}/history` returns ordered score history for the requested number of days
- [ ] `GET /api/alerts` returns only the authenticated user's active alerts
- [ ] `POST /api/alerts` creates an alert and returns 400 on duplicate or invalid ticker
- [ ] `DELETE /api/alerts/{id}` soft-deletes the alert and returns 403 if user does not own it
- [ ] `GET /api/history` returns all curated historical events
- [ ] `GET /api/history/{id}` returns 404 for unknown IDs
- [ ] `WatchlistItem` model and `WatchlistItemRepository` are created
- [ ] `GET /api/watchlist` returns the authenticated user's watchlist
- [ ] `POST /api/watchlist/{ticker}` adds a ticker and returns 400 on duplicate
- [ ] `DELETE /api/watchlist/{ticker}` removes a ticker and returns 403 if not owned by user
- [ ] `HypeDataService` methods are implemented and used by the controllers
- [ ] All endpoints return correct HTTP status codes
- [ ] No raw entities are returned — all responses use DTOs
- [ ] All controllers compile without errors