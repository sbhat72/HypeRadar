Read `AGENTS.md` before starting.

# Feature: Frontend API Wiring

## What To Build

Replace all hardcoded mock data and localStorage calls in the frontend with real API calls to the Spring Boot backend. The `apiFetch` utility created in `10-clerk-backend.md` is server-side only. Most HypeRadar pages are Client Components — they need a client-side API hook instead.

---

## Step 1: Create a Client-Side API Hook

Create `src/lib/api-client.ts`. This is the client-side equivalent of `apiFetch` for use inside Client Components:

```ts
import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export function useApiClient() {
  const { getToken } = useAuth()

  const apiCall = useCallback(async (path: string, options?: RequestInit) => {
    const token = await getToken()
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
    })
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    return response.json()
  }, [getToken])

  return { apiCall }
}
```

All four pages use this hook. Import it wherever mock data or localStorage was used.

---

## Step 2: Dashboard (`/hyped-stocks`)

### What changes
Replace the `MOCK_TICKERS` import with a real API call to `GET /api/tickers/trending`.

### Data shape coming from the API
```ts
interface TrendingTicker {
  symbol: string
  score: number
  redditScore: number
  newsScore: number
  volumeScore: number
  priceScore: number
  verdict: string
  priceChange: number
  changePercent: number
  mentionCount: number
}
```

### Implementation

- Convert the dashboard page to a Client Component (`"use client"`)
- On mount (`useEffect`), call `GET /api/tickers/trending?limit=20`
- Store the result in a `tickers` state variable
- Show a loading skeleton (3–4 placeholder cards) while fetching
- Show an error message if the fetch fails with a retry button
- Pass the API data into `TrendingTickerCard` — the component already accepts `symbol`, `price`, `change`, `changePercent`, `mentions` and `hypeScore` so map the API fields accordingly:
  - `score` → `hypeScore`
  - `priceChange` → `change`
  - `mentionCount` → `mentions`
  - `currentPrice` — not in `TrendingTickerDto` yet; use `priceChange` as a visual indicator for now
- Keep the `setInterval` price simulation running on top of the fetched data — it nudges prices for the flash animation. Re-seed it with real prices when the API responds
- Keep the time period filter tabs (1H/1D/1W/1M) — they currently only change visual state. Leave them as-is for now; filtering by time period requires a backend change that comes later

---

## Step 3: Ticker Deep Dive (`/hyped-stocks/[ticker]`)

### What changes
Replace the mock hype score, mock verdict, and mock source cards with real data from `GET /api/hype/{ticker}`.

### Data shape coming from the API
```ts
interface HypeBreakdown {
  symbol: string
  currentScore: number
  redditScore: number
  newsScore: number
  volumeScore: number
  priceScore: number
  verdict: 'HYPE_CONFIRMED' | 'PURE_HYPE' | 'HIDDEN_MOMENTUM' | 'BEARISH_CONFIRMATION'
  currentPrice: number
  priceChange: number
  changePercent: number
  scoreHistory: { timestamp: string; score: number }[]
  sources: { source: string; content: string; polarity: string }[]
}
```

### Implementation

- On mount, call `GET /api/hype/{ticker}` where `ticker` comes from the URL params
- Show a loading state while fetching
- If the API returns 404 (ticker not found in the database yet), display: **"No hype data found for {ticker} yet. Check back after the next pipeline cycle."**
- Replace mock hype score with `currentScore`
- Replace mock sub-signal values with `redditScore`, `newsScore`, `volumeScore`, `priceScore`
- Replace mock verdict with the `verdict` field. Map the enum values to display labels:
  - `HYPE_CONFIRMED` → "Hype Confirmed" (green)
  - `PURE_HYPE` → "Pure Hype" (orange)
  - `HIDDEN_MOMENTUM` → "Hidden Momentum" (blue)
  - `BEARISH_CONFIRMATION` → "Bearish Confirmation" (red)
- Replace mock source cards with the `sources` array from the API. Each source has `source`, `content`, and `polarity` — map directly to the existing source card component
- If `sources` is empty, show: **"No sources found for this ticker in the last 24 hours."**
- The Yahoo Finance price chart stays exactly as-is — do not change it
- The financial summary row (current price, 52-week high/low, volume) also stays as-is — it comes from Yahoo Finance

### Watchlist button

The watchlist button currently writes to localStorage. Replace with API calls:

- On mount, call `GET /api/watchlist` to check if this ticker is already watchlisted. Set button state to "Added" if the ticker appears in the response
- On "Add to Watchlist" click: call `POST /api/watchlist/{ticker}`
- On "Remove" click: call `DELETE /api/watchlist/{ticker}`
- Keep the toggle visual state — just back it with the real API instead of localStorage

---

## Step 4: Alerts (`/alerts`)

### What changes
Replace all localStorage reads and writes with API calls.

### Implementation

**Loading alerts on mount:**
```
GET /api/alerts
```
Replace `getAlerts()` from `src/lib/alerts.ts` with this call. Store the result in `alerts` state.

**Creating an alert:**
```
POST /api/alerts
Body: { tickerSymbol: string, threshold: number }
```
Replace `addAlert()` with this call. On success, refetch the alerts list. On 400 (duplicate or invalid ticker), show an inline error message below the form: **"An active alert already exists for {ticker}"** or **"Ticker not found"**.

**Deleting an alert:**
```
DELETE /api/alerts/{id}
```
Replace `removeAlert()` with this call using the alert's `id` from the API response. On success, remove the card from state immediately without refetching.

**AlertResponseDto shape:**
```ts
interface AlertResponse {
  id: number
  tickerSymbol: string
  threshold: number
  notificationType: string
  createdAt: string
  lastTriggeredAt: string | null
}
```

The email field in the form stays as-is — still read from `useUser()` from Clerk. The email is not sent to the API (the backend knows who the user is from the JWT).

The triggered alerts history section stays as mock data — real triggered history requires the alert email service which is implemented in a later spec.

---

## Step 5: Watchlist (`/watchlist`)

### What changes
Replace localStorage reads with API calls for the stock list. Keep the summary calculations client-side.

### Implementation

**Loading watchlist on mount:**
```
GET /api/watchlist
```
Returns `WatchlistItemDto[]`:
```ts
interface WatchlistItem {
  id: number
  tickerSymbol: string
  addedAt: string
}
```

**Removing from watchlist:**
```
DELETE /api/watchlist/{ticker}
```
On success, remove the item from local state immediately.

**Summary calculations:**
The API only returns the ticker symbols — not price or hype data. To compute the combined +/-, total mentions, and aggregate hype score, call `GET /api/tickers/trending` after loading the watchlist and filter the trending results to only the watchlisted symbols. If a watchlisted ticker is not in the trending results (no hype data yet), exclude it from the summary calculation and show it as a card without score data.

**Watchlist News section:**
Keep mock news data for now — real news filtering per user watchlist requires a dedicated endpoint that does not exist yet.

---

## Step 6: Delete src/lib/alerts.ts and src/lib/watchlist.ts

Once the API calls are in place and tested, delete these two localStorage helper files. They are no longer needed. Remove any remaining imports of them across the codebase.

Do not delete `src/lib/mock-tickers.ts` yet — it is still used by the watchlist page for price data when a ticker is not in the trending API results.

---

## Error Handling Conventions

Apply these consistently across all four pages:

- **Loading state** — show skeleton placeholder cards (same dimensions as real cards, `--bg-elevated` background, subtle pulse animation)
- **API error** — show a centered error message with a **Retry** button that re-triggers the fetch
- **Empty state** — show the existing empty state UI already implemented on each page
- **404 from API** — show a specific "not found" message rather than a generic error

---

## Check When Done

- [ ] `src/lib/api-client.ts` created with `useApiClient` hook
- [ ] Dashboard fetches real tickers from `GET /api/tickers/trending` on mount
- [ ] Dashboard shows loading skeleton while fetching and error state on failure
- [ ] Deep dive fetches real hype data from `GET /api/hype/{ticker}` on mount
- [ ] Deep dive shows correct verdict label and color from API enum value
- [ ] Deep dive shows real source cards from API — not mock cards
- [ ] Deep dive watchlist button calls `POST` and `DELETE /api/watchlist/{ticker}`
- [ ] Alerts page loads active alerts from `GET /api/alerts`
- [ ] Creating an alert calls `POST /api/alerts` and handles 400 errors inline
- [ ] Deleting an alert calls `DELETE /api/alerts/{id}`
- [ ] Watchlist page loads items from `GET /api/watchlist`
- [ ] Watchlist remove button calls `DELETE /api/watchlist/{ticker}`
- [ ] Watchlist summary pulls from trending API and filters to watchlisted tickers
- [ ] `src/lib/alerts.ts` and `src/lib/watchlist.ts` deleted
- [ ] No remaining references to `MOCK_TICKERS` on the dashboard
- [ ] All pages compile and run without errors from `npm run dev`