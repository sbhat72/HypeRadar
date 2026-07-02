Read `AGENTS.md` before starting.

# Feature: Login Page + Clerk Authentication

## What To Build

The login page at `/sign-in`. This is the entry point to HypeRadar — unauthenticated users are redirected here from any protected route. After successful login the user is redirected to `/hyped-stocks`.

## Clerk Setup

- Install `@clerk/nextjs`
- Wrap the root layout in `<ClerkProvider>`
- Use Clerk's `<SignIn />` component on the `/sign-in` page
- Use Clerk's `<SignUp />` component on the `/sign-up` page
- Protect all routes except `/sign-in` and `/sign-up` using Clerk's `clerkMiddleware` in `middleware.ts`
- After authentication redirect to `/hyped-stocks`

## Design

The page must feel like a premium stock market terminal, not a generic SaaS login. Use the color tokens from `ui-context.md` as the base, with red and green as the primary accent colors to reflect market movement.

- Background: `--bg-base` (#080809) — near black
- The `HypeRadar` name must be displayed prominently above the login form. Style it large and bold. Use a green accent (`#62C073`) on `Hype` and a red accent (`#FF6166`) on `Radar` — or experiment with a treatment that makes the name feel like a market signal
- The overall vibe is a dark trading terminal. Think Bloomberg, not Airbnb
- Subtle stock market visual elements are encouraged — a faint ticker tape, candlestick pattern in the background, or a pulsing chart line as a decorative element. Keep it tasteful, not cartoonish
- The Clerk `<SignIn />` component should be styled to match the dark theme — override Clerk's default appearance using the `appearance` prop with dark background and green/red accents on interactive elements

## Routes

- `/sign-in` — login page (public)
- `/sign-up` — register page (public)
- All other routes — protected, redirect to `/sign-in` if unauthenticated

## Check When Done

- [ ] `@clerk/nextjs` is installed and `ClerkProvider` wraps the root layout
- [ ] `middleware.ts` protects all routes except `/sign-in` and `/sign-up`
- [ ] Login page renders at `/sign-in` without errors
- [ ] `HypeRadar` name is displayed prominently above the form with red/green styling
- [ ] Clerk `<SignIn />` component is visible and functional
- [ ] Successful login redirects the user to `/hyped-stocks`
- [ ] Unauthenticated users hitting any protected route are redirected to `/sign-in`
- [ ] Page matches the dark stock market terminal aesthetic from `ui-context.md`
- [ ] Can be npm started on local host