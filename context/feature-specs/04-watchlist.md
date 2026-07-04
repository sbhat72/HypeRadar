Read `AGENTS.md` before starting.

# Feature: Watchlist

## What To Build

Authenticated users can add stocks to a personal watchlist from the `/hyped-stocks/{ticker}` deep dive page. The watchlist is accessible from the navigation bar at `/watchlist`. It shows all saved stocks, a combined performance summary, and a news feed filtered to watchlisted tickers only. Clicking any stock navigates to its deep dive page.

The backend is not connected yet. Persist the watchlist in `localStorage` keyed to the Clerk user ID so each user has their own watchlist that survives page refreshes without needing a database call. The `+ Add to Watchlist` button implemented in `03-ticker-deep-dive.md` should write to this localStorage key.

## Navigation Bar

Update the global navigation bar to include links to both main sections. The navbar appears on all protected pages:

- **Left** — `HypeRadar` name/logo linking to `/hyped-stocks`
- **Centre** — two nav links: `Dashboard` (`/hyped-stocks`) and `Watchlist` (`/watchlist`). Active link is highlighted with a green underline
- **Right** — Clerk `<UserButton />` component for profile and logout

## Watchlist Summary

Display a summary panel at the top of the `/watchlist` page before the stock list. It contains:

**Performance block:**
- Combined +/- dollar change and percentage across all watchlisted stocks for the selected time period
- Time period toggle: **1H · 1D · 1W · 1M · 1Y** — switching the tab recalculates the combined change using the mock price data already used in the dashboard. Positive combined value shows in green, negative in red

**Hype block:**
- Total mention count — sum of all mention counts across watchlisted stocks (mock data)
- Aggregate hype score — average hype score across watchlisted stocks (mock data)

## Watchlisted Stock Cards

Below the summary, display each watchlisted stock as a card showing:

- Ticker symbol — bold, large
- Current price in USD
- +/- change and percentage, green if positive, red if negative
- Mention count
- Heat indicator (same component as the dashboard)
- A **Remove** button (trash icon or × ) that removes the stock from the watchlist immediately without confirmation
- Clicking anywhere on the card (except the remove button) navigates to `/hyped-stocks/{ticker}` with a smooth page transition

## News Section

Below the stock cards, display a **Watchlist News** section showing recent news headlines filtered to only the tickers in the user's watchlist. Use mock news data for now — 2–3 headlines per watchlisted ticker.

Each news card shows:
- Source badge (REUTERS, CNBC, MARKETWATCH, or NASDAQ) in the appropriate accent color
- Headline text
- Ticker it relates to as a small tag
- Polarity badge — POSITIVE in green, NEGATIVE in red, NEUTRAL in grey
- A clickable link that opens the article in a new tab (use `#` as placeholder href for now)

If the watchlist is empty, display an empty state message: **"No stocks in your watchlist yet. Head to the dashboard to add some."** with a button linking to `/hyped-stocks`.

## Design

Follow `ui-context.md` for all color tokens. Same dark terminal aesthetic as the dashboard and deep dive pages.

- Background: `--bg-base` (#080809)
- Summary panel sits on `--bg-surface` (#111114) with a `--border-default` border, `rounded-2xl`
- Stock cards on `--bg-elevated` (#18181c) with `--border-default` border, `rounded-2xl`
- News cards on `--bg-subtle` (#1e1e23) with `--border-subtle` border, `rounded-xl`
- Section headers (**Your Watchlist**, **Watchlist News**) use `--text-primary` with a `--border-default` divider below
- Remove button uses a muted red (`#FF6166`) on hover only — default state is `--text-muted` so it is not distracting
- Page transition to `/hyped-stocks/{ticker}` uses a subtle fade or slide — use Next.js default transition or a simple opacity animation

## Routes

- `/watchlist` — protected, requires Clerk auth. Loads watchlist from localStorage for the current Clerk user ID
- `/hyped-stocks/{ticker}` — navigated to when user clicks a stock card from the watchlist
- Unauthenticated users redirect to `/sign-in`

## Check When Done

- [ ] Navigation bar renders on all protected pages with Dashboard, Watchlist links and Clerk UserButton
- [ ] Active nav link is highlighted correctly on both `/hyped-stocks` and `/watchlist`
- [ ] `+ Add to Watchlist` button on the deep dive page persists the ticker to localStorage under the Clerk user ID
- [ ] `/watchlist` loads and displays all stocks previously added via the deep dive page
- [ ] Summary panel shows combined +/-, total mentions, and aggregate hype score
- [ ] Time period toggle on the summary recalculates combined +/- correctly
- [ ] Each stock card shows ticker, price, change, mentions, and heat indicator
- [ ] Remove button deletes the stock from the watchlist and the card disappears immediately
- [ ] Clicking a stock card navigates to `/hyped-stocks/{ticker}` with a smooth transition
- [ ] Watchlist News section renders mock news cards filtered to watchlisted tickers
- [ ] Empty state renders correctly when the watchlist has no stocks
- [ ] Page compiles and runs without errors from `npm run dev`