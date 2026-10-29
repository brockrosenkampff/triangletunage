// ============================================================
// TRIANGLETUNAGE — Daily Cache Refresh (Scheduled Function)
// ============================================================
// Runs once per day at 9am UTC (5am ET).
// Fetches all events from SeatGeek + Claude and stores the
// result in Netlify Blobs. The /api/events endpoint reads
// from Blobs, so API credits are spent exactly once per day
// regardless of how many people visit the site.
//
// Environment variables required:
//   SEATGEEK_CLIENT_ID
//   ANTHROPIC_API_KEY
// ============================================================
import { getStore } from "@netlify/blobs";

const VENUES = {
  motorco: {
    name: 'Motorco Music Hall', city: 'Durham', color: 'purple', tier: 1,
    seatgeekSlug: 'motorco-music-hall',
    ticketBase: 'https://www.etix.com/ticket/v/2000/motorco-music-hall',
    isEtix: true,
  },
  pourhouse: {
    name: 'The Raleigh Pourhouse', city: 'Raleigh', color: 'magenta', tier: 2,
    searchQuery: 'The Pour House Music Hall Raleigh NC upcoming concerts live music',
    calendarUrl: 'https://www.pourhouseraleigh.com/calendar',
    ticketBase: 'https://www.pourhouseraleigh.com/calendar',
    isEtix: false,
  },
  bowstring: {
    name: 'Bowstring Brewyard', city: 'Raleigh', color: 'amber', tier: 2,
    searchQuery: 'Bowstring Brewyard Raleigh NC upcoming live music events',
    calendarUrl: 'https://raleigh.bowstringbrewyard.com/live-music-and-events/',
    ticketBase: 'https://raleigh.bowstringbrewyard.com/live-music-and-events/',
    isEtix: false,
  },
  stanczyk: {
    name: "Stanczyks Music Bar", city: 'Durham', color: 'purple', tier: 2,
    searchQuery: "Stanczyks Music Bar Durham NC upcoming live music events concerts",
    calendarUrl: 'https://www.stanczyksdurham.com/',
    ticketBase: 'https://www.stanczyksdurham.com/',
    isEtix: false,
  },
  redhat: {
    name: 'Red Hat Amphitheater', city: 'Raleigh', color: 'magenta', tier: 1,
    seatgeekSlug: 'red-hat-amphitheater',
    ticketBase: 'https://www.etix.com/ticket/v/11080/red-hat-amphitheater-band-together',
    isEtix: true,
  },
  koka: {
    name: 'Koka Booth Amphitheatre', city: 'Cary', color: 'amber', tier: 1,
    seatgeekSlug: 'koka-booth-amphitheatre',
    ticketBase: 'https://www.etix.com/ticket/v/8396/koka-booth-amphitheatre',
    isEtix: true,
  },
  dpac: {
    name: 'DPAC', city: 'Durham', color: 'purple', tier: 1,
    seatgeekSlug: 'dpac-durham-performing-arts-center',
    ticketBase: 'https://dpacnc.com/events/',
    isEtix: false,
  },
  catscradle: {
    name: "Cat's Cradle", city: 'Carrboro', color: 'magenta', tier: 1,
    seatgeekSlug: 'cats-cradle',
    // The Back Room is a separate SeatGeek venue but the same building —
    // fold it in here so Back Room shows appear under the Cat's Cradle chip,
    // notated with a room badge on the card.
    seatgeekRooms: [
      { slug: 'cats-cradle',                room: null },
      { slug: 'cat-s-cradle-back-room-1',   room: 'Back Room' },
    ],
    ticketBase: 'https://catscradle.com/',
    isEtix: false,
  },
  carolina: {
    name: 'Carolina Theatre', city: 'Durham', color: 'amber', tier: 2,
    searchQuery: 'Carolina Theatre Durham NC upcoming concerts music events',
    calendarUrl: 'https://carolinatheatre.org/events/',
    ticketBase: 'https://carolinatheatre.org/events/',
    isEtix: false,
  },
  lincoln: {
    name: 'Lincoln Theatre', city: 'Raleigh', color: 'magenta', tier: 1,
    seatgeekSlug: 'lincoln-theatre-raleigh',
    ticketBase: 'https://lincolntheatre.com/events/',
    isEtix: false,
  },
  ritz: {
    name: 'The Ritz', city: 'Raleigh', color: 'magenta', tier: 1,
    seatgeekSlug: 'the-ritz-raleigh',
    ticketBase: 'https://www.livenation.com/venue/KovZpZAJIedA/the-ritz-events',
    isEtix: false,
  },
  fruit: {
    name: 'The Fruit', city: 'Durham', color: 'purple', tier: 2,
    searchQuery: 'The Fruit Durham NC upcoming concerts live music events',
    calendarUrl: 'https://app.opendate.io/c/durham-fruit-337',
    ticketBase: 'https://app.opendate.io/c/durham-fruit-337',
    isEtix: false,
  },
  local506: {
    name: 'Local 506', city: 'Chapel Hill', color: 'amber', tier: 2,
    searchQuery: 'Local 506 Chapel Hill NC upcoming concerts live music',
    calendarUrl: 'https://local506.com/events/',
    ticketBase: 'https://local506.com/events/',
    isEtix: false,
  },
  walnutcreek: {
    name: 'Walnut Creek Amphitheatre', city: 'Raleigh', color: 'magenta', tier: 1,
    seatgeekSlug: 'coastal-credit-union-music-park-at-walnut-creek',
    ticketBase: 'https://www.livenation.com/venue/KovZpZAEkeaA/coastal-credit-union-music-park-at-walnut-creek-events',
    isEtix: false,
  },
  lenovo: {
    name: 'Lenovo Center', city: 'Raleigh', color: 'amber', tier: 1,
    seatgeekSlug: 'lenovo-center',
    ticketBase: 'https://www.ticketmaster.com/lenovo-center-tickets-raleigh/venue/49869',
    isEtix: false,
  },
  hawriver: {
    name: 'Haw River Ballroom', city: 'Saxapahaw', color: 'amber', tier: 2,
    searchQuery: 'Haw River Ballroom Saxapahaw NC upcoming concerts live music',
    calendarUrl: 'https://www.hawriverballroom.com/calendar',
    ticketBase: 'https://www.hawriverballroom.com/calendar',
    isEtix: false,
  },
  pinhook: {
    name: 'The Pinhook', city: 'Durham', color: 'purple', tier: 2,
    searchQuery: 'The Pinhook Durham NC upcoming concerts live music events',
    calendarUrl: 'https://thepinhook.com/events/',
    ticketBase: 'https://thepinhook.com/events/',
    isEtix: false,
  },
  // NOTE: Kings is temporarily closed as of Aug 2026 — tier 0 means "skip",
  // so it stops burning a Claude call per day. Flip back to tier 2 to reopen.
  kings: {
    name: 'Kings', city: 'Raleigh', color: 'magenta', tier: 0,
    searchQuery: 'Kings Raleigh NC upcoming live music events concerts',
    calendarUrl: 'https://www.kingsraleigh.com/',
    ticketBase: 'https://www.kingsraleigh.com/',
    isEtix: false,
  },
};

