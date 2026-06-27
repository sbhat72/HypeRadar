# HypeRadar — Progress Tracker

This file tracks what has been built, what is in progress, known issues encountered, and what comes next. Update this file at the end of every working session so the AI has accurate context on the current state of the project.

---

## Completed

### Models
- `Ticker` — symbol, createdAt. Name and sector removed — tickers are discovered dynamically from content, not pre-seeded.
- `HypeScore` — ticker FK, score, redditScore, newsScore, volumeScore, fiftyTwoWeekScore, verdict enum (HYPE_CONFIRMED, PURE_HYPE, HIDDEN_MOMENTUM, BEARISH_CONFIRMATION), createdAt
- `SentimentEvent` — ticker FK, source enum (STOCKTWITS, YAHOO_FINANCE, CNBC, MARKETWATCH, NASDAQ), content, polarity enum (POSITIVE, NEGATIVE, NEUTRAL), createdAt
- `Alert` — clerkUserId String, ticker FK, threshold Double, notificationType enum (EMAIL), isActive, lastTriggeredAt, createdAt
- `HistoricalEvent` — ticker FK, eventName, description, startDate, endDate, createdAt

### Repositories
- `TickerRepository` — findBySymbol
- `HypeScoreRepository` — findByTickerOrderByCreatedAtDesc, findTopByTickerOrderByCreatedAtDesc
- `SentimentEventRepository` — findByTickerAndCreatedAtAfter
- `AlertRepository` — findByClerkUserIdAndIsActiveTrue, findByClerkUserIdAndTickerAndIsActiveTrue, findByIsActiveTrue
- `HistoricalEventRepository` — base JpaRepository only

### Config
- `ClerkAuthenticationFilter` — OncePerRequestFilter that reads the `Authorization: Bearer` header, decodes the Clerk JWT via `JwtDecoder`, validates the `sub` claim is non-null/non-blank, and sets it as the authenticated principal in `SecurityContextHolder`. Passes through on missing/invalid token or missing sub.
- `SecurityConfig` — Spring Security 6, CSRF disabled, STATELESS sessions, CORS for localhost:3000, `/ws/**` public, all other routes require authentication. `JwtDecoder` bean: `NimbusJwtDecoder` pointed at `${clerk.jwks-uri}` with `JwtValidators.createDefaultWithIssuer(${clerk.issuer})` to enforce issuer. `ClerkAuthenticationFilter` injected as `securityFilterChain` method parameter (avoids `SecurityConfig` → `ClerkAuthenticationFilter` → `JwtDecoder` → `SecurityConfig` bean cycle).
- `RedisConfig` — RedisTemplate<String, String> with StringRedisSerializer for keys and values. Connected via RedisConnectionFactory from application.properties

### Services
- `RedisCacheService` — saveHypeScore, getHypeScore, updateTrendingScore, getTopTickers, isRateLimited, publishAlert
- `StockTwitsService` — polls `GET https://api.stocktwits.com/api/2/streams/symbol/{symbol}.json` for every ticker in the database. No auth required. Extracts bullish/bearish sentiment from `entities.sentiment.basic`, maps to POSITIVE/NEGATIVE/NEUTRAL polarity. 200 ms delay between tickers to avoid rate limits.
- `MarketDataService` — Alpha Vantage GLOBAL_QUOTE endpoint, fetchQuote returns AlphaVantageQuoteDto
- `RssFeedParserService` — fully implemented. loadValidTickers (@PostConstruct, Alpha Vantage LISTING_STATUS), loadSentimentDictionary (@PostConstruct, Loughran-McDonald CSV), getHeadlines (Rome library, 4 RSS feeds: Yahoo Finance, CNBC, MarketWatch, NASDAQ), findTickerMentions (regex + cashtag detection, validated against listing universe), scoreSentiment (Loughran-McDonald keyword scoring), parse (orchestrates full pipeline, creates Tickers dynamically, saves SentimentEvents)
- `SentimentAnalyzerService` — computeStockTwitsScores() and computeNewsScores(). Reads SentimentEvent rows from the past 24h per ticker, applies polarity formula ((positive-negative)/total mapped to 0–100). Returns 50.0 neutral default for tickers with no events. NEWS_SOURCES uses YAHOO_FINANCE (not REUTERS).
- `HypeScoreEngineService` — computeAll(). Fetches sentiment scores, Alpha Vantage quotes for all tickers, normalises volume across the cycle, computes weighted hype score (reddit 40%, news 30%, volume 20%, price 10%), saves HypeScore to PostgreSQL, updates Redis hype cache and trending sorted set.
- `BullishBearishClassifierService` — classifyAll(). Reads the two most recent HypeScore rows per ticker, computes hype delta and price delta (Alpha Vantage changePercent), stamps HYPE_CONFIRMED / PURE_HYPE / HIDDEN_MOMENTUM / BEARISH_CONFIRMATION verdict on the latest row. Skips tickers with fewer than two rows.

