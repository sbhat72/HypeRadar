Read `AGENTS.md` before starting.

# Feature: Historical Hype Events

## What To Build

Build the `/history` page — a curated timeline of the most famous meme stock and hype-driven market events. Each event shows what happened, when it happened, and a real price chart of that period pulled from Yahoo Finance. This page is fully static — no backend connection needed. All event data is hardcoded.

Add **History** as a fourth link in the global navigation bar.

## Navigation Bar Update

Update the global nav to include four links:
- `Dashboard` — `/hyped-stocks`
- `Watchlist` — `/watchlist`
- `Alerts` — `/alerts`
- `History` — `/history`

Active link highlighted with green underline. All other nav behaviour stays the same.

## Page Header

Display a prominent page header:
- Title: **Hype History** — style `Hype` in green (`#62C073`) and `History` in red (`#FF6166`)
- Subtitle in secondary text: `"The moments that moved markets. Powered by social momentum."`

## Curated Events

Hardcode the following six events. Each event has a fixed ticker, name, date range, description, and peak stat:

```ts
[
  {
    ticker: "GME",
    name: "The GameStop Short Squeeze",
    dateRange: "Jan 2021",
    period1: 1609459200,  // Unix timestamp Jan 1 2021
    period2: 1612137600,  // Unix timestamp Feb 1 2021
    description: "Reddit's r/wallstreetbets coordinated a historic short squeeze against hedge funds shorting GameStop. GME rose from $20 to nearly $500 in weeks.",
    peakPrice: "$483",
    peakGain: "+2,400%",
    tag: "Short Squeeze"
  },
  {
    ticker: "AMC",
    name: "AMC Entertainment Squeeze",
    dateRange: "May–Jun 2021",
    period1: 1619827200,  // May 1 2021
    period2: 1625097600,  // Jul 1 2021
    description: "AMC became the second major meme stock as retail traders piled in. The stock jumped from $10 to $72 at its peak driven entirely by social momentum.",
    peakPrice: "$72",
    peakGain: "+620%",
    tag: "Meme Stock"
  },
  {
    ticker: "NVDA",
    name: "NVIDIA AI Surge",
    dateRange: "May 2023",
    period1: 1682899200,  // May 1 2023
    period2: 1685577600,  // Jun 1 2023
    description: "After announcing blowout earnings driven by AI chip demand, NVIDIA saw a one-day gain of 24% — the largest single-day gain ever for a $700B company.",
    peakPrice: "$419",
    peakGain: "+24% in one day",
    tag: "Earnings Catalyst"
  },
  {
    ticker: "BBBY",
    name: "Bed Bath & Beyond Squeeze",
    dateRange: "Aug 2022",
    period1: 1659312000,  // Aug 1 2022
    period2: 1661990400,  // Sep 1 2022
    description: "BBBY surged 400% in two weeks fuelled by Reddit hype and a large position held by Ryan Cohen. The stock later collapsed as the hype faded.",
    peakPrice: "$30",
    peakGain: "+400%",
    tag: "Short Squeeze"
  },
  {
    ticker: "DOGE",
    name: "Dogecoin Elon Pump",
    dateRange: "Apr–May 2021",
    period1: 1617235200,  // Apr 1 2021
    period2: 1620864000,  // May 13 2021
    description: "A series of tweets from Elon Musk pushed Dogecoin from $0.06 to $0.74 — a 14x gain in weeks. A textbook example of social media-driven Pure Hype.",
    peakPrice: "$0.74",
    peakGain: "+14,000%",
    tag: "Social Media Pump"
  },
  {
    ticker: "GME",
    name: "Roaring Kitty Returns",
    dateRange: "May–Jun 2024",
    period1: 1714521600,  // May 1 2024
    period2: 1717200000,  // Jun 1 2024
    description: "Keith Gill (Roaring Kitty) returned to social media after three years and GME surged 200% in days. A reminder that social momentum can restart at any time.",
    peakPrice: "$64",
    peakGain: "+200%",
    tag: "Social Media Pump"
  }
]
```

## Event Cards Layout

Display events as a vertical timeline. Each event card contains:

- **Tag badge** — e.g. `Short Squeeze`, `Meme Stock`, `Earnings Catalyst` styled as a small pill using the appropriate accent color (Short Squeeze → red, Meme Stock → orange, Earnings Catalyst → green, Social Media Pump → purple)
- **Ticker symbol** — bold, large
- **Event name** — headline weight
- **Date range** — in secondary text
- **Description** — body text, `--text-secondary`
- **Peak stats row** — `Peak Price: $483` and `Peak Gain: +2,400%` shown side by side in green
- **View Chart button** — expands the chart inline below the card or navigates to the chart view

## Price Chart

When the user clicks **View Chart** on an event card:

- Fetch real historical price data from Yahoo Finance using the event's `period1` and `period2` Unix timestamps:
  ```
  https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&period1={period1}&period2={period2}
  ```
- Render an area chart using TradingView Lightweight Charts (same library as `03-ticker-deep-dive.md`)
- Add a vertical marker line at the peak price date with a label showing the peak gain
- The chart expands inline below the event card — no page navigation needed
- A **Close Chart** button collapses it back
- Show a loading state while the chart fetches

## Design

Follow `ui-context.md` for all color tokens. Same dark terminal aesthetic.

- Background: `--bg-base` (#080809)
- Event cards on `--bg-surface` (#111114) with `--border-default` border, `rounded-2xl`
- Chart container on `--bg-elevated` (#18181c), `rounded-2xl`, padding inside
- Tag badge colors:
  - Short Squeeze → red fill (`#3C1618`) with red text (`#FF6166`)
  - Meme Stock → orange fill (`#331B00`) with orange text (`#FF990A`)
  - Earnings Catalyst → green fill (`#0F2E18`) with green text (`#62C073`)
  - Social Media Pump → purple fill (`#2E1938`) with purple text (`#BF7AF0`)
- Timeline connector — a subtle vertical line on the left side of the page connecting the event cards
- Peak gain stat always renders in green (`#62C073`)

## Routes

- `/history` — protected, requires Clerk auth
- Unauthenticated users redirect to `/sign-in`

## Check When Done

- [ ] History link added to the global navigation bar and highlights correctly when on `/history`
- [ ] Page header renders with `Hype` in green and `History` in red
- [ ] All six event cards render with tag badge, ticker, name, date range, description, and peak stats
- [ ] Tag badges use the correct accent colors per tag type
- [ ] Clicking **View Chart** fetches real data from Yahoo Finance and renders the area chart inline
- [ ] Chart renders with a peak marker annotation
- [ ] **Close Chart** collapses the chart back
- [ ] Loading state shows while chart data is fetching
- [ ] Timeline vertical connector line renders on the left side
- [ ] Page compiles and runs without errors from `npm run dev`