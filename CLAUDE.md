# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · JavaScript (no TypeScript). Email UI built with `lucide-react` (icons), `recharts` (charts), and `d3-geo` + `topojson-client` (world map). This is **Postwave**, a bulk-email campaign console.

> Next 16 / React 19 / Tailwind v4 are recent — when adding a dependency, expect React-19 peer-dep conflicts (e.g. `react-simple-maps` caps at React 18 and was rejected in favor of `d3-geo`). Per AGENTS.md, read `node_modules/next/dist/docs/` before writing Next-specific code (route handlers, config, etc.).

## Commands

- `npm run dev` — dev server at http://localhost:3000 (Turbopack). Restart it after editing `.env.local` (env vars load at startup).
- `npm run build` — production build; also runs route typegen + ESLint. The build is the fastest way to validate the whole file compiles.
- `npm run start` — serve the production build.
- `npm run lint` — ESLint (`eslint-config-next`). **No test suite is configured.**

Verifying UI changes: the page server-renders only a `Loading…` shell — all data loads in a client `useEffect`, so `curl`/`fetch` only ever sees the shell. Load it in a real browser. After a dev-server restart the open tab loses its HMR socket, so **hard-refresh** (Ctrl+Shift+R) to pick up new code.

## Architecture

**The entire app is one client component:** [app/EmailCampaigner.jsx](app/EmailCampaigner.jsx) (~140 KB, `"use client"`, default export `App`). It contains every screen (Dashboard, Subscribers, Templates, NewCampaign, CampaignList, CampaignDetail, Analytics, SettingsPage, Suppressions, Bounced, Domains, WorldMap, RichTextEditor) plus UI primitives (`Btn`, `Badge`, `Stat`, `Input`). [app/page.js](app/page.js) just renders `<EmailCampaigner/>`. When extending the app, you are almost always editing this one file.

**Navigation is state, not routing.** A single `view` object (`{ name, ...payload }`) in `App` is the router; the `Sidebar` sets it and `App`'s JSX switches on `view.name`. Adding a screen = new sub-component + sidebar item + a `view.name ===` render branch + wiring its state/props through `App`.

**All data lives in `App` `useState` and persists as one blob.** State slices: `campaigns`, `subscribers`, `templates`, `suppressions`, `domains`, `smtpConfig`. They are serialized together to `localStorage` under key `email_campaigner_v1` (`loadState`/`saveState`). The save effect depends on a single JSON `snapshot` string — deliberately, to avoid React 19's "deps array changed size" warning that fires when passing several arrays/objects as deps. Keep that pattern.

**Seed data loads only when a slice is empty** (`sampleSubscribers`/`sampleCampaigns`/`sampleSuppressions`/`sampleDomains`/`sampleTemplates`), on fresh install or saved-but-empty. To force a reseed: `localStorage.removeItem('email_campaigner_v1')` in the browser console. Seed campaigns use synthetic recipient ids (not real subscribers) and carry their own `events`/`bounces` arrays.

**Two sending paths:**
- *Simulation* (default, no backend): `simulateResults()` fabricates `events`/`stats` after a timeout and auto-suppresses bounces/unsubscribes/complaints.
- *Real send via Resend*: [app/api/send/route.js](app/api/send/route.js) — `GET` reports whether sending is configured, `POST` personalizes `{{vars}}` per recipient and sends via Resend's batch API. Needs `RESEND_API_KEY` (+ optional `RESEND_FROM`) in `.env.local`; the key is **server-only**. On load `App` fetches `GET /api/send` → `resend.configured`; `launchCampaign` then calls `realSend()` or falls back to `simulateResults()`. Real sends record sent/delivered/bounced only — opens/clicks would require Resend webhooks (not implemented).

**Scheduler.** A 5-second `setInterval` in `App` fires due `scheduled` campaigns (flips status → `sending`, runs `simulateResults`), with catch-up on load. It's client-side (only runs while a tab is open) and reads latest state through refs (`campaignsRef`/`subscribersRef`/`suppressionsRef`) because the interval closure would otherwise be stale.

**Email bodies are HTML.** `RichTextEditor` is a `contentEditable` + `document.execCommand` toolbar; bodies are stored as HTML strings. `toHtml`/`stripHtml`/`escapeHtml` normalize legacy plain-text; previews use `dangerouslySetInnerHTML` with the injected `.email-body` styles.

**Styling is mostly inline tokens, not CSS.** Nearly all visual styling comes from inline `style={...}` reading the design-token object `T` at the top of the file; Tailwind utilities are used for layout only. Fonts (Geist / JetBrains Mono via Google Fonts CDN) and global CSS (scrollbars, rich-text, `email-body`, contentEditable placeholder) are injected at runtime by a `useEffect` in `App`, not in `globals.css`.

**World map** (`WorldMap`): `d3-geo` (`geoEqualEarth`/`geoPath`) + `topojson-client`, fetching the world topojson from a jsDelivr CDN at runtime (offline → falls back to bubbles + ranked list). Country bubbles come from the module-level `COUNTRIES` table (code/name/lat/lng/weight); subscriber `country` codes index into it.

**Domains** drive capacity: each domain's `dailyLimit` sums into the dashboard's daily quota, and `distributeAcrossDomains()` shows how a campaign's volume splits across domains in the review step. This is planning/visualization only — the real send does not yet rotate the `from` address per domain.

Runtime external dependencies (both fetched client-side): Google Fonts and the world-atlas topojson.