### DTOs
- `AlphaVantageQuoteDto` — @JsonProperty mapped fields from Alpha Vantage GLOBAL_QUOTE response
- `AlphaVantageResponseDto` — outer wrapper mapping "Global Quote" key to inner DTO
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
- `TickerController` — GET /api/tickers/trending: returns top N tickers from Redis, enriched with HypeScore + Alpha Vantage quote, ordered by score desc
- `HypeController` — GET /api/hype/{ticker}: full HypeBreakdownDto with 30-day history and 10 recent sources. GET /api/hype/{ticker}/history: paginated score history
- `AlertController` — GET /api/alerts (user-scoped active alerts), POST /api/alerts (creates alert, 400 on duplicate/missing ticker), DELETE /api/alerts/{id} (soft delete, 403 if not owner)
- `HistoryController` — GET /api/history (all events), GET /api/history/{id} (404 if not found)
- `WatchlistController` — GET /api/watchlist, POST /api/watchlist/{ticker} (400 on duplicate), DELETE /api/watchlist/{ticker} (403 if not owned)

### Resources
- `Loughran-McDonald_MasterDictionary_1993-2025.csv` — 86,000+ word financial sentiment lexicon loaded at startup by RssFeedParserService

### Frontend Pages
- **Sign-in / Sign-up** — Clerk auth with full stock market terminal dark theme. Routes: `/sign-in`, `/sign-up`. Redirects to `/hyped-stocks` after auth. Spec: `context/feature-specs/01-DesignSignUp.md`
- **Live Hyped Stocks Dashboard** — `/hyped-stocks`. Fetches real tickers from `GET /api/tickers/trending?limit=20` on mount via `useApiClient`. Loading skeleton (4 placeholder cards, animate-pulse) while fetching; error state with Retry button on failure. TrendingTickerCard with price, change, mention count, 5-bar heat indicator, price flash on simulated updates (setInterval every 3s runs on top of fetched data). Time period filter tabs (1H/1D/1W/1M, visual only). Spec: `context/feature-specs/02-hyped-stocks.md`
- **Ticker Deep Dive** — `/hyped-stocks/[ticker]`. Full deep dive page. Real price chart via `lightweight-charts` v5 (TradingView) with area series — unchanged. Time range tabs 1D/1W/1M/1Y each fetching from Yahoo Finance v8. Financial summary row from Yahoo Finance — unchanged. Hype score breakdown fetched from `GET /api/hype/{ticker}`: `currentScore`, `redditScore`, `newsScore`, `volumeScore`, `priceScore`. Verdict mapped from API enum (`HYPE_CONFIRMED`→green, `PURE_HYPE`→orange, `HIDDEN_MOMENTUM`→blue, `BEARISH_CONFIRMATION`→red). Source cards from API `sources[]` (source, content, polarity). 404 shows "No hype data found" message. Watchlist button calls `GET /api/watchlist` on mount to check status, `POST /api/watchlist/{ticker}` to add, `DELETE /api/watchlist/{ticker}` to remove. Spec: `context/feature-specs/03-ticker-deep-dive.md`
- **Watchlist** — `/watchlist`. Protected page. Loads items from `GET /api/watchlist` (`WatchlistItemDto[]`). Joins with `GET /api/tickers/trending` for price/hype data; MOCK_TICKERS used as fallback for tickers not in trending results. Summary panel stats computed only from tickers with real trending data. Remove button calls `DELETE /api/watchlist/{ticker}` and removes card from local state immediately. Watchlist News section still uses mock data. Spec: `context/feature-specs/04-watchlist.md`
- **Alerts** — `/alerts`. Protected page. Active alerts loaded from `GET /api/alerts` (`AlertResponseDto[]`). Create alert calls `POST /api/alerts` `{ tickerSymbol, threshold }` — on 400 shows inline error ("An active alert already exists for {ticker}" or "Ticker not found"). Delete calls `DELETE /api/alerts/{id}` and removes from local state immediately. Triggered alerts history section still uses mock data. 3-second success toast bottom-right after creating alert. Spec: `context/feature-specs/05-alerts.md`
- **History** — `/history`. Protected page. Curated timeline of 6 famous meme stock / hype-driven events (GME short squeeze, AMC squeeze, NVDA AI surge, BBBY squeeze, DOGE Elon pump, Roaring Kitty returns). Page header with `Hype` in green (#62C073) and `History` in red (#FF6166). Vertical timeline connector on left side with colour-coded dots per tag type. Each event card shows tag badge (Short Squeeze/Meme Stock/Earnings Catalyst/Social Media Pump with distinct accent colours), ticker, event name, date range, description, peak price and peak gain (both in green), and a View Chart / Close Chart toggle button. Clicking View Chart fetches real historical data from Yahoo Finance via a new `/api/yahoo-finance-history` proxy route (period1/period2 Unix timestamp params) and renders an area chart using lightweight-charts v5 with a peak price arrowDown marker via `createSeriesMarkers`. All event data is hardcoded. Loading and error states handled inline. Spec: `context/feature-specs/06-history.md`

### Schedulers
- `DataPipelineScheduler` — `@Scheduled(fixedDelay = 300000)`. Pipeline order: (1) `RssFeedParserService.parse()` discovers tickers from news feeds, (2) `StockTwitsService.poll()` polls social sentiment per ticker, (3) `HypeScoreEngineService.computeAll()` + `BullishBearishClassifierService.classifyAll()` + `LiveWebSocketController.broadcastUpdate()`. Each ingestion step has its own try/catch; processing block has a shared try/catch. Logs pipeline start and end with timestamp.
- `AlertScheduler` — `@Scheduled(fixedDelay = 120000)`. Fetches all active alerts from PostgreSQL, reads hype score from Redis (skips on cache miss), enforces 4-hour deduplication window, delegates to `AlertThresholdService.fireAlert()` when threshold crossed. Each alert wrapped in its own try/catch.
- `LiveWebSocketController.broadcastUpdate()` — stub added; full WebSocket implementation is a future task.
- `AlertThresholdService.fireAlert()` — stub added; email dispatch and `lastTriggeredAt` update are a future task.

### Frontend Components
- `TrendingTickerCard` — card component with heat indicator (5 signal bars, blue→orange→red based on mention intensity), price flash animation (green/red CSS keyframe triggered by price change direction). `TickerData` interface updated: `change`, `changePercent`, `hypeScore` typed as `number | null`; `price` typed as `number | null | undefined`. All `.toFixed()` calls guarded with optional chaining + `?? '--'`; numeric comparisons guarded with `?? 0`. Dashboard page simulation guard updated from `=== undefined` to `== null` to match the widened types.
- `PriceChart` — client component wrapping lightweight-charts v5 AreaSeries. Accepts `ChartPoint[]` (Unix-second timestamps + close values), handles resize via ResizeObserver, dynamic import to avoid SSR issues
- `Navbar` (`src/components/ui/Navbar.tsx`) — sticky top nav for all protected pages. Left: HypeRadar logo linking to `/hyped-stocks`. Centre: Dashboard, Watchlist, Alerts, and History links with green underline on active route. Right: Clerk `<UserButton />`

### Libs
- `src/lib/mock-tickers.ts` — shared `MOCK_TICKERS` array (18 tickers) used by the watchlist page as fallback price/change/mention/hypeScore data for tickers not in the trending API response
- `src/lib/api.ts` — `apiGet`/`apiPost` helpers for internal Next.js routes; `apiFetch` Server Component helper that attaches the Clerk JWT (`Authorization: Bearer`) to every request to the Spring Boot backend (`NEXT_PUBLIC_API_URL`). Throws at module init if `NEXT_PUBLIC_API_URL` is unset. Uses `new Headers(options?.headers)` to safely merge caller headers before setting defaults.
- `src/lib/useApiClient.ts` — client-side `useApiClient()` hook. Uses `useAuth().getToken()` from Clerk to attach Bearer token to all Spring Boot API calls. Returns `{ apiCall(path, options?) }`. Returns null for 204/empty responses. Used by all four protected pages (dashboard, deep dive, alerts, watchlist).

### API Routes
- `/api/yahoo-finance` — Next.js App Router GET route that proxies Yahoo Finance v8 chart API. Accepts `ticker`, `interval`, `range` query params. Returns raw Yahoo Finance JSON. Avoids browser CORS restrictions.
- `/api/yahoo-finance-history` — Next.js App Router GET route that proxies Yahoo Finance v8 chart API using Unix timestamp params. Accepts `ticker`, `period1`, `period2`. Validates that period1 < period2 and both are integers. 8-second AbortController timeout. Used by the History page for curated event charts.

---

## In Progress

- None

---

## Up Next

1. Alert services — AlertThresholdService full impl, EmailDispatcherService (Resend)
2. WebSocketConfig and LiveWebSocketController full implementation

---

## Known Issues

| # | Issue | Status | Resolution |
|---|---|---|---|
| 1 | Reddit Data API requires moderation use case approval for new app credentials | Resolved | Switched to unauthenticated public JSON endpoints (/r/{subreddit}/hot.json) with User-Agent header |
| 2 | Finnhub free tier does not include candle, company-news, or stock metric endpoints | Resolved | Switched to Alpha Vantage GLOBAL_QUOTE which provides price, volume, and change data on the free tier |
| 3 | Custom auth layer (UserService, JwtUtil, SecurityConfig) built before Clerk decision | Resolved | Removed all custom auth files. SecurityConfig rewritten with NimbusJwtDecoder pointed at Clerk JWKS URI. ClerkAuthenticationFilter extracts sub claim as principal. |
| 4 | Ticker model originally included name and sector fields | Resolved | Removed both fields — tickers are discovered dynamically from content so name/sector are not available at creation time |
| 5 | `react` and `react-dom` in package.json specified as `^18.0.0`, below the `^18.2.0` peer requirement of Next.js 16 | Resolved | Updated both to `^18.2.0` in package.json. Installed version was already 18.3.1 so no reinstall needed |
| 6 | Yahoo Finance proxy route had no fetch timeout — slow upstream could block indefinitely | Resolved | Added AbortController with 8 s timeout; clears on success; distinguishes AbortError in error response |
| 7 | Yahoo Finance proxy accepted arbitrary interval/range values injected into upstream URL | Resolved | Added allowlist sets (ALLOWED_INTERVALS, ALLOWED_RANGES); returns 400 for unknown values |
| 8 | Source evidence cards used `<a href="#">` with `preventDefault` — poor semantics and broken keyboard nav | Resolved | Replaced with `<button type="button">` with `w-full text-left` so layout is unchanged |
| 9 | Rapid tab switches could commit stale chart data; error path left previous meta visible | Resolved | useEffect now creates an AbortController per run and cancels inflight fetch on cleanup; error path resets chartData and meta to initial values |
| 10 | PriceChart useEffect only depended on `data`, leaving ResizeObserver alive against detached DOM during loading/error | Resolved | Added `loading` and `error` to the dependency array so cleanup fires immediately on state transitions |
| 11 | `AbortError: signal is aborted without reason` surfaced as a Runtime error in the dev overlay on the deep dive page | Resolved | Two-part fix: (1) replaced `err instanceof Error && err.name === 'AbortError'` with `signal.aborted` — the definitive check that works regardless of whether the runtime throws a `DOMException` or `Error`; (2) added `.catch(() => {})` on the `loadChart(...)` call in the useEffect so any rejection that escapes the internal catch block never becomes an unhandled Promise rejection |
| 12 | React hydration mismatch on `<body>` — Grammarly browser extension injects `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` attributes into the DOM before React hydrates, causing a server/client attribute diff | Resolved | Added `suppressHydrationWarning` to `<body>` in `src/app/layout.tsx`. This tells React to skip attribute-level comparison on the body element without suppressing child hydration errors |
| 13 | `frontend/.env.local` was committed to git (no root `.gitignore` existed), exposing `CLERK_SECRET_KEY` in history | Resolved | Replaced real key with placeholder in the file. **Action required: rotate the Clerk secret key at dashboard.clerk.com immediately.** Add `frontend/.env.local` to a root `.gitignore` before next commit. |
| 14 | Backend fails to start: `Could not resolve placeholder 'CLERK_JWKS_URI'` — env var not set and no `.env` file present | Resolved | Added `${CLERK_JWKS_URI:https://coherent-doberman-64.clerk.accounts.dev/.well-known/jwks.json}` default in `application.properties` (JWKS URI is a public endpoint, not a secret). Also added `spring.config.import=optional:file:.env[.properties]` and `backend/.env.example` template for local dev. |
| 15 | Spring Boot on Windows does not load `.env` files automatically — backend fell back to unresolved placeholders and failed to connect to PostgreSQL and Redis | Resolved | Created `backend/src/main/resources/application-default.properties` with real credentials (gitignored). Spring Boot loads this file automatically when no profile is set (falls back to `"default"` profile), so plain `mvnw.cmd spring-boot:run` works. Also removed `spring-dotenv` from `pom.xml` and added `spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect`. |
| 16 | `application-local.properties` loaded only when `-Dspring-boot.run.profiles=local` flag is passed — plain `mvn spring-boot:run` logs `No active profile set` and uses unresolved placeholders, causing `password authentication failed for user "postgres"` | Resolved | Created `application-default.properties` (gitignored) with the same credentials. Spring Boot loads this for the implicit `"default"` profile so no flag is required. `application.properties` kept clean with `${PLACEHOLDER}` references; secrets never committed to git. |
| 17 | Backend failed to start: `FATAL: password authentication failed for user "postgres"`. Spec `12-fix-env-locking.md` mis-diagnosed this as a username-format problem and proposed switching from the Supabase transaction pooler to the direct connection (`db.jwipvcbbuxyrcgdqkvpe.supabase.co:5432`) | Resolved | **Both of the spec's claims were wrong, verified by running each config.** (1) The direct host resolves to an **IPv6-only AAAA record** with no IPv4 A record (Supabase made direct connections IPv6-only; IPv4 is a paid add-on), so on this IPv4 network it dies with `java.net.UnknownHostException` — the spec's fix is strictly worse here. (2) The pooler reporting user `postgres` (suffix stripped) is **normal PgBouncer tenant routing**, not a JDBC bug. The actual root cause was simply a **wrong/stale DB password** (`K@runa2037`). Fix: kept the IPv4 transaction-pooler host + `postgres.{ref}` username, corrected the password to the current Supabase value in `application-local.properties` and `application-default.properties`. App now starts cleanly — `HikariPool-1 - Start completed`, `Tomcat started on port 8080`, `Started HypeRadarApplication`. **Deliberately did NOT remove `spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect` from `application.properties` as the spec asked** — Hibernate's dialect-probe connection can hit a transient pooler auth hiccup at startup, and the explicit dialect is the fallback that lets the app boot anyway; removing it makes that transient failure fatal (`Unable to determine Dialect without JDBC metadata`). Unrelated: `UnknownHostException: feeds.reuters.com` still appears at runtime (dead Reuters RSS URL) — separate pre-existing issue, not a DB problem. |
| 18 | Reddit Data API requires app approval; dead Reuters RSS feed (`feeds.reuters.com`) caused `UnknownHostException` at every pipeline cycle | Resolved | Replaced Reddit polling with `StockTwitsService` (no auth required, returns built-in bullish/bearish sentiment labels). Replaced Reuters feed with Yahoo Finance RSS (`finance.yahoo.com/news/rssindex`). `SentimentEvent.Source` enum updated: `REDDIT` → `STOCKTWITS`, `REUTERS` → `YAHOO_FINANCE`. Pipeline reordered: RSS first (creates Ticker rows), StockTwits second (polls existing tickers). |
| 19 | `TrendingTickerCard` crashes with `Cannot read properties of null (reading 'toFixed')` when Alpha Vantage free tier cannot fetch a live quote for every ticker, sending null price/change/changePercent from the backend | Resolved | Updated `TickerData` interface: `change`, `changePercent`, `hypeScore` → `number \| null`; `price` → `number \| null \| undefined`. All `.toFixed()` calls use optional chaining + `?? '--'`; `isPositive` comparison uses `(ticker.change ?? 0) >= 0`; price null check uses `!= null` (covers both null and undefined). Dashboard simulation guard updated from `=== undefined` to `== null` to avoid arithmetic on null values. |

---

## Architecture Decisions Log

- **Tickers are discovered dynamically** — rather than pre-seeding a watchlist, HypeRadar scans headlines and Reddit posts for stock symbols, validates them against the Alpha Vantage LISTING_STATUS universe, and creates Ticker entries on first encounter
- **Loughran-McDonald dictionary for sentiment** — professional-grade financial NLP lexicon used instead of hand-picked keyword lists. 86,000+ words loaded into memory at startup via @PostConstruct
- **Reddit unauthenticated polling** — Reddit's Data API now requires approval. Public JSON endpoints are sufficient for post title scanning and mention counting
- **Alpha Vantage over Finnhub** — Finnhub's useful endpoints (candle, news, metrics) are behind a paywall. Alpha Vantage GLOBAL_QUOTE provides price, volume, and change data on the free tier
- **Clerk over custom JWT auth** — auth is not a differentiator for this project. Clerk handles registration, login, and session management. Backend verifies Clerk JWTs via `NimbusJwtDecoder` pointed at `{clerk-frontend-api}/.well-known/jwks.json`. The Clerk `sub` claim (e.g. `user_2abc123`) is used as the user identifier across all user-scoped tables (Alert, WatchlistItem)