// ---- TIER 1: SeatGeek API ----
async function fetchSeatGeekRoom(venueId, venue, clientId, slug, room) {
  const today = new Date().toISOString().split('T')[0];
  const future = new Date();
  future.setMonth(future.getMonth() + 6);
  const futureStr = future.toISOString().split('T')[0];

  // First, search for the venue to get its SeatGeek ID
  const searchUrl = `https://api.seatgeek.com/2/venues?slug=${slug}&client_id=${clientId}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    console.error(`SeatGeek venue search failed for ${venue.name}${room ? ' — ' + room : ''}: ${searchRes.status}`);
    return [];
  }
  const searchData = await searchRes.json();

  if (!searchData.venues || searchData.venues.length === 0) {
    // Try a name-based search as fallback
    const fallbackName = room ? `${venue.name} ${room}` : venue.name;
    const nameSearchUrl = `https://api.seatgeek.com/2/venues?q=${encodeURIComponent(fallbackName)}&city=${encodeURIComponent(venue.city)}&state=NC&client_id=${clientId}`;
    const nameRes = await fetch(nameSearchUrl);
    if (!nameRes.ok) return [];
    const nameData = await nameRes.json();
    if (!nameData.venues || nameData.venues.length === 0) return [];
    searchData.venues = nameData.venues;
  }

  const sgVenueId = searchData.venues[0].id;

  // Now fetch events at this venue
  const eventsUrl = `https://api.seatgeek.com/2/events?venue.id=${sgVenueId}&datetime_utc.gte=${today}&datetime_utc.lte=${futureStr}&per_page=50&client_id=${clientId}`;
  const eventsRes = await fetch(eventsUrl);
  if (!eventsRes.ok) return [];
  const eventsData = await eventsRes.json();

  if (!eventsData.events || eventsData.events.length === 0) return [];

  // Filter to music events only
  const excludeTypes = ['sports', 'nhl', 'nba', 'nfl', 'mlb', 'mls', 'ncaa', 'hockey', 'basketball', 'football', 'baseball', 'soccer', 'comedy', 'theater', 'theatre', 'family', 'circus', 'wrestling', 'boxing', 'mma', 'monster_truck'];

  // Sports team names that appear in event titles
  const sportsTeams = ['hurricanes', 'canadiens', 'bruins', 'penguins', 'capitals', 'rangers', 'islanders', 'devils', 'flyers', 'blue jackets', 'maple leafs', 'senators', 'panthers', 'lightning', 'red wings', 'sabres', 'predators', 'blackhawks', 'wild', 'avalanche', 'stars', 'blues', 'jets', 'oilers', 'flames', 'canucks', 'kraken', 'golden knights', 'sharks', 'ducks', 'kings', 'coyotes', 'wolfpack', 'nc state', 'tar heels', 'duke', 'blue devils', 'demon deacons', 'hornets', 'bobcats', 'panthers'];

  return eventsData.events
    .filter(e => {
      const type = (e.type || '').toLowerCase();
      const title = (e.title || '').toLowerCase();
      const taxonomy = (e.taxonomies || []).map(t => t.name.toLowerCase());
      const allTaxStr = taxonomy.join(' ');

      // Exclude if any taxonomy or type matches sports/non-music
      const isExcludedType = excludeTypes.some(ex =>
        type.includes(ex) || allTaxStr.includes(ex)
      );
      if (isExcludedType) return false;

      // Exclude if title contains " at " or " vs " with sports team names
      if (title.includes(' vs ') || title.includes(' vs. ')) return false;
      if (title.includes(' at ') && sportsTeams.some(team => title.includes(team))) return false;

      // These are all known music venues — include everything not excluded above
      return true;
    })
    .map(e => {
      const dt = new Date(e.datetime_utc + 'Z');
      const localDate = e.datetime_local ? e.datetime_local.split('T')[0] : dt.toISOString().split('T')[0];
      const localTime = e.datetime_local
        ? new Date(e.datetime_local).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      const lowestPrice = e.stats?.lowest_price;
      const highestPrice = e.stats?.highest_price;
      let price = 'TBA';
      if (lowestPrice && highestPrice && lowestPrice !== highestPrice) {
        price = `$${lowestPrice}-$${highestPrice}`;
      } else if (lowestPrice) {
        price = `$${lowestPrice}`;
      }

      // Get genre from performers
      const genres = (e.performers || [])
        .flatMap(p => (p.genres || []).map(g => g.name))
        .filter(Boolean);
      const genre = genres[0] || 'Live Music';

      const where = room ? `${venue.name} (${room})` : venue.name;

      return {
        venueId,
        room: room || null,
        title: e.short_title || e.title,
        date: localDate,
        time: localTime,
        doors: null,
        price,
        genre,
        description: e.description || `${e.short_title || e.title} at ${where}`,
        ticketUrl: e.url || venue.ticketBase,
        isEtix: venue.isEtix,
        source: e.url || `https://seatgeek.com`,
        dataSource: 'seatgeek',
      };
    });
}

// A venue can span more than one SeatGeek listing — Cat's Cradle's main room
// and its Back Room are separate SeatGeek venues, but they're one venue to a
// person browsing the calendar. `seatgeekRooms` lets one venueId pull from
// several slugs; each event carries a `room` label so the UI can notate it.
async function fetchSeatGeekVenue(venueId, venue, clientId) {
  const rooms = venue.seatgeekRooms ?? [{ slug: venue.seatgeekSlug, room: null }];
  const results = await Promise.allSettled(
    rooms.map(r => fetchSeatGeekRoom(venueId, venue, clientId, r.slug, r.room))
  );
  const events = [];
  results.forEach((res, i) => {
    if (res.status === 'fulfilled') events.push(...res.value);
    else console.error(`SeatGeek room "${rooms[i].room ?? 'main'}" failed for ${venue.name}: ${res.reason?.message}`);
  });
  return events;
}

// Extracts the first complete, balanced top-level JSON array from a string,
// ignoring brackets that appear inside string literals.
function extractJsonArray(text) {
  const start = text.indexOf('[');
  if (start === -1) return null;
  let depth = 0, inString = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// ---- MODEL FALLBACK CHAIN ----
// From the 4.6 generation onward, Claude model IDs are pinned snapshots —
// there is no evergreen "-latest" alias that rolls forward on its own. So when
// a model retires, a hardcoded ID takes the ENTIRE tier down at once. That is
// exactly what happened in June 2026 when claude-sonnet-4 was retired.
//
// Fix: try each model in order. Fall through ONLY on model-not-found errors.
// Billing (402), rate limit (429) and overload (529) failures are NOT fixed by
// switching models — retrying those would just burn the 60s function budget,
// so those throw immediately.
//
// If a fallback ever fires, it logs loudly: promote the working model to the
// front of this list and drop the dead one.
// Haiku first: Tier 2 is a simple extraction job and Haiku costs about a
// third of Sonnet. Sonnet entries are fallbacks in case Haiku is retired.
const CLAUDE_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-sonnet-5',
];

function isModelNotFound(status, errText) {
  if (status !== 404 && status !== 400) return false;
  return /model/i.test(errText);
}

async function callClaude({ apiKey, prompt, maxTokens, maxUses, label, timeoutMs }) {
  const tool = { type: 'web_search_20250305', name: 'web_search' };
  if (maxUses) tool.max_uses = maxUses;

  let lastModelErr = null;

  for (let i = 0; i < CLAUDE_MODELS.length; i++) {
    const model = CLAUDE_MODELS[i];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        tools: [tool],
        messages: [{ role: 'user', content: prompt }],
      }),
      // A timeout aborts the fetch and throws, which propagates out of this
      // loop rather than falling through — a slow model is not a dead model.
      ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
    });

    if (response.ok) {
      if (i > 0) {
        console.warn(
          `MODEL FALLBACK: "${label}" succeeded on "${model}" after "${CLAUDE_MODELS[0]}" was rejected. ` +
          `Update CLAUDE_MODELS — the primary model has likely been retired.`
        );
      }
      return response.json();
    }

    const errText = await response.text();

    if (isModelNotFound(response.status, errText)) {
      console.error(
        `Model "${model}" rejected for "${label}": ${response.status} ${errText.slice(0, 200)} — trying next model`
      );
      lastModelErr = new Error(`Claude API rejected model ${model} (${response.status})`);
      continue;
    }

    // Not a model problem — surface it as-is. The 11-second all-venue failure
    // signature of a billing rejection is the tell worth preserving in logs.
    console.error(`Claude API error for "${label}": ${response.status} ${errText.slice(0, 300)}`);
    throw new Error(`Claude API returned ${response.status}`);
  }

  console.error(`ALL MODELS REJECTED for "${label}" — every entry in CLAUDE_MODELS is dead.`);
  throw lastModelErr ?? new Error('All Claude models failed');
}

