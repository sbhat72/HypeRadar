Read `AGENTS.md` before starting.

# Feature: Deep Dive into Selected Stocks

## What To Build

Build the deep dive analytics page at `/hyped-stocks/{ticker}`. This is reached when a user clicks a ticker card on the dashboard. It displays a full price chart, hype score breakdown with sub-signals, bullish/bearish verdict, source evidence, and a personal watchlist button.

The backend is not connected yet. Use mock/placeholder data for hype scores, verdict, and sources. The price chart pulls real data from the Yahoo Finance API.

## Price Chart

- Install `lightweight-charts` from TradingView — this is the charting library to use
- Render an area chart (not candlestick) showing closing price over the selected time range
- Time range selector tabs directly above the chart: **1D · 1W · 1M · 1Y**
- Each tab maps to a Yahoo Finance API call:

| Tab | interval | range |
|---|---|---|
| 1D | 5m | 1d |
| 1W | 1h | 5d |
| 1M | 1d | 1mo |
| 1Y | 1wk | 1y |

- API URL: `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval={interval}&range={range}`
- Extract timestamps and closing prices from `chart.result[0].timestamp` and `chart.result[0].indicators.quote[0].close`
- All price figures displayed in USD with the `$` symbol
- When the user switches time range tabs, reload the chart with the new interval and range
- Show a loading state while the chart data is fetching

## Financial Summary

Display a row of key stats directly below the chart:

- **Current price** — pulled from the Yahoo Finance response meta field `regularMarketPrice`
- **52-week high** — `fiftyTwoWeekHigh` from the meta field
- **52-week low** — `fiftyTwoWeekLow` from the meta field
- **Market volume** — `regularMarketVolume` from the meta field
- All values in USD where applicable

## Hype Score Breakdown

Use mock data for this section. Display the overall hype score (0–100) prominently, then break it down into four sub-signals shown as individual progress bars or stat cards:

- **Reddit Velocity** — mock value e.g. 78/100
- **News Sentiment** — mock value e.g. 65/100
- **Volume Spike** — mock value e.g. 82/100
- **52-Week Position** — mock value e.g. 54/100

Each sub-signal card should show the name, score, and a visual bar filled proportionally. Use green (`#62C073`) for scores above 60, yellow (`#FF990A`) for 40–60, red (`#FF6166`) below 40.

## Bullish / Bearish Verdict

Display one of four verdict badges using mock data. Each verdict has a label, color, and explanation:

| Verdict | Color | Explanation |
|---|---|---|
| Hype Confirmed | Green | Social momentum is being validated by price action |
| Pure Hype | Yellow/Orange | Social noise not yet reflected in price |
| Hidden Momentum | Blue | Price moving without social explanation |
| Bearish Confirmation | Red | Both signals pointing down |

Use **Pure Hype** as the mock verdict. Display the verdict label large and bold with its corresponding color, and the explanation text below it.

## Source Evidence

Display a list of 5–6 mock source cards below the verdict. Each card shows:

- Source label (REDDIT, REUTERS, CNBC, MARKETWATCH, or NASDAQ) as a colored badge
- Headline or post title as the main text
- A clickable link that opens the source in a new tab (use `#` as placeholder href for now)
- Polarity badge — POSITIVE in green, NEGATIVE in red, NEUTRAL in grey

## Watchlist Button

Display a prominent **+ Add to Watchlist** button on the page. Clicking it does nothing yet — just toggle the button state between **+ Add to Watchlist** and **✓ Added** with a green fill. The actual watchlist persistence is implemented in a future feature.

## Design

Follow `ui-context.md` for all color tokens. Same dark terminal aesthetic as the dashboard.

- Background: `--bg-base` (#080809)
- Page header: display the ticker symbol large and bold at the top (e.g. **TSLA**) with the full company name from the Yahoo Finance meta `longName` field in secondary text below it
- Section headers (Price Chart, Hype Score, Verdict, Sources) use `--text-secondary` with a subtle `--border-default` divider beneath each
- The overall layout scrolls vertically — chart at the top, hype breakdown below, verdict below that, sources at the bottom
- The watchlist button sits near the top of the page next to the ticker header

## Routes

- `/hyped-stocks/{ticker}` — protected, requires Clerk auth. Loads data based on the ticker in the URL. Reloads chart when time range tab changes.
- Unauthenticated users redirect to `/sign-in`

## Check When Done

- [ ] Navigating to `/hyped-stocks/TSLA` renders the page without errors
- [ ] Ticker symbol and company name display at the top from Yahoo Finance meta
- [ ] Price chart renders with real data from Yahoo Finance API
- [ ] Time range tabs (1D / 1W / 1M / 1Y) switch the chart data correctly
- [ ] Financial summary row shows current price, 52-week high/low, and volume
- [ ] Hype score and four sub-signal cards render with mock data and correct colors
- [ ] Bullish/bearish verdict badge renders with label and explanation
- [ ] Source evidence cards render with mock data, badges, and placeholder links
- [ ] Watchlist button toggles between added and not added state on click
- [ ] Page compiles and runs without errors from `npm run dev`