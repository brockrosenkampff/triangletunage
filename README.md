# Triangle Tunage

**Live Music. Your Triangle.** — A live music calendar for the Raleigh–Durham–Chapel Hill area, at [triangletunage.com](https://triangletunage.com).

## Venues

**Raleigh:** The Pourhouse, Bowstring Brewyard, Red Hat Amphitheater, Lincoln Theatre, The Ritz, Walnut Creek Amphitheatre, Lenovo Center, Kings
**Durham:** Motorco Music Hall, Stanczyks Music Bar, DPAC, Carolina Theatre, The Fruit, The Pinhook
**Carrboro:** Cat's Cradle · **Chapel Hill:** Local 506 · **Cary:** Koka Booth Amphitheatre · **Saxapahaw:** Haw River Ballroom

## How it works

- `index.html` — the whole frontend. Single page, vanilla JS, no build step.
- `netlify/functions/refresh-events.mjs` — scheduled function, runs daily at 9am UTC (5am ET). Fetches events from two sources and stores the result in Netlify Blobs:
  - **Tier 1 (big venues):** SeatGeek API
  - **Tier 2 (small venues):** Claude API with web search
- `netlify/functions/events.mjs` — serves `/api/events` straight from the Blobs cache, so API credits are spent once per day regardless of traffic. Falls back to a live fetch only if the cache is empty (first deploy).

If an entire tier fails during a refresh, the previous day's events for that tier are kept rather than wiped.

## Deployment

Hosted on **Netlify**, auto-deploys from the `main` branch of this repo. The local branch is `master`, so pushes use `master:main`.

Environment variables (set in Netlify → Site settings → Environment variables):

- `SEATGEEK_CLIENT_ID`
- `ANTHROPIC_API_KEY`

## Local development

Open `index.html` in a browser. The events API call (`/api/events`) only works on the deployed site, since it's a Netlify function.

## Brand

- Fonts: Playfair Display (headings) + Space Mono (labels/meta)
- Background `#0d0d0f` · Magenta `#c93b7a` · Purple `#a855f7` · Amber `#f59e0b`
- City order is always: Raleigh · Durham · Chapel Hill
