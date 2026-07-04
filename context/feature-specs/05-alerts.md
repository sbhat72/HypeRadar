Read `AGENTS.md` before starting.

# Feature: Alerts

## What To Build

Authenticated users can set hype score threshold alerts for any ticker. When a ticker's hype score crosses the threshold, the user receives an email notification. Alerts are managed from `/alerts` — users can create new alerts, view active alerts, and delete them.

The backend alert endpoint is not connected yet. Persist alerts in `localStorage` keyed to the Clerk user ID, same pattern as the watchlist. The email field is auto-filled from the Clerk authenticated user's email and is read-only.

Add **Alerts** as a third link in the navigation bar alongside Dashboard and Watchlist.

## Navigation Bar Update

Update the global nav to include three links:
- `Dashboard` — `/hyped-stocks`
- `Watchlist` — `/watchlist`
- `Alerts` — `/alerts`

Active link highlighted with green underline. All other nav behaviour stays the same as implemented in `04-watchlist.md`.

## Create Alert Form

Display a form at the top of the `/alerts` page for creating a new alert. It contains:

**Ticker input**
- Text input where the user types a ticker symbol (e.g. `TSLA`)
- Validate that the input is uppercase letters only, 1–5 characters
- Show a subtle error message if the input is invalid on submit

**Hype threshold slider**
- A range slider from 0 to 100
- Display the current value prominently next to the slider (e.g. `Threshold: 72`)
- Default starting value: 70
- Color the slider track green below the thumb and red above it to indicate "alert fires when hype exceeds this value"

**Email field**
- Auto-filled with the Clerk authenticated user's email using `useUser()` from `@clerk/nextjs`
- Read-only — the user cannot change it
- Display it greyed out to make it clear it is not editable

**Submit button**
- Label: **Set Alert**
- On click, saves the alert to localStorage and adds it to the active alerts list below
- Show a brief success toast notification: `"Alert set for {TICKER} at hype score {threshold}"`

## Active Alerts List

Below the form, display all active alerts as cards. Each card shows:

- Ticker symbol — bold, large
- Threshold value — e.g. `Hype score ≥ 72`
- Email the alert will be sent to
- Status badge — **Active** in green
- A **Delete** button (trash icon) that removes the alert from localStorage immediately

If there are no active alerts, show an empty state: **"No active alerts. Set one above to get notified when a stock crosses your hype threshold."**

## Triggered Alerts History

Below the active alerts, display a **Triggered Alerts** section showing a log of past alerts that have fired. Use mock data for this section — 3–4 example triggered alerts showing:

- Ticker symbol
- The threshold that was crossed
- The hype score at the time it fired (e.g. `Fired at hype score 84`)
- Date and time it triggered
- Status badge — **Triggered** in orange (`#FF990A`)

## Design

Follow `ui-context.md` for all color tokens. Same dark terminal aesthetic as all other pages.

- Background: `--bg-base` (#080809)
- Form sits on `--bg-surface` (#111114) with `--border-default` border, `rounded-2xl`, comfortable padding
- Active alert cards on `--bg-elevated` (#18181c), `rounded-2xl`
- Triggered alert history cards on `--bg-subtle` (#1e1e23), `rounded-xl`
- Section headers (**Active Alerts**, **Triggered Alerts**) use `--text-primary` with `--border-default` divider below
- Slider thumb and active track use green (`#62C073`)
- Delete button muted by default, red (`#FF6166`) on hover
- Success toast appears bottom-right, dark background, green left border, auto-dismisses after 3 seconds

## Routes

- `/alerts` — protected, requires Clerk auth. Loads alerts from localStorage for the current Clerk user ID
- Unauthenticated users redirect to `/sign-in`

## Check When Done

- [ ] Alerts link added to the navigation bar and highlights correctly when on `/alerts`
- [ ] Create alert form renders with ticker input, threshold slider, and read-only email field
- [ ] Email field is auto-filled from Clerk authenticated user email
- [ ] Ticker input validates uppercase letters only, 1–5 characters
- [ ] Submitting the form saves the alert to localStorage and adds it to the active alerts list
- [ ] Success toast appears after creating an alert and auto-dismisses
- [ ] Active alerts list renders all saved alerts with ticker, threshold, email, and status badge
- [ ] Delete button removes the alert from localStorage and the card disappears immediately
- [ ] Empty state renders correctly when there are no active alerts
- [ ] Triggered alerts history section renders with mock data
- [ ] Page compiles and runs without errors from `npm run dev`