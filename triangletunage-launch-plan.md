# TriangleTunage.com — Launch Plan & Technical Architecture

## Project Summary

TriangleTunage is a Triangle NC live music calendar covering 18 venues across Raleigh, Durham, Chapel Hill, Carrboro, Cary, and Saxapahaw. The app displays real upcoming concert data in a branded calendar/list UI, pulling data from venue websites via a tiered fetching system.

---

## Phase 1: Tiered Data Fetching Architecture

The core challenge is getting **real, accurate event data** from 18 different venues that each use different ticketing platforms and website formats. The solution is a three-tier fallback system.

### Tier 1: Structured APIs (Fastest, Most Reliable)

**SeatGeek API** — Free developer tier, query by venue or metro area. Returns structured JSON with event name, date, time, venue, ticket URL, and pricing.

- Endpoint: `GET https://api.seatgeek.com/2/events?venue.id={id}&client_id={key}`
- Coverage: Likely covers Lenovo Center, Walnut Creek, The Ritz, DPAC, Red Hat Amphitheater, Lincoln Theatre, Koka Booth
- Sign up: https://seatgeek.com/build
- Rate limit: Generous for read-only queries
- **Action item:** Register for SeatGeek client ID, look up venue IDs for each Triangle venue

**Bandsintown API** — Free for artist-centric queries. Requires an app_id.

- Endpoint: `GET https://rest.bandsintown.com/artists/{name}/events?app_id={id}`
- Caveat: Artist-oriented, not venue-oriented. Each API key is tied to a single artist unless you get partnership approval. Less useful as a primary source for a venue calendar.
- Better as a supplemental source if you want to enrich artist data (bios, images, follower counts)
- **Note:** Bandsintown's partnership program may grant broader access — worth applying

**Songkick** — Avoid for now. Songkick was recently acquired by Suno (the AI music company) as part of a Warner Music Group settlement. Its future as an independent data source is uncertain. API key approvals have been slow/unreliable historically.

### Tier 2: Direct Web Scraping + Claude Parsing (Current v2 Approach)

For venues not covered by SeatGeek, use the Claude API with `web_search_20250305` tool to search each venue's website and extract structured event data. This is what the current v2 calendar already does.

**Best for:** Motorco, Cat's Cradle, Stanczyk's, Bowstring, The Pinhook, Kings, Local 506, The Fruit, Haw River Ballroom

**How it works:**
1. Claude searches the venue's calendar URL via web search
2. Finds real event listings in search results
3. Parses them into the standard JSON event schema
4. Returns validated, music-only events

**Improvements to make:**
- Add retry logic (if a venue returns 0 results, retry once with a broader search query)
- Cache results in localStorage with a 4-hour TTL so users don't re-fetch on every page load
- Add a "stale data" indicator when cache is older than 24 hours

### Tier 3: Manual Curation / Community Submissions (Future)

For events that slip through both tiers, add a simple submission form where users or venue operators can submit shows. Store in a lightweight backend (Supabase, Firebase, or Airtable).

---

## Phase 2: Backend Architecture

### Option A: Serverless Cron (Recommended for Launch)

Run a scheduled job that pre-fetches all venue data daily, stores it as static JSON, and serves it from a CDN. The frontend just fetches a single JSON file — no API calls from the browser.

**Stack:**
- **Cloudflare Workers** (or Vercel Edge Functions / Netlify Functions)
  - Cron trigger: runs every 6 hours
  - Calls SeatGeek API for Tier 1 venues
  - Calls Claude API with web search for Tier 2 venues
  - Merges, deduplicates, and writes combined JSON to Cloudflare KV (or R2 bucket)
- **Frontend:** Static HTML served from Cloudflare Pages
  - On load, fetches `/api/events.json` from KV
  - No API keys exposed in browser
  - Instant load, no waiting for scraping

**Benefits:**
- API keys stay server-side (not exposed in client JS)
- Fast — users get pre-fetched data instantly
- Cost-effective — a few API calls every 6 hours vs. per-user
- CDN-cached globally

**Estimated monthly cost:** $0–5 (Cloudflare Workers free tier: 100k requests/day, KV: 100k reads/day)

### Option B: Client-Side Only (Current Approach)

Keep the current architecture where the browser calls the Claude API directly on "Load Shows." Simpler to build but has downsides:
- API key must be in client code (or proxied)
- Every user triggers 18 API calls on load
- Slower UX (30-60 seconds to scan all venues)
- Higher API costs at scale

**Verdict:** Fine for prototyping and personal use. Move to Option A before public launch.

---

## Phase 3: Website Structure

### Pages

| Page | Purpose |
|------|---------|
| **/** (Home) | Calendar + list view, venue filters, hero branding |
| **/about** | What is TriangleTunage, the team, mission |
| **/venues** | All 18 venues with cards, links, maps |
| **/submit** | Form for users/venues to submit events (Phase 2+) |

### Domain & Hosting

- **Domain:** TriangleTunage.com (register via Namecheap, Cloudflare Registrar, or Google Domains)
- **Hosting:** Cloudflare Pages (free tier)
  - Git-based deploys from GitHub
  - Global CDN, free SSL, unlimited bandwidth
  - Edge Workers for the cron/API proxy
