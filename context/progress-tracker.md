# HypeRadar — Progress Tracker

This file tracks what has been built, what is in progress, known issues encountered, and what comes next. Update this file at the end of every working session so the AI has accurate context on the current state of the project.

---

## Completed

### Models
- `Ticker` — symbol, createdAt. Name and sector removed — tickers are discovered dynamically from content, not pre-seeded.
- `HypeScore` — ticker FK, score, redditScore, newsScore, volumeScore, fiftyTwoWeekScore, verdict enum (HYPE_CONFIRMED, PURE_HYPE, HIDDEN_MOMENTUM, BEARISH_CONFIRMATION), createdAt
- `SentimentEvent` — ticker FK, source enum (REDDIT, REUTERS, CNBC, MARKETWATCH, NASDAQ), content, polarity enum (POSITIVE, NEGATIVE, NEUTRAL), createdAt
- `Alert` — user FK via clerkUserId String, ticker FK, threshold Double, notificationType enum (EMAIL), isActive, lastTriggeredAt, createdAt
- `HistoricalEvent` — ticker FK, eventName, description, startDate, endDate, createdAt
- `User` — email, passwordHash, fullName, createdAt, updatedAt. Implements Spring Security UserDetails. **To be removed or archived — auth is moving to Clerk**

### Repositories
- `TickerRepository` — findBySymbol
- `HypeScoreRepository` — findByTickerOrderByCreatedAtDesc, findTopByTickerOrderByCreatedAtDesc
- `SentimentEventRepository` — findByTickerAndCreatedAtAfter
- `AlertRepository` — findByUserAndIsActiveTrue, findByIsActiveTrue
- `HistoricalEventRepository` — base JpaRepository only
- `UserRepository` — findByEmail. **To be removed or archived — auth is moving to Clerk**

### Config
- `JwtUtil` — token generation, username extraction, token validation using jjwt 0.11.5. **To be removed — auth is moving to Clerk**
- `JwtAuthenticationFilter` — OncePerRequestFilter that intercepts requests and sets SecurityContext. **To be replaced with Clerk JWT verification**
- `SecurityConfig` — Spring Security 6, CSRF disabled, STATELESS sessions, CORS for localhost:3000, public routes /api/auth/** and /ws/**. **To be updated for Clerk**
- `RedisConfig` — RedisTemplate<String, String> with StringRedisSerializer for keys and values. Connected via RedisConnectionFactory from application.properties

### Services
- `UserService` — loadUserByUsername (Spring Security bridge), registerUser (email uniqueness check, BCrypt hash, save, return JWT). **To be removed — auth is moving to Clerk**
- `RedisCacheService` — saveHypeScore, getHypeScore, updateTrendingScore, getTopTickers, isRateLimited, publishAlert
- `RedditPollerService` — unauthenticated public JSON endpoints (/r/{subreddit}/hot.json), User-Agent header, fetchSubredditPosts, poll. Ticker mention extraction and SentimentEvent writing implemented.
- `MarketDataService` — Alpha Vantage GLOBAL_QUOTE endpoint, fetchQuote returns AlphaVantageQuoteDto
- `RssFeedParserService` — fully implemented. loadValidTickers (@PostConstruct, Alpha Vantage LISTING_STATUS), loadSentimentDictionary (@PostConstruct, Loughran-McDonald CSV), getHeadlines (Rome library, 4 RSS feeds), findTickerMentions (regex + cashtag detection, validated against listing universe), scoreSentiment (Loughran-McDonald keyword scoring), parse (orchestrates full pipeline, creates Tickers dynamically, saves SentimentEvents)

### DTOs
- `AlphaVantageQuoteDto` — @JsonProperty mapped fields from Alpha Vantage GLOBAL_QUOTE response
- `AlphaVantageResponseDto` — outer wrapper mapping "Global Quote" key to inner DTO
- `AuthRequestDto` — email, password, fullName. **To be removed — auth is moving to Clerk**
- `AuthResponseDto` — token. **To be removed — auth is moving to Clerk**

### Controllers
- `AuthController` — POST /api/auth/register. **To be removed — auth is moving to Clerk**

### Resources
- `Loughran-McDonald_MasterDictionary_1993-2025.csv` — 86,000+ word financial sentiment lexicon loaded at startup by RssFeedParserService

---

## In Progress

- Processing engine — SentimentAnalyzerService, HypeScoreEngineService, BullishBearishClassifierService
- **Frontend: Login page** — stock market themed design with Clerk auth integration (`/login`). Spec: `context/feature-specs/01-DesignSignUp.md`

---

## Up Next

1. Complete processing engine (SentimentAnalyzerService → HypeScoreEngineService → BullishBearishClassifierService)
2. Schedulers — DataPipelineScheduler, AlertScheduler
3. Clerk auth integration — replace custom auth layer, update SecurityConfig to verify Clerk JWTs, store clerkUserId on Alert and WatchlistItem
4. Alert services — AlertThresholdService, EmailDispatcherService (Resend)
5. WatchlistItem model and repository (new — not in original scaffold)
6. REST controllers — TickerController, HypeController, AlertController, HistoryController, WatchlistController
7. WebSocketConfig and LiveWebSocketController
8. Remaining DTOs — TrendingTickerDto, HypeBreakdownDto, AlertRequestDto, AlertResponseDto, HypeUpdateMessage, WatchlistDto
9. Frontend — Next.js 15 with Clerk, dashboard, ticker deep dive, watchlist, alerts, history

---

## Known Issues

| # | Issue | Status | Resolution |
|---|---|---|---|
| 1 | Reddit Data API requires moderation use case approval for new app credentials | Resolved | Switched to unauthenticated public JSON endpoints (/r/{subreddit}/hot.json) with User-Agent header |
| 2 | Finnhub free tier does not include candle, company-news, or stock metric endpoints | Resolved | Switched to Alpha Vantage GLOBAL_QUOTE which provides price, volume, and change data on the free tier |
| 3 | Custom auth layer (UserService, JwtUtil, SecurityConfig) built before Clerk decision | Pending | Will be removed or archived when Clerk is integrated. Alert and WatchlistItem will use clerkUserId String instead of User FK |
| 4 | Ticker model originally included name and sector fields | Resolved | Removed both fields — tickers are discovered dynamically from content so name/sector are not available at creation time |

---

## Architecture Decisions Log

- **Tickers are discovered dynamically** — rather than pre-seeding a watchlist, HypeRadar scans headlines and Reddit posts for stock symbols, validates them against the Alpha Vantage LISTING_STATUS universe, and creates Ticker entries on first encounter
- **Loughran-McDonald dictionary for sentiment** — professional-grade financial NLP lexicon used instead of hand-picked keyword lists. 86,000+ words loaded into memory at startup via @PostConstruct
- **Reddit unauthenticated polling** — Reddit's Data API now requires approval. Public JSON endpoints are sufficient for post title scanning and mention counting
- **Alpha Vantage over Finnhub** — Finnhub's useful endpoints (candle, news, metrics) are behind a paywall. Alpha Vantage GLOBAL_QUOTE provides price, volume, and change data on the free tier
- **Clerk over custom JWT auth** — auth is not a differentiator for this project. Clerk handles registration, login, and session management. Backend will verify Clerk JWTs via JWKS endpoint
