Read `AGENTS.md` before starting.

# Fix: Null Guards in TrendingTickerCard

## Problem

`TrendingTickerCard` crashes with `Cannot read properties of null
(reading 'toFixed')` when the API returns tickers that have null
price data. This happens because Alpha Vantage's free tier (25
requests/day) cannot fetch a live quote for every ticker in the
database, so `price`, `priceChange`, and `changePercent` arrive as
null from the backend.

## What To Fix

In `src/components/ui/TrendingTickerCard.tsx`, find every call to
`.toFixed()` and wrap it with a null guard using optional chaining
and nullish coalescing. Also guard any other numeric operations
(comparisons, arithmetic) on these fields.

### Pattern to apply everywhere

```tsx
// Before — crashes when value is null:
{value.toFixed(2)}

// After — shows '--' when value is null:
{value?.toFixed(2) ?? '--'}
```

### Specific fields to guard

Apply null guards to ALL of the following wherever they appear in
the component:

**Price display:**
```tsx
// Before:
{price.toFixed(2)}
// After:
{price?.toFixed(2) ?? '--'}
```

**Price change:**
```tsx
// Before:
{priceChange.toFixed(2)}
// After:
{priceChange?.toFixed(2) ?? '--'}
```

**Change percent:**
```tsx
// Before:
{changePercent.toFixed(2)}
// After:
{changePercent?.toFixed(2) ?? '--'}
```

**Hype score:**
```tsx
// Before:
{score.toFixed(1)}
// After:
{score?.toFixed(1) ?? '--'}
```

**Any conditional or comparison using these values:**
```tsx
// Before:
{priceChange >= 0 ? '+' : '-'}
// After:
{(priceChange ?? 0) >= 0 ? '+' : '-'}
```

**Any arithmetic using these values:**
```tsx
// Before:
const barHeight = (score / 100) * maxHeight
// After:
const barHeight = ((score ?? 0) / 100) * maxHeight
```

**CSS class conditionals based on price direction:**
```tsx
// Before:
className={priceChange >= 0 ? 'text-green' : 'text-red'}
// After:
className={(priceChange ?? 0) >= 0 ? 'text-green' : 'text-red'}
```

## Scope

Only change `TrendingTickerCard.tsx`. Do not change any other files.
Apply the fix to every numeric field that could be null — do not
leave any unguarded `.toFixed()` calls in the file.

## Check When Done

- [ ] No `.toFixed()` calls remain without a null guard in
  `TrendingTickerCard.tsx`
- [ ] No numeric comparisons remain without a null guard
- [ ] Dashboard renders without crashing when price data is null
- [ ] Cards with null price data show `--` instead of a number
- [ ] Cards with real price data still display correctly
- [ ] No TypeScript errors in the file