- **Alternative:** Netlify or Vercel (both have excellent free tiers)

### DNS + SSL

Cloudflare handles this automatically when you use their registrar + Pages. Zero config.

---

## Phase 4: Social Media & SEO

### Social Accounts to Set Up

- **Instagram:** @TriangleTunage — weekly "This Week in Triangle Music" posts
- **Twitter/X:** @TriangleTunage — daily show highlights, retweets from venues
- **Bluesky:** @triangletunage.com — growing music community there
- **Facebook Page:** TriangleTunage — event sharing, community

### SEO

- Add `<meta>` tags for Open Graph (social previews) and Twitter Cards
- Add structured data (`Event` schema from schema.org) to each event for Google rich results
- Create a `/sitemap.xml` that updates with each data refresh
- Target keywords: "Triangle NC live music," "Raleigh concerts tonight," "Durham shows this week"

### Content Strategy

- Auto-generate a "This Week" summary from event data
- Monthly "Best Shows" editorial picks (manual or AI-assisted)
- Venue spotlight posts for social

---

## Phase 5: Launch Checklist

### Pre-Launch (Week 1-2)

- [ ] Register TriangleTunage.com domain
- [ ] Set up GitHub repo with the calendar HTML
- [ ] Deploy to Cloudflare Pages (or Netlify/Vercel)
- [ ] Register for SeatGeek API developer key
- [ ] Build the serverless cron worker to pre-fetch events
- [ ] Test data accuracy across all 18 venues
- [ ] Add localStorage caching to frontend
- [ ] Set up Google Analytics or Cloudflare Web Analytics (privacy-first)

### Launch Day

- [ ] Push production build
- [ ] Verify all venue data is loading correctly
- [ ] Create social media accounts
- [ ] Post launch announcement on Instagram, X, Reddit (r/raleigh, r/triangle, r/bullcity)
- [ ] Submit to local Triangle blogs/newsletters (INDY Week, Triangle on the Cheap)

### Post-Launch (Week 3-4)

- [ ] Monitor data accuracy, fix any venue scraping issues
- [ ] Add event submission form
- [ ] Reach out to venue operators to cross-promote
- [ ] Set up email newsletter (Buttondown or Mailchimp free tier)
- [ ] Add "Tonight" / "This Weekend" quick filters
- [ ] Consider Bandsintown partnership application for richer data

---

## Venue Data Source Matrix

| Venue | City | Tier 1 (API) | Tier 2 (Scrape) | Notes |
|-------|------|:---:|:---:|-------|
| Lenovo Center | Raleigh | SeatGeek | Backup | Major arena, well-indexed |
| Walnut Creek | Raleigh | SeatGeek | Backup | Live Nation venue |
| The Ritz | Raleigh | SeatGeek | Backup | Live Nation venue |
| DPAC | Durham | SeatGeek | Backup | Large touring acts |
| Red Hat Amphitheater | Raleigh | SeatGeek | Backup | Etix + Live Nation |
| Lincoln Theatre | Raleigh | SeatGeek | Backup | Ticketmaster listings |
| Koka Booth | Cary | SeatGeek | Backup | Etix venue |
| Carolina Theatre | Durham | Likely | Yes | May need scraping |
| Cat's Cradle | Carrboro | Unlikely | **Primary** | Indie, own site |
| Motorco | Durham | Unlikely | **Primary** | Etix but indie-booked |
| Pourhouse | Raleigh | Unlikely | **Primary** | Etix, niche listings |
| Bowstring Brewyard | Raleigh | No | **Primary** | Small, local only |
| Stanczyk's | Durham | No | **Primary** | Small, local only |
| The Fruit | Durham | Possibly | **Primary** | Growing venue |
| Local 506 | Chapel Hill | Possibly | **Primary** | Indie staple |
| The Pinhook | Durham | Possibly | **Primary** | Small/local |
| Kings | Raleigh | No | **Primary** | Bar venue |
| Haw River Ballroom | Saxapahaw | Possibly | **Primary** | Niche, quality acts |

---

## Cost Estimate (Monthly at Launch)

| Item | Cost |
|------|------|
| Domain (TriangleTunage.com) | ~$10/year |
| Cloudflare Pages hosting | Free |
| Cloudflare Workers (cron) | Free (100k req/day) |
| SeatGeek API | Free tier |
| Claude API (Tier 2 scraping) | ~$5-15/mo (11 venues × 4 fetches/day × ~$0.01/call) |
| **Total** | **~$5-20/month** |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Static HTML/CSS/JS (current calendar app) |
| Fonts | Playfair Display + Space Mono (Google Fonts) |
| Data Layer | Pre-fetched JSON from serverless worker |
| API Tier 1 | SeatGeek API |
| API Tier 2 | Claude API + web_search tool |
| Hosting | Cloudflare Pages |
| Serverless | Cloudflare Workers (cron every 6 hours) |
| DNS/SSL | Cloudflare (auto) |
| Analytics | Cloudflare Web Analytics (free, cookieless) |
| Future DB | Supabase or Firebase (for user submissions) |
