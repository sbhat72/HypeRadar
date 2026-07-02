# HypeRadar — Claude Code Instructions

## What This Project Is
A stock market social sentiment analysis platform. Tracks social media hype around stocks
and ETFs by polling Reddit and financial news RSS feeds, combines social signal with real
market data from Finnhub, and produces a hype score, sentiment analysis, bullish/bearish
verdict, and real-time alert system for everyday investors.

## Core Features
1. **Live Hype Dashboard** — top trending tickers updated in real time via WebSocket
2. **Hype Score Engine** — 0–100 score combining Reddit mention velocity, news sentiment, volume spike, and 52-week position
3. **Ticker Deep Dive** — full signal breakdown per ticker with chart history
4. **Sentiment Analysis** — positive vs negative tone aggregated across Reddit and news
5. **Hype vs Price Chart** — dual-axis chart showing hype score and stock price over time
6. **Bullish/Bearish Classifier** — four verdicts: Hype Confirmed, Pure Hype, Hidden Momentum, Bearish Confirmation
7. **Alert System** — users set a hype threshold for any ticker and receive an email when crossed
8. **Historical Hype Events** — curated meme stock moments (GME, AMC, NVDA) with hype replays
9. **Financial Signal Breakdown** — volume spike, 52-week position, price volatility
10. **Price Movement** — 7-day and 30-day price change per ticker

## Tech Stack
- **Backend:** Java 21 + Spring Boot 3 (REST API + WebSocket)
- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Database:** PostgreSQL (Railway or Supabase)
- **Cache:** Redis (Upstash)
- **Data Sources:** Reddit API, Finnhub API, Reuters RSS, CNBC RSS
- **Email:** Resend
- **Auth:** Spring Security + JWT
- **Build:** Maven 3.9

## Folder Structure
```
HypeRadar/
├── backend/
│   └── src/main/java/com/hyperadar/
│       ├── controller/
│       ├── service/
│       │   ├── ingestion/
│       │   ├── processing/
│       │   └── alert/
│       ├── repository/
│       ├── model/
│       ├── dto/
│       ├── scheduler/
│       ├── config/
│       └── exception/
└── frontend/
    ├── src/
    │   └── app/
    │       ├── (auth)/
    │       ├── dashboard/
    │       ├── ticker/[symbol]/
    │       ├── alerts/
    │       └── history/
    └── components/
        ├── dashboard/
        ├── ticker/
        ├── alerts/
        └── ui/
```

## Naming Conventions
- Java classes: PascalCase (`HypeScoreEngineService.java`)
- Java methods and variables: camelCase (`computeHypeScore()`)
- REST endpoints: kebab-case (`/api/hype/ticker-breakdown`)
- Database tables: snake_case (`hype_scores`, `sentiment_events`)
- React components: PascalCase (`HypeDashboard.tsx`)
- TypeScript files: camelCase (`useHypeScore.ts`)
- Environment variables: SCREAMING_SNAKE_CASE (`FINNHUB_API_KEY`)

## Git Workflow — Follow This Every Time
- `main` is protected — never commit directly to main
- Every feature gets its own branch: `feature/hype-score-engine`, `feature/reddit-poller`, `feature/alert-system`
- Every bug fix branch: `fix/websocket-disconnect`, `fix/rate-limit-counter`
- After completing any task: stage all changes, commit, push to the feature branch
- Commit message format: `type(scope): description`
  - `feat(backend): add hype score computation service`
  - `feat(frontend): add dual-axis hype vs price chart`
  - `fix(ingestion): resolve Reddit API rate limit overflow`
  - `chore(config): add Finnhub and Redis environment variables`
- Never push directly to main — always open a PR

## Security Rules — Never Break These
- Never hardcode secrets, API keys, or tokens in any file
- All secrets go in `.env` (backend) and `.env.local` (frontend) — both are gitignored
- All API endpoints require authentication except `/api/auth/login` and `/api/auth/register`
- Validate and sanitize all inputs on the backend before processing
- JWT tokens are stateless — never store them server-side
- Reddit and Finnhub API keys go in environment variables only

## Definition of Done
A task is complete when:
1. The feature works end-to-end
2. There is at least one test covering the core logic
3. No secrets are hardcoded
4. Code is committed with a proper message and pushed to the feature branch