// ---- TIER 2: Claude API + Web Search ----
async function fetchClaudeVenue(venueId, venue, apiKey) {
  const today = new Date().toISOString().split('T')[0];
  const future = new Date();
  future.setMonth(future.getMonth() + 6);
  const futureStr = future.toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  const prompt = `You are a live music researcher. Search for upcoming concerts and live music events at ${venue.name} in ${venue.city}, NC.

Do UP TO 2 searches to find events:
1. Search "${venue.searchQuery}" for their main calendar
2. Check their website: ${venue.calendarUrl}

Find ALL REAL, CONFIRMED or ANNOUNCED upcoming music events from ${today} through ${futureStr}. Include shows even if tickets aren't on sale yet. Work quickly — keep searches focused and don't spend extra time double-checking.

Today's date is ${today}. The current year is ${currentYear}.

CRITICAL RULES — DATE ACCURACY MATTERS MORE THAN COVERAGE:
- Only return events you found in actual search results — do NOT invent or guess events
- The "date" must be the date printed on the listing itself. Never infer a date from
  a URL, a page title, an artist's tour schedule, or the position of an event in a list.
- NEVER roll a past show forward. Many venues keep an event page online after the show
  (e.g. /events/some-band/ stays up for months). If the listing's date is before
  ${today}, OMIT that event entirely — do not assume it repeats or was rescheduled.
- Never pair an artist with a date you found somewhere else on the calendar. If you
  cannot find that specific artist's own date printed on a listing, omit the event.
- Omit any event whose title you cannot read from the listing. Never emit a
  placeholder title like "TBA", "TBD", "Live Music" or "Special Guest".
- Only include music events (concerts, live bands, DJ sets, singer-songwriters)
- Exclude comedy shows, ballet, plays, film screenings, fundraisers, private events
- If tickets aren't on sale yet, set price to "TBA"
- If no specific time is listed, set time to "TBA"
- If you cannot find any confirmed events, return an empty array []

Return ONLY a valid JSON array (no markdown, no preamble). Each object must have:
{
  "venueId": "${venueId}",
  "title": "Artist/Show Name",
  "date": "YYYY-MM-DD",
  "time": "8:00 PM" or "TBA",
  "doors": "7:00 PM" or null,
  "price": "$20" or "$20-$45" or "Free" or "TBA",
  "genre": "Indie Rock",
  "description": "Brief 1-sentence description from the listing",
  "ticketUrl": "actual ticket URL if found, otherwise ${venue.ticketBase}",
  "isEtix": ${venue.isEtix},
  "source": "url where you found this event"
}

Return ONLY the raw JSON array. No explanation, no markdown fences.`;

  const data = await callClaude({
    apiKey,
    prompt,
    maxTokens: 4000,
    maxUses: 2,
    label: venue.name,
    // Don't let one slow venue eat the whole function's time budget
    timeoutMs: 45000,
  });
  const textBlocks = data.content.filter(b => b.type === 'text').map(b => b.text);
  const raw = textBlocks.join('\n');
  const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  // Claude sometimes emits multiple text blocks (e.g. "[]" from an early
  // thought, then the real array later). A greedy [...] regex would grab
  // everything from the first "[" to the last "]", producing invalid JSON.
  // Instead, scan forward from the first "[" and extract just the first
  // *complete*, balanced top-level array.
  const jsonStr = extractJsonArray(clean);
  if (!jsonStr) { console.warn(`No JSON array found for ${venue.name}`); return []; }

  let events;
  try {
    events = JSON.parse(jsonStr);
  } catch (err) {
    console.error(`JSON parse failed for ${venue.name}: ${err.message}. Raw snippet: ${clean.slice(0, 300)}`);
    return [];
  }
  // Belt-and-braces: the prompt forbids past dates and placeholder titles, but a
  // model that ignores it shouldn't be able to put a stale show on the calendar.
  const PLACEHOLDER = /^(tba|tbd|tbc|live music|special guest|announcement)$/i;
  return events
    .filter(e => {
      if (!e.title || !e.date || !e.date.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
      if (PLACEHOLDER.test(String(e.title).trim())) {
        console.warn(`Dropped placeholder title "${e.title}" for ${venue.name}`);
        return false;
      }
      if (e.date < today) {
        console.warn(`Dropped past-dated event "${e.title}" (${e.date}) for ${venue.name}`);
        return false;
      }
      if (e.date > futureStr) {
        console.warn(`Dropped far-future event "${e.title}" (${e.date}) for ${venue.name}`);
        return false;
      }
      return true;
    })
    .map(e => ({
      venueId, title: String(e.title), date: e.date, time: e.time || 'TBA',
      doors: e.doors || null, price: e.price || 'TBA', genre: e.genre || 'Live Music',
      description: e.description || `Live at ${venue.name}`,
      ticketUrl: e.ticketUrl || venue.ticketBase, isEtix: venue.isEtix,
      source: e.source || venue.calendarUrl, dataSource: 'claude',
    }));
}

// Tier 2 (Claude + web search) is paid, so it re-runs weekly. Tier 1 runs daily.
const TIER2_REFRESH_DAYS = 6;

// ---- MAIN HANDLER ----
export default async () => {
  console.log('Starting daily event refresh…');

  const seatgeekClientId = Netlify.env.get('SEATGEEK_CLIENT_ID');
  const anthropicApiKey  = Netlify.env.get('ANTHROPIC_API_KEY');

  const allEvents = [];
  const results = { tier1: { success: 0, failed: 0 }, tier2: { success: 0, failed: 0 } };

  // ---- TIER 2: Claude + Web Search (weekly) ----
  // Tier 2 costs real money (Claude + web search), Tier 1 is free. So Tier 1
  // refreshes daily, but Tier 2 only re-runs when its data is TIER2_REFRESH_DAYS
  // old. In between, the previous Tier 2 events are carried over (past dates
  // dropped). If a Tier 2 run fails, tier2FetchedAt is not advanced, so the
  // next daily run retries it.
  const todayStr = new Date().toISOString().split('T')[0];
  let prevCache = null;
  try {
    const raw = await getStore('events-cache').get('latest');
    if (raw) prevCache = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read previous cache:', e.message);
  }
  const prevTier2At = prevCache?.meta?.tier2FetchedAt || null;
  const prevClaudeEvents = (prevCache?.events || []).filter(
    e => e.dataSource === 'claude' && e.date >= todayStr
  );
  const tier2Fresh =
    prevTier2At &&
    prevClaudeEvents.length > 0 &&
    Date.now() - Date.parse(prevTier2At) < TIER2_REFRESH_DAYS * 86400000;
  let tier2FetchedAt = prevTier2At;

  if (anthropicApiKey && tier2Fresh) {
    console.log(`Tier 2 skipped: last refreshed ${prevTier2At}, carrying over ${prevClaudeEvents.length} events`);
    allEvents.push(...prevClaudeEvents);
    results.tier2 = { success: 0, failed: 0, skipped: true };
  } else if (anthropicApiKey) {
    const tier2Venues = Object.entries(VENUES).filter(([_, v]) => v.tier === 2);
    const tier2Results = await Promise.allSettled(
      tier2Venues.map(async ([venueId, venue]) => {
        try {
          const events = await fetchClaudeVenue(venueId, venue, anthropicApiKey);
          console.log(`Claude: ${venue.name} → ${events.length} events`);
          results.tier2.success++;
          return events;
        } catch (err) {
          console.error(`Claude error for ${venue.name}:`, err.message);
          results.tier2.failed++;
          return [];
        }
      })
    );
    tier2Results.forEach(r => { if (r.status === 'fulfilled') allEvents.push(...r.value); });
    if (results.tier2.success > 0) tier2FetchedAt = new Date().toISOString();
  }

  // ---- TIER 1: SeatGeek ----
  // Fast (all 9 venues complete in a few seconds), so it runs after Tier 2.
  if (seatgeekClientId) {
    const tier1Venues = Object.entries(VENUES).filter(([_, v]) => v.tier === 1);
    const tier1Results = await Promise.allSettled(
      tier1Venues.map(async ([venueId, venue]) => {
        try {
          const events = await fetchSeatGeekVenue(venueId, venue, seatgeekClientId);
          console.log(`SeatGeek: ${venue.name} → ${events.length} events`);
          results.tier1.success++;
          return events;
        } catch (err) {
          console.error(`SeatGeek error for ${venue.name}:`, err.message);
          results.tier1.failed++;
          return [];
        }
      })
    );
    tier1Results.forEach(r => { if (r.status === 'fulfilled') allEvents.push(...r.value); });
  }

  // ---- SALVAGE GUARD ----
  // If an entire tier failed, keep that tier's events from the
  // previous cache instead of wiping them (drop past dates).
  const tier1Dead = results.tier1.failed > 0 && results.tier1.success === 0;
  const tier2Dead = results.tier2.failed > 0 && results.tier2.success === 0;
  if (tier1Dead || tier2Dead) {
    try {
      const store = getStore('events-cache');
      const prev = await store.get('latest');
      if (prev) {
        const prevEvents = (JSON.parse(prev).events || []);
        const salvaged = prevEvents.filter(e =>
          e.date >= todayStr &&
          ((tier1Dead && e.dataSource === 'seatgeek') ||
           (tier2Dead && e.dataSource === 'claude'))
        );
        console.warn(`Tier failure — salvaged ${salvaged.length} events from previous cache (tier1Dead=${tier1Dead}, tier2Dead=${tier2Dead})`);
        allEvents.push(...salvaged);
      }
    } catch (salvageErr) {
      console.warn('Salvage from previous cache failed:', salvageErr.message);
    }
  }

  // ---- DEDUPLICATE & SORT ----
  const seen = new Set();
  const dedupedEvents = allEvents.filter(e => {
    const key = `${e.title.toLowerCase().trim()}|${e.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  dedupedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  // ---- STORE TO BLOBS ----
  const payload = JSON.stringify({
    events: dedupedEvents,
    meta: {
      total: dedupedEvents.length,
      fetchedAt: new Date().toISOString(),
      tier2FetchedAt,
      results,
    },
  });

  const store = getStore('events-cache');
  await store.set('latest', payload);
  console.log(`Refresh complete: ${dedupedEvents.length} events stored to Blobs`);
};

// Run daily at 9am UTC (5am ET)
export const config = {
  schedule: '0 9 * * *',
};
