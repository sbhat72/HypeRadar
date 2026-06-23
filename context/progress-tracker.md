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

### Frontend Pages
- **Sign-in / Sign-up** — Clerk auth with full stock market terminal dark theme. Routes: `/sign-in`, `/sign-up`. Redirects to `/hyped-stocks` after auth. Spec: `context/feature-specs/01-DesignSignUp.md`
- **Live Hyped Stocks Dashboard** — `/hyped-stocks`. 18 mock tickers in a responsive grid. Header with pulsing live dot, "Live Hyped Stocks" in red/white/green. Time period filter tabs (1H/1D/1W/1M). TrendingTickerCard with price, change, mention count, 5-bar heat indicator, price flash on simulated updates (setInterval every 3s). Spec: `context/feature-specs/02-hyped-stocks.md`
- **Ticker Deep Dive** — `/hyped-stocks/[ticker]`. Full deep dive page. Real price chart via `lightweight-charts` v5 (TradingView) with area series. Time range tabs 1D/1W/1M/1Y each fetching from Yahoo Finance v8 chart API via a Next.js proxy route (`/api/yahoo-finance`). Financial summary row (current price, 52-week high/low, volume). Hype score breakdown with 4 sub-signal progress bars (mock data, colour-coded). Pure Hype verdict badge. 6 mock source cards with polarity badges. Watchlist toggle button — persists ticker to localStorage keyed by Clerk user ID. Spec: `context/feature-specs/03-ticker-deep-dive.md`
- **Watchlist** — `/watchlist`. Protected page. Reads watchlist from localStorage (`hyperadar:watchlist:{userId}` keyed by Clerk user ID). Summary panel with combined +/- dollar change and percentage (5-tab time period toggle: 1H/1D/1W/1M/1Y, scaled by multipliers), total mentions, and average hype score. Stock cards on `--bg-elevated` with heat indicator (same 5-bar component as dashboard), remove button (× — muted, turns red on hover, removes without confirmation). Clicking card navigates to deep dive. Watchlist News section with 2–3 mock headlines per ticker filtered to watchlisted symbols; each card shows source badge, headline, ticker tag, and polarity badge. Empty state with link to dashboard. Spec: `context/feature-specs/04-watchlist.md`

### Frontend Components
- `TrendingTickerCard` — card component with heat indicator (5 signal bars, blue→orange→red based on mention intensity), price flash animation (green/red CSS keyframe triggered by price change direction)
- `PriceChart` — client component wrapping lightweight-charts v5 AreaSeries. Accepts `ChartPoint[]` (Unix-second timestamps + close values), handles resize via ResizeObserver, dynamic import to avoid SSR issues
- `Navbar` (`src/components/ui/Navbar.tsx`) — sticky top nav for all protected pages. Left: HypeRadar logo linking to `/hyped-stocks`. Centre: Dashboard and Watchlist links with green underline on active route. Right: Clerk `<UserButton />`

### Libs
- `src/lib/watchlist.ts` — localStorage helpers: `getWatchlist`, `addToWatchlist`, `removeFromWatchlist`, `isWatchlisted`. Keyed as `hyperadar:watchlist:{userId}`
- `src/lib/mock-tickers.ts` — shared `MOCK_TICKERS` array (18 tickers) used by the watchlist page for base price/change/mention/hypeScore data

### API Routes
- `/api/yahoo-finance` — Next.js App Router GET route that proxies Yahoo Finance v8 chart API. Accepts `ticker`, `interval`, `range` query params. Returns raw Yahoo Finance JSON. Avoids browser CORS restrictions.

---

## In Progress

- Processing engine — SentimentAnalyzerService, HypeScoreEngineService, BullishBearishClassifierService

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
| 5 | `react` and `react-dom` in package.json specified as `^18.0.0`, below the `^18.2.0` peer requirement of Next.js 16 | Resolved | Updated both to `^18.2.0` in package.json. Installed version was already 18.3.1 so no reinstall needed |
| 6 | Yahoo Finance proxy route had no fetch timeout — slow upstream could block indefinitely | Resolved | Added AbortController with 8 s timeout; clears on success; distinguishes AbortError in error response |
| 7 | Yahoo Finance proxy accepted arbitrary interval/range values injected into upstream URL | Resolved | Added allowlist sets (ALLOWED_INTERVALS, ALLOWED_RANGES); returns 400 for unknown values |
| 8 | Source evidence cards used `<a href="#">` with `preventDefault` — poor semantics and broken keyboard nav | Resolved | Replaced with `<button type="button">` with `w-full text-left` so layout is unchanged |
| 9 | Rapid tab switches could commit stale chart data; error path left previous meta visible | Resolved | useEffect now creates an AbortController per run and cancels inflight fetch on cleanup; error path resets chartData and meta to initial values |
| 10 | PriceChart useEffect only depended on `data`, leaving ResizeObserver alive against detached DOM during loading/error | Resolved | Added `loading` and `error` to the dependency array so cleanup fires immediately on state transitions |
| 11 | `AbortError: signal is aborted without reason` surfaced as a Runtime error in the dev overlay on the deep dive page | Resolved | Two-part fix: (1) replaced `err instanceof Error && err.name === 'AbortError'` with `signal.aborted` — the definitive check that works regardless of whether the runtime throws a `DOMException` or `Error`; (2) added `.catch(() => {})` on the `loadChart(...)` call in the useEffect so any rejection that escapes the internal catch block never becomes an unhandled Promise rejection |

---

## Architecture Decisions Log

- **Tickers are discovered dynamically** — rather than pre-seeding a watchlist, HypeRadar scans headlines and Reddit posts for stock symbols, validates them against the Alpha Vantage LISTING_STATUS universe, and creates Ticker entries on first encounter
- **Loughran-McDonald dictionary for sentiment** — professional-grade financial NLP lexicon used instead of hand-picked keyword lists. 86,000+ words loaded into memory at startup via @PostConstruct
- **Reddit unauthenticated polling** — Reddit's Data API now requires approval. Public JSON endpoints are sufficient for post title scanning and mention counting
- **Alpha Vantage over Finnhub** — Finnhub's useful endpoints (candle, news, metrics) are behind a paywall. Alpha Vantage GLOBAL_QUOTE provides price, volume, and change data on the free tier
- **Clerk over custom JWT auth** — auth is not a differentiator for this project. Clerk handles registration, login, and session management. Backend will verify Clerk JWTs via JWKS endpoint
