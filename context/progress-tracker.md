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
- `SentimentAnalyzerService` — computeRedditScores() and computeNewsScores(). Reads SentimentEvent rows from the past 24h per ticker, applies polarity formula ((positive-negative)/total mapped to 0–100). Returns 50.0 neutral default for tickers with no events.
- `HypeScoreEngineService` — computeAll(). Fetches sentiment scores, Alpha Vantage quotes for all tickers, normalises volume across the cycle, computes weighted hype score (reddit 40%, news 30%, volume 20%, price 10%), saves HypeScore to PostgreSQL, updates Redis hype cache and trending sorted set.
- `BullishBearishClassifierService` — classifyAll(). Reads the two most recent HypeScore rows per ticker, computes hype delta and price delta (Alpha Vantage changePercent), stamps HYPE_CONFIRMED / PURE_HYPE / HIDDEN_MOMENTUM / BEARISH_CONFIRMATION verdict on the latest row. Skips tickers with fewer than two rows.

### DTOs
- `AlphaVantageQuoteDto` — @JsonProperty mapped fields from Alpha Vantage GLOBAL_QUOTE response
- `AlphaVantageResponseDto` — outer wrapper mapping "Global Quote" key to inner DTO
- `AuthRequestDto` — email, password, fullName. **To be removed — auth is moving to Clerk**
- `AuthResponseDto` — token. **To be removed — auth is moving to Clerk**
- `TrendingTickerDto` — symbol, score, redditScore, newsScore, volumeScore, priceScore, verdict, priceChange, changePercent, mentionCount
- `HypeBreakdownDto` — full deep dive DTO with symbol, scores, verdict, market data, scoreHistory, sources
- `HypeScorePointDto` — timestamp + score for chart history
- `SentimentSourceDto` — source, content, polarity (all String)
- `AlertRequestDto` — tickerSymbol (validated: not blank, 1–5 uppercase chars), threshold (0.0–100.0)
- `AlertResponseDto` — id, tickerSymbol, threshold, notificationType, createdAt, lastTriggeredAt
- `WatchlistItemDto` — id, tickerSymbol, addedAt
- `HistoricalEventDto` — id, tickerSymbol, eventName, description, startDate, endDate

### Models (additions)
- `WatchlistItem` — clerkUserId String, ticker FK, createdAt. Entity for watchlist_items table.
- `Alert` — updated: replaced User FK with clerkUserId String to support Clerk auth

### Repositories (additions/updates)
- `WatchlistItemRepository` — findByClerkUserId, findByClerkUserIdAndTicker, deleteByClerkUserIdAndTicker
- `AlertRepository` — updated: replaced findByUserAndIsActiveTrue with findByClerkUserIdAndIsActiveTrue and findByClerkUserIdAndTickerAndIsActiveTrue
- `HypeScoreRepository` — added findByTickerAndCreatedAtAfterOrderByCreatedAtAsc for history queries
- `SentimentEventRepository` — added findByTickerOrderByCreatedAtDesc(Ticker, Pageable) for recent events with limit

### Services (additions)
- `HypeDataService` — implemented: getLatestScore, getScoreHistory, getScoreHistory, getRecentEvents, getMentionCount, fetchQuote (delegates to MarketDataService)

### Controllers
- `AuthController` — POST /api/auth/register. **To be removed — auth is moving to Clerk**
- `TickerController` — GET /api/tickers/trending: returns top N tickers from Redis, enriched with HypeScore + Alpha Vantage quote, ordered by score desc
- `HypeController` — GET /api/hype/{ticker}: full HypeBreakdownDto with 30-day history and 10 recent sources. GET /api/hype/{ticker}/history: paginated score history
- `AlertController` — GET /api/alerts (user-scoped active alerts), POST /api/alerts (creates alert, 400 on duplicate/missing ticker), DELETE /api/alerts/{id} (soft delete, 403 if not owner)
- `HistoryController` — GET /api/history (all events), GET /api/history/{id} (404 if not found)
- `WatchlistController` — GET /api/watchlist, POST /api/watchlist/{ticker} (400 on duplicate), DELETE /api/watchlist/{ticker} (403 if not owned)

### Resources
- `Loughran-McDonald_MasterDictionary_1993-2025.csv` — 86,000+ word financial sentiment lexicon loaded at startup by RssFeedParserService

