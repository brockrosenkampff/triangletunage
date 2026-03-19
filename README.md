# TriangleTunage

**Your Triangle, Live.** — A live music calendar for the Raleigh-Durham-Chapel Hill area.

Find upcoming concerts at 18 venues across the Triangle, with real data pulled from venue websites.

## Venues

**Durham:** Motorco, Stanczyk's, DPAC, Carolina Theatre, The Fruit, The Pinhook  
**Raleigh:** Pourhouse, Bowstring, Red Hat Amp, Lincoln Theatre, The Ritz, Walnut Creek, Lenovo Center, Kings  
**Carrboro:** Cat's Cradle  
**Chapel Hill:** Local 506  
**Cary:** Koka Booth  
**Saxapahaw:** Haw River Ballroom  

## Tech Stack

- Static HTML/CSS/JS (single page app)
- Playfair Display + Space Mono (Google Fonts)
- Claude API + web search for real event data
- Deployed on Cloudflare Pages

## Local Development

Just open `index.html` in a browser. No build step required.

For the event fetching to work, the app calls the Anthropic API from the browser. In production, this will be replaced by a serverless worker that pre-fetches data.

## Deployment

This site is designed to deploy to [Cloudflare Pages](https://pages.cloudflare.com/):

1. Push this repo to GitHub
2. Connect the repo to Cloudflare Pages
3. Set build output directory to `/` (root)
4. Deploy

No build command needed — it's a static HTML file.

## Roadmap

- [ ] SeatGeek API integration for major venues (Tier 1)
- [ ] Serverless cron worker for pre-fetched data
- [ ] Event submission form
- [ ] Email newsletter
- [ ] Social media auto-posting

## License

MIT
