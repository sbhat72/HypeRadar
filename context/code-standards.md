## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries defined in `project-overview.md`.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any`; use explicit interfaces or narrowly scoped types.
- Validate unknown external input at system boundaries before trusting it.
- Use `interface` for object contracts.

## Next.js

- Default to React Server Components.
- Add `"use client"` only when the component needs browser interactivity, hooks, or real-time state.
- Keep route handlers focused on a single responsibility.
- Long-running work belongs in background tasks, not in request handlers.

## Styling

- Use CSS custom property tokens defined in `globals.css` — no raw Tailwind color classes like `zinc-*` or hardcoded hex values.
- Reference tokens through their Tailwind utility names: `bg-base`, `text-copy-primary`, `border-surface-border`, `text-brand`, etc.
- Maintain the border radius scale: `rounded-xl` for small elements, `rounded-2xl` for cards, `rounded-3xl` for modals.

## API Routes

- Validate and parse request input before any logic runs.
- Enforce auth and project ownership checks before any mutation.
- Return consistent, predictable response shapes.
- Keep route handlers thin — push complexity into shared modules or background tasks.

## Data and Storage

- Relational data — tickers, hype scores, sentiment events, alerts, watchlist items — belongs in PostgreSQL via Spring Boot JPA.
- Real-time and frequently read data belongs in Redis via `RedisCacheService` — never access `RedisTemplate` directly outside that class.
- Do not store large generated content directly in the database — sentiment event content is stored as a truncated text snippet only.
- All Redis operations go through `RedisCacheService` — rate limit counters, trending sorted set, hype score cache, and alert pub/sub are all centralised there.
- User identity is represented by Clerk's `userId` string — there is no `User` table. Store `clerkUserId` as a plain string on `Alert` and `WatchlistItem` entities.