### Frontend Pages
- **Sign-in / Sign-up** — Clerk auth with full stock market terminal dark theme. Routes: `/sign-in`, `/sign-up`. Redirects to `/hyped-stocks` after auth. Spec: `context/feature-specs/01-DesignSignUp.md`
- **Live Hyped Stocks Dashboard** — `/hyped-stocks`. 18 mock tickers in a responsive grid. Header with pulsing live dot, "Live Hyped Stocks" in red/white/green. Time period filter tabs (1H/1D/1W/1M). TrendingTickerCard with price, change, mention count, 5-bar heat indicator, price flash on simulated updates (setInterval every 3s). Spec: `context/feature-specs/02-hyped-stocks.md`
- **Ticker Deep Dive** — `/hyped-stocks/[ticker]`. Full deep dive page. Real price chart via `lightweight-charts` v5 (TradingView) with area series. Time range tabs 1D/1W/1M/1Y each fetching from Yahoo Finance v8 chart API via a Next.js proxy route (`/api/yahoo-finance`). Financial summary row (current price, 52-week high/low, volume). Hype score breakdown with 4 sub-signal progress bars (mock data, colour-coded). Pure Hype verdict badge. 6 mock source cards with polarity badges. Watchlist toggle button — persists ticker to localStorage keyed by Clerk user ID. Spec: `context/feature-specs/03-ticker-deep-dive.md`
- **Watchlist** — `/watchlist`. Protected page. Reads watchlist from localStorage (`hyperadar:watchlist:{userId}` keyed by Clerk user ID). Summary panel with combined +/- dollar change and percentage (5-tab time period toggle: 1H/1D/1W/1M/1Y, scaled by multipliers), total mentions, and average hype score. Stock cards on `--bg-elevated` with heat indicator (same 5-bar component as dashboard), remove button (× — muted, turns red on hover, removes without confirmation). Clicking card navigates to deep dive. Watchlist News section with 2–3 mock headlines per ticker filtered to watchlisted symbols; each card shows source badge, headline, ticker tag, and polarity badge. Empty state with link to dashboard. Spec: `context/feature-specs/04-watchlist.md`
- **Alerts** — `/alerts`. Protected page. Create alert form: ticker input (uppercase, 1–5 chars with inline validation), hype threshold slider (0–100, green track below thumb, red above, default 70), read-only Clerk email field (greyed out). Active alerts list reads from localStorage (`hyperadar:alerts:{userId}`) — each card shows ticker, threshold, email, Active badge, trash-icon delete button. Empty state when no alerts. Triggered alerts history section with 4 mock entries showing ticker, threshold, fired score, date, and Triggered orange badge. 3-second success toast bottom-right after creating alert. Spec: `context/feature-specs/05-alerts.md`
- **History** — `/history`. Protected page. Curated timeline of 6 famous meme stock / hype-driven events (GME short squeeze, AMC squeeze, NVDA AI surge, BBBY squeeze, DOGE Elon pump, Roaring Kitty returns). Page header with `Hype` in green (#62C073) and `History` in red (#FF6166). Vertical timeline connector on left side with colour-coded dots per tag type. Each event card shows tag badge (Short Squeeze/Meme Stock/Earnings Catalyst/Social Media Pump with distinct accent colours), ticker, event name, date range, description, peak price and peak gain (both in green), and a View Chart / Close Chart toggle button. Clicking View Chart fetches real historical data from Yahoo Finance via a new `/api/yahoo-finance-history` proxy route (period1/period2 Unix timestamp params) and renders an area chart using lightweight-charts v5 with a peak price arrowDown marker via `createSeriesMarkers`. All event data is hardcoded. Loading and error states handled inline. Spec: `context/feature-specs/06-history.md`

### Schedulers
- `DataPipelineScheduler` — `@Scheduled(fixedDelay = 300000)`. Polls Reddit, parses RSS, then runs `HypeScoreEngineService.computeAll()`, `BullishBearishClassifierService.classifyAll()`, and `LiveWebSocketController.broadcastUpdate()`. Reddit and RSS steps each have their own try/catch; the processing block has a shared try/catch. Logs pipeline start and end with timestamp.
- `AlertScheduler` — `@Scheduled(fixedDelay = 120000)`. Fetches all active alerts from PostgreSQL, reads hype score from Redis (skips on cache miss), enforces 4-hour deduplication window, delegates to `AlertThresholdService.fireAlert()` when threshold crossed. Each alert wrapped in its own try/catch.
- `LiveWebSocketController.broadcastUpdate()` — stub added; full WebSocket implementation is a future task.
- `AlertThresholdService.fireAlert()` — stub added; email dispatch and `lastTriggeredAt` update are a future task.

### Frontend Components
- `TrendingTickerCard` — card component with heat indicator (5 signal bars, blue→orange→red based on mention intensity), price flash animation (green/red CSS keyframe triggered by price change direction)
- `PriceChart` — client component wrapping lightweight-charts v5 AreaSeries. Accepts `ChartPoint[]` (Unix-second timestamps + close values), handles resize via ResizeObserver, dynamic import to avoid SSR issues
- `Navbar` (`src/components/ui/Navbar.tsx`) — sticky top nav for all protected pages. Left: HypeRadar logo linking to `/hyped-stocks`. Centre: Dashboard, Watchlist, Alerts, and History links with green underline on active route. Right: Clerk `<UserButton />`

### Libs
- `src/lib/watchlist.ts` — localStorage helpers: `getWatchlist`, `addToWatchlist`, `removeFromWatchlist`, `isWatchlisted`. Keyed as `hyperadar:watchlist:{userId}`
- `src/lib/alerts.ts` — localStorage helpers: `getAlerts`, `addAlert`, `removeAlert`. Alert type includes id, ticker, threshold, email, createdAt. Keyed as `hyperadar:alerts:{userId}`
- `src/lib/mock-tickers.ts` — shared `MOCK_TICKERS` array (18 tickers) used by the watchlist page for base price/change/mention/hypeScore data

### API Routes
- `/api/yahoo-finance` — Next.js App Router GET route that proxies Yahoo Finance v8 chart API. Accepts `ticker`, `interval`, `range` query params. Returns raw Yahoo Finance JSON. Avoids browser CORS restrictions.
- `/api/yahoo-finance-history` — Next.js App Router GET route that proxies Yahoo Finance v8 chart API using Unix timestamp params. Accepts `ticker`, `period1`, `period2`. Validates that period1 < period2 and both are integers. 8-second AbortController timeout. Used by the History page for curated event charts.

---

## In Progress

- None

---

## Up Next

1. Clerk auth integration — replace custom auth layer, update SecurityConfig to verify Clerk JWTs (Alert already uses clerkUserId String; WatchlistItem already built)
2. Alert services — AlertThresholdService full impl, EmailDispatcherService (Resend)
3. WebSocketConfig and LiveWebSocketController full implementation
4. Frontend wiring — switch dashboard to /api/tickers/trending, ticker deep dive to /api/hype/{ticker}, alerts to /api/alerts, watchlist to /api/watchlist (currently localStorage-backed)

---

## Known Issues

| # | Issue | Status | Resolution |
|---|---|---|---|
| 1 | Reddit Data API requires moderation use case approval for new app credentials | Resolved | Switched to unauthenticated public JSON endpoints (/r/{subreddit}/hot.json) with User-Agent header |
| 2 | Finnhub free tier does not include candle, company-news, or stock metric endpoints | Resolved | Switched to Alpha Vantage GLOBAL_QUOTE which provides price, volume, and change data on the free tier |
| 3 | Custom auth layer (UserService, JwtUtil, SecurityConfig) built before Clerk decision | Pending | Will be removed or archived when Clerk is integrated. Alert and WatchlistItem will use clerkUserId String instead of User FK |
| 4 | Ticker model originally included name and sector fields | Resolved | Removed both fields — tickers are discovered dynamically from content so name/sector are not available at creation time |
| 5 | `react` and `react-dom` in package.json specified as `^18.0.0`, below the `^18.2.0` peer requirement of Next.js 16 | Resolved | Updated both to `^18.2.0` in package.json. Installed version was already 18.3.1 so no reinstall needed |
| 6 | Yahoo Finance proxy route had no fetch timeout — slow upstream could block indefinitely | Resolved | Added AbortController with 8 s timeout; clears on success; distinguishes AbortError in error response |
| 7 | Yahoo Finance proxy accepted arbitrary interval/range values injected into upstream URL | Resolved | Added allowlist sets (ALLOWED_INTERVALS, ALLOWED_RANGES); returns 400 for unknown values |
| 8 | Source evidence cards used `<a href="#">` with `preventDefault` — poor semantics and broken keyboard nav | Resolved | Replaced with `<button type="button">` with `w-full text-left` so layout is unchanged |
| 9 | Rapid tab switches could commit stale chart data; error path left previous meta visible | Resolved | useEffect now creates an AbortController per run and cancels inflight fetch on cleanup; error path resets chartData and meta to initial values |
| 10 | PriceChart useEffect only depended on `data`, leaving ResizeObserver alive against detached DOM during loading/error | Resolved | Added `loading` and `error` to the dependency array so cleanup fires immediately on state transitions |
| 11 | `AbortError: signal is aborted without reason` surfaced as a Runtime error in the dev overlay on the deep dive page | Resolved | Two-part fix: (1) replaced `err instanceof Error && err.name === 'AbortError'` with `signal.aborted` — the definitive check that works regardless of whether the runtime throws a `DOMException` or `Error`; (2) added `.catch(() => {})` on the `loadChart(...)` call in the useEffect so any rejection that escapes the internal catch block never becomes an unhandled Promise rejection |
| 12 | React hydration mismatch on `<body>` — Grammarly browser extension injects `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` attributes into the DOM before React hydrates, causing a server/client attribute diff | Resolved | Added `suppressHydrationWarning` to `<body>` in `src/app/layout.tsx`. This tells React to skip attribute-level comparison on the body element without suppressing child hydration errors |

---

## Architecture Decisions Log

- **Tickers are discovered dynamically** — rather than pre-seeding a watchlist, HypeRadar scans headlines and Reddit posts for stock symbols, validates them against the Alpha Vantage LISTING_STATUS universe, and creates Ticker entries on first encounter
- **Loughran-McDonald dictionary for sentiment** — professional-grade financial NLP lexicon used instead of hand-picked keyword lists. 86,000+ words loaded into memory at startup via @PostConstruct
- **Reddit unauthenticated polling** — Reddit's Data API now requires approval. Public JSON endpoints are sufficient for post title scanning and mention counting
- **Alpha Vantage over Finnhub** — Finnhub's useful endpoints (candle, news, metrics) are behind a paywall. Alpha Vantage GLOBAL_QUOTE provides price, volume, and change data on the free tier
- **Clerk over custom JWT auth** — auth is not a differentiator for this project. Clerk handles registration, login, and session management. Backend will verify Clerk JWTs via JWKS endpoint
