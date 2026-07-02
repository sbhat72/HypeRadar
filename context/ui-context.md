# UI Context

Dark only. No light mode. The visual language is a dark technical workspace — near-black backgrounds, layered surfaces, and vivid accent colors for interactive elements.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes like `zinc-*`.

## Color Tokens

| Role | CSS Variable | Hex / Value |
|---|---|---|
| Page background | `--bg-base` | #080809 |
| Surface | `--bg-surface` | #111114 |
| Elevated surface | `--bg-elevated` | #18181c |
| Subtle surface | `--bg-subtle` | #1e1e23 |
| Default border | `--border-default` | #2a2a30 |
| Subtle border | `--border-subtle` | #3a3a42 |
| Primary text | `--text-primary` | #f0f0f4 |
| Secondary text | `--text-secondary` | #c0c0cc |
| Muted text | `--text-muted` | #808090 |
| Faint text | `--text-faint` | #505060 |

## Accent Colors

| Node fill | Text color | Character |
|---|---|---|
| #1F1F1F | #EDEDED | Neutral dark (default) |
| #10233D | #52A8FF | Blue |
| #2E1938 | #BF7AF0 | Purple |
| #331B00 | #FF990A | Orange |
| #3C1618 | #FF6166 | Red |
| #3A1726 | #F75F8F | Pink |
| #0F2E18 | #62C073 | Green |
| #062822 | #0AC7B4 | Teal |

Default node color: `#1F1F1F` with `#EDEDED` text.

## Typography

| Role | Font | CSS Variable |
|---|---|---|
| UI text | Geist Sans | `--font-geist-sans` |
| Code/mono | Geist Mono | `--font-geist-mono` |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Geist Sans with `antialiased`.

## Border Radius

Radius increases with surface depth — smaller for inner elements, larger for outer containers.

| Context | Class |
|---|---|
| Small elements | `rounded-xl` |
| Cards | `rounded-2xl` |
| Modals | `rounded-3xl` |
