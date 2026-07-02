Read `AGENTS.md` before starting.

# Feature: Live Hyped Stocks Dashboard

## What To Build

Build the main dashboard page at `/hyped-stocks`. This is where the user lands after successfully authenticating via Clerk. It displays the top 10–20 most hyped stocks with live price effects and essential ticker info. Clicking any ticker card navigates to `/hyped-stocks/{ticker}`.

## Placeholder Data

The backend pipeline is not connected yet. Use hardcoded mock data for this implementation — an array of 15–20 ticker objects with the following shape:

```ts
{
  symbol: string        // e.g. "TSLA"
  price: number         // e.g. 245.80
  change: number        // e.g. +3.24 or -1.87
  changePercent: number // e.g. +1.34 or -0.75
  mentions: number      // e.g. 1482
  hypeScore: number     // 0–100
}
```

Include a realistic spread — some tickers up, some down, varying mention counts.

## Design

The page must feel like a premium stock market terminal, not a generic SaaS product. Use the color tokens from `ui-context.md` as the base with red and green as primary accents.

- Background: `--bg-base` (#080809) — near black
- Page header: display **Live Hyped Stocks** prominently at the top. Style `Live` in red (`#FF6166`) and `Stocks` in green (`#62C073`). Bold, large, terminal-weight font
- Include a **pulsing red dot** (CSS animation, like a live recording indicator) next to the header to signal real-time data
- Overall vibe: Bloomberg terminal, not Airbnb. Dark, data-dense, purposeful

### Time Period Filter

Directly below the header, display four filter tabs: **1H · 1D · 1W · 1M** (hour, day, week, month). Active tab is highlighted with a green underline or background. Clicking a tab does not need to change data yet — just update the active visual state.

### Ticker Cards

Display tickers in a responsive grid. Each card shows:

- **Ticker symbol** — large, bold, primary text
- **Price** — current price in dollars
- **Change** — the +/- amount and percentage, colored green if positive, red if negative
- **Mention count** — number of social mentions (e.g. "1,482 mentions")
- **Heat indicator** — a 5-bar signal-strength style indicator. Color shifts from cool blue (#52A8FF) at low mentions through yellow (#FF990A) to hot red (#FF6166) at high mentions. Intensity is based on the ticker's mention count relative to the max in the list

### Price Flash Effect

When the price of a ticker "changes" (simulate this with a setInterval that randomly nudges prices every few seconds), the price value should briefly flash:
- Green background flash if price went up
- Red background flash if price went down

The flash should fade out over ~600ms. This simulates the live update effect we will wire to WebSocket in a future feature.

### Deep Dive Route

Clicking any ticker card navigates to `/hyped-stocks/{ticker}`. That page does not exist yet — render a simple **"Deep dive coming soon"** placeholder page at that route so navigation does not break.

## Routes

- `/hyped-stocks` — dashboard, protected, requires Clerk auth
- `/hyped-stocks/{ticker}` — placeholder "coming soon" page, protected
- Unauthenticated users hitting either route redirect to `/sign-in`

## Check When Done

- [ ] `/hyped-stocks` loads after Clerk login without errors
- [ ] Header displays **Live Hyped Stocks** with red/green word styling and a pulsing live dot
- [ ] Time period filter tabs (1H / 1D / 1W / 1M) render and toggle active state on click
- [ ] 15–20 ticker cards render in a responsive grid with symbol, price, change, mention count, and heat indicator
- [ ] Heat indicator reflects mention intensity with the correct color shift
- [ ] Price flash effect triggers on simulated price changes (green flash up, red flash down)
- [ ] Clicking a ticker navigates to `/hyped-stocks/{ticker}` and shows the coming soon placeholder
- [ ] Unauthenticated users are redirected to `/sign-in`
- [ ] Page compiles and runs without errors from `npm run dev`