# HypeRadar — Project Overview

HypeRadar is a web application that surfaces social momentum behind stocks and ETFs by aggregating opinion signals from Reddit's trading communities and financial news sources. It cross-references that social activity with real market data to tell investors whether a ticker's hype is backed by genuine financial movement — or whether it's noise.

---

## Goals

1. Give retail investors a real-time signal on which stocks have the highest social momentum across Reddit, financial news, and trading communities
2. Help users distinguish between genuine price-moving hype and empty noise through market data validation
3. Provide full transparency into the sources and evidence driving a stock's hype score
4. Enable personalised stock tracking through a user-managed watchlist with combined performance insights

---

## Core User Flow

1. User lands on the app and signs in via Clerk
2. User is redirected to `/hyped-stocks` — the main dashboard showing the top 10–20 most talked about stocks. Each card displays minimal information: ticker symbol, price change (+/-), total mention count, and a heat indicator that scales in intensity and color (cool blue → yellow → red) with mention frequency. Stocks are filterable by time period: hour, day, week, and month
3. User clicks a ticker card they are interested in and lands on the ticker deep dive page
4. The deep dive page shows the full price chart, volume, 52-week high and low, and 7-day and 30-day price movement
5. User scrolls down to see the hype score breakdown and bullish/bearish verdict. Scrolling further reveals the sources — Reddit posts and news headlines that drove the hype score for this ticker. Each source is a clickable link that takes the user to the original conversation or article
6. User adds the ticker to their personal watchlist via a button on the deep dive page
7. User navigates to `/watchlist` and sees all their added stocks listed. A live summary at the top of the page shows the combined performance of the watchlist — total hype mentions, aggregate hype score, and combined price movement (+/-)
8. User can remove any stock from their watchlist

---

## Features

### Auth
- Authentication handled entirely by Clerk — no custom auth implementation
- Frontend uses @clerk/nextjs with pre-built SignIn and SignUp components
- Backend verifies Clerk-issued JWTs using Clerk's public JWKS endpoint
- All routes except the login and register pages require a valid Clerk session
- User identity across the app is represented by Clerk's userId string — stored on Alert and WatchlistItem entities instead of a User foreign key

### Live Dashboard
- Displays the top 10–20 most talked about stocks ranked by hype score
- Filterable by time period: past hour, day, week, and month
- Each ticker card shows ticker symbol, price change (+/-), mention count, and a heat indicator that shifts from cool blue to red as mention frequency increases
- Updates in real time via WebSocket — no manual refresh needed
- Requires authentication to access

### Ticker Deep Dive
- Full price chart with volume, 52-week high/low, and price movement (7d and 30d)
- Complete hype score breakdown showing all four sub-signals
- Bullish/bearish verdict with explanation (Hype Confirmed, Pure Hype, Hidden Momentum, Bearish Confirmation)
- Source evidence — Reddit posts and news headlines driving the hype, each linking to the original conversation or article
- Button to add the ticker to the user's personal watchlist

### Watchlist
- Authenticated users can add and remove stocks from a personal watchlist
- Live summary at the top of the watchlist page showing combined +/-, total hype mentions, and aggregate hype score across all tracked stocks
- Each watchlist item shows the individual ticker's current status

### Alerts
- Users set a hype score threshold for any ticker
- Email notification fires when the threshold is crossed
- 4-hour deduplication window prevents repeated alerts for the same crossing event
- Users can manage and delete active alerts

### History
- Curated timeline of notable meme stock moments (GME, AMC, NVDA)
- Hype score replay showing how the signal looked during each event
- Annotated chart with event markers

### Data Sources
- Reddit public JSON endpoints — wallstreetbets, stocks, investing (no credentials required)
- Financial news RSS feeds — Reuters, CNBC, MarketWatch, Nasdaq (free, no auth)
- StockTwits public API — finance-specific social signal, free with signup, no approval needed
- Alpha Vantage — market data, price, volume, 52-week range (free tier, instant signup)

---

## Scope

### In Scope
- Clerk authentication
- Live dashboard with heat indicator, top 10–20 tickers, and time period filters
- Ticker deep dive with price chart, hype score breakdown, bullish/bearish verdict, and clickable sources
- Personal watchlist with combined live performance summary
- Email alerts with hype threshold and 4-hour deduplication
- History tab with curated meme stock events and hype replay
- Full backend pipeline — Reddit and RSS ingestion, sentiment analysis, hype scoring, and bullish/bearish classification
- Real-time WebSocket updates on the dashboard

### Out of Scope
- Mobile app
- Buy/sell recommendations (regulated financial advice territory — out of scope entirely)
- Real dollar portfolio tracking
- Push notifications — email alerts only
- International markets — US-listed stocks only for V1
- Admin dashboard
- Paid or premium tier

---

## Success Criteria

1. A user can register and sign in via Clerk and is correctly redirected to the dashboard — unauthenticated users cannot access any protected route
2. The dashboard displays the top 10–20 most hyped stocks with accurate price data and +/- movement reflecting the selected time frame (hour, day, week, month)
3. The heat indicator on each ticker card accurately reflects the volume of social mentions — tickers with more mentions display a visibly more intense indicator
4. Clicking a ticker opens the deep dive page showing the full price chart, volume, 52-week range, hype score breakdown, bullish/bearish verdict, and the sources that drove the hype — each source is a working link to the original conversation or article
5. A user can add a ticker to their watchlist from the deep dive page and it appears immediately on the watchlist page — deleting a stock from the watchlist removes it instantly
6. The watchlist summary at the top of the watchlist page accurately reflects the combined hype score, total mentions, and aggregate price movement across all tracked stocks in real time
