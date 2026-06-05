# ⚡ HypeRadar

### Reddit moves stocks before the news does. HypeRadar tracks it.

![Java](https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

HypeRadar is a full-stack stock market sentiment platform that polls Reddit and financial news RSS feeds every 5 minutes, combines social signal with real market data from Finnhub, and computes a live **0–100 hype score** per ticker. Results are pushed to connected clients via WebSocket, stored in a dual-database layer (PostgreSQL + Redis), and can trigger email alerts when user-defined thresholds are crossed.

---

## Data Pipeline

```
Reddit API  ──┐
Finnhub API ──┼──► @Scheduled Ingestion ──► Processing Engine ──► PostgreSQL ──► REST API ──► Next.js 15
Reuters RSS ──┤         (5 min)                                ──► Redis Cache ──► WebSocket ──► Live Dashboard
CNBC RSS    ──┘                                                └──► Alert Engine ──► Resend Email
```

Three Spring `@Scheduled` jobs run in sequence every 5 minutes — Reddit poller, Finnhub client, and RSS feed parser. Once ingestion completes, the processing engine runs sentiment analysis, computes hype scores, and classifies each ticker. The result writes to PostgreSQL for persistence and Redis for sub-millisecond serving of live data.

---

## The Hype Score

Every ticker gets a 0–100 score on each pipeline cycle, computed from four independent signals:

```
HypeScore = (Reddit Velocity   × 0.40)
          + (News Sentiment    × 0.30)
          + (Volume Spike      × 0.20)
          + (52-Week Position  × 0.10)
```

| Signal | Formula | What it measures |
|---|---|---|
| **Reddit Velocity** | `(mentions_24h / rolling_30d_avg) × 50` capped at 100 | Spike in ticker mentions relative to baseline |
| **News Sentiment** | `(polarity + 1) / 2 × 100` | Aggregated tone across Reuters and CNBC headlines |
| **Volume Spike** | `(current_volume / avg_30d_volume) × 25` capped at 100 | Abnormal trading activity |
| **52-Week Position** | `(price − 52wk_low) / (52wk_high − 52wk_low) × 100` | Where the stock sits in its annual range |

Sub-scores are stored individually on every `HypeScore` row so the Deep Dive page can show a full signal breakdown — not just the final number.

---

## Bullish / Bearish Classifier

After each pipeline cycle, the classifier compares the 24-hour hype score delta against the 24-hour price delta and outputs one of four verdicts:

| Hype Δ | Price Δ | Verdict | Signal |
|---|---|---|---|
| ↑ Significant | ↑ Significant | **Hype Confirmed** | Social momentum is being validated by price action |
| ↑ Significant | Flat / ↓ | **Pure Hype** | Social noise not yet (or never) reflected in price |
| Flat / ↓ | ↑ Significant | **Hidden Momentum** | Price moving without social explanation — worth watching |
| ↓ / Flat | ↓ / Flat | **Bearish Confirmation** | Both signals pointing down |

"Significant" is defined as ±5 hype points and ±2% price movement — tunable without a schema change.

---

## Engineering Decisions

**Why PostgreSQL and Redis together, not one or the other**

PostgreSQL owns the truth — time-series hype scores, raw sentiment events, alert rules, historical event data. Redis owns the speed — the live trending sorted set (`ZREVRANGE` for top-N tickers in O(log N)), per-ticker hype score with a 10-minute TTL, and a pub/sub channel that decouples the alert threshold checker from the Resend email dispatcher. The API reads Redis first and falls back to PostgreSQL only on a cache miss.

**Rate limit enforcement at the infrastructure layer**

Both the Reddit API (60 req/min free tier) and Finnhub API (60 req/min free tier) impose hard request limits. Rather than handling this with try/catch and backoff, each ingestion job checks a Redis sliding window counter before making any external call — `INCR ratelimit:reddit; EXPIRE ratelimit:reddit 60`. If the counter exceeds 55 the job waits. No 429s, no data gaps.

**Alert deduplication via database timestamp**

Once an alert fires, `last_triggered_at` is stamped on the `Alert` row. The threshold checker (`@Scheduled` every 2 minutes) skips any alert where `last_triggered_at` is within the past 4 hours. A ticker sitting above threshold indefinitely sends exactly one email per 4-hour window — not one per cycle.

**Market-hours awareness in the scheduler**

The Finnhub client only hits quote and candle endpoints during US market hours (09:30–16:00 ET, Monday–Friday). Outside those windows the job skips financial data fetching entirely. News and sentiment endpoints still run on their normal schedule since they're not time-bound.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend API** | Java 21 + Spring Boot 3 | Enterprise-grade, strong JPA/WebSocket support |
| **Frontend** | Next.js 15 + TypeScript + Tailwind | SSR for initial load, client components for live updates |
| **Primary DB** | PostgreSQL | Relational integrity, time-series indexing |
| **Cache / Pub-Sub** | Redis (Upstash) | Sub-ms reads, sorted sets, pub/sub for alerts |
| **Charts** | Recharts | Dual-axis hype vs price chart |
| **Real-time** | Spring WebSocket (STOMP) | Push hype score updates without client polling |
| **Auth** | Spring Security + JWT | Stateless, standard |
| **Email** | Resend | Simple API, reliable delivery |
| **Data Sources** | Reddit API, Finnhub API, Reuters RSS, CNBC RSS | Free tier, no approval gates |
| **Deployment** | Vercel (frontend) + Railway (backend) | Fast, zero-config |

---

## Project Structure

```
HypeRadar/
├── backend/src/main/java/com/hyperadar/
│   ├── controller/       # REST endpoints + WebSocket
│   ├── service/
│   │   ├── ingestion/    # Reddit, Finnhub, RSS pollers
│   │   ├── processing/   # Sentiment analysis, hype scoring, B/B classification
│   │   └── alert/        # Threshold checker, email dispatcher
│   ├── scheduler/        # @Scheduled pipeline orchestration
│   ├── repository/       # JPA data access
│   ├── model/            # JPA entities
│   ├── dto/              # API request/response shapes
│   └── config/           # Redis, WebSocket, Security
└── frontend/src/
    ├── app/
    │   ├── dashboard/    # Live trending tickers
    │   ├── ticker/[symbol]/ # Deep dive + hype vs price chart
    │   ├── alerts/       # Alert management
    │   └── history/      # Historical meme stock events
    └── components/
        ├── dashboard/
        ├── ticker/
        └── ui/
```

---

## Getting Started

**Prerequisites:** Java 21, Node.js 20+, PostgreSQL, Redis (or Upstash URL)

```bash
# Clone and set up backend
git clone https://github.com/sbhat72/HypeRadar.git
cd HypeRadar/backend
cp .env.example .env          # fill in API keys
./mvnw spring-boot:run

# Set up frontend
cd ../frontend
cp .env.local.example .env.local
npm install && npm run dev
```

**Required environment variables:**

```
DATABASE_URL          # PostgreSQL connection string
REDIS_URL             # Upstash or local Redis URL
JWT_SECRET            # 256-bit secret
FINNHUB_API_KEY       # finnhub.io free tier
REDDIT_CLIENT_ID      # Reddit app credentials
REDDIT_CLIENT_SECRET
RESEND_API_KEY        # resend.com free tier
```

---

> Built with Java 21 + Spring Boot 3 to align with Toronto's enterprise backend ecosystem.
