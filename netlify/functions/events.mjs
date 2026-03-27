// ============================================================
// TRIANGLETUNAGE — Netlify Serverless Function
// ============================================================
// Tiered event fetching:
//   Tier 1: SeatGeek API for major venues
//   Tier 2: Claude API + web search for indie/local venues
//
// Environment variables required:
//   SEATGEEK_CLIENT_ID
//   ANTHROPIC_API_KEY
// ============================================================

const VENUES = {
  motorco: {
    name: 'Motorco Music Hall', city: 'Durham', color: 'purple', tier: 2,
    searchQuery: 'Motorco Music Hall Durham NC upcoming concerts',
    calendarUrl: 'https://motorcomusic.com/calendar/',
    ticketBase: 'https://www.etix.com/ticket/v/2000/motorco-music-hall',
    isEtix: true,
  },
  pourhouse: {
    name: 'The Raleigh Pourhouse', city: 'Raleigh', color: 'magenta', tier: 2,
    searchQuery: 'Raleigh Pourhouse upcoming concerts live music',
    calendarUrl: 'https://www.etix.com/ticket/v/13617/the-pourhouse-downtown',
    ticketBase: 'https://www.etix.com/ticket/v/13617/the-pourhouse-downtown',
    isEtix: true,
  },
  bowstring: {
    name: 'Bowstring Brewyard', city: 'Raleigh', color: 'amber', tier: 2,
    searchQuery: 'Bowstring Brewyard Raleigh NC upcoming live music events',
    calendarUrl: 'https://raleigh.bowstringbrewyard.com/events/',
    ticketBase: 'https://raleigh.bowstringbrewyard.com/events/',
    isEtix: false,
  },
  stanczyk: {
    name: "Stanczyk's", city: 'Durham', color: 'purple', tier: 2,
    searchQuery: "Stanczyk's Durham NC upcoming live music events",
    calendarUrl: 'https://www.stanczyks.com/',
    ticketBase: 'https://www.stanczyks.com/',
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
    name: "Cat's Cradle", city: 'Carrboro', color: 'magenta', tier: 2,
    searchQuery: "Cat's Cradle Carrboro NC upcoming concerts live music",
    calendarUrl: 'https://catscradle.com/',
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
    calendarUrl: 'https://www.durhamfruit.com/',
    ticketBase: 'https://www.durhamfruit.com/',
    isEtix: false,
  },
  local506: {
    name: 'Local 506', city: 'Chapel Hill', color: 'amber', tier: 2,
    searchQuery: 'Local 506 Chapel Hill NC upcoming concerts live music',
    calendarUrl: 'https://local506.com/',
    ticketBase: 'https://local506.com/',
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
    calendarUrl: 'https://hawriverballroom.com/',
    ticketBase: 'https://hawriverballroom.com/',
    isEtix: false,
  },
  pinhook: {
    name: 'The Pinhook', city: 'Durham', color: 'purple', tier: 2,
    searchQuery: 'The Pinhook Durham NC upcoming concerts live music events',
    calendarUrl: 'https://thepinhook.com/',
    ticketBase: 'https://thepinhook.com/',
    isEtix: false,
  },
  kings: {
    name: 'Kings', city: 'Raleigh', color: 'magenta', tier: 2,
    searchQuery: 'Kings Raleigh NC upcoming live music events concerts',
    calendarUrl: 'https://www.kingsraleigh.com/',
    ticketBase: 'https://www.kingsraleigh.com/',
    isEtix: false,
  },
};

// ---- TIER 1: SeatGeek API ----
async function fetchSeatGeekVenue(venueId, venue, clientId) {
  const today = new Date().toISOString().split('T')[0];
  const future = new Date();
  future.setMonth(future.getMonth() + 2);
  const futureStr = future.toISOString().split('T')[0];

  // First, search for the venue to get its SeatGeek ID
  const searchUrl = `https://api.seatgeek.com/2/venues?slug=${venue.seatgeekSlug}&client_id=${clientId}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    console.error(`SeatGeek venue search failed for ${venue.name}: ${searchRes.status}`);
    return [];
  }
  const searchData = await searchRes.json();
  
  if (!searchData.venues || searchData.venues.length === 0) {
    // Try a name-based search as fallback
    const nameSearchUrl = `https://api.seatgeek.com/2/venues?q=${encodeURIComponent(venue.name)}&city=${encodeURIComponent(venue.city)}&state=NC&client_id=${clientId}`;
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
  
  return eventsData.events
    .filter(e => {
      const type = (e.type || '').toLowerCase();
      const title = (e.title || '').toLowerCase();
      const taxonomy = (e.taxonomies || []).map(t => t.name.toLowerCase());
      const allTaxStr = taxonomy.join(' ');
      
      // Exclude if any taxonomy or type matches sports/non-music
      const isExcluded = excludeTypes.some(ex => 
        type.includes(ex) || allTaxStr.includes(ex) || title.includes(' at hurricanes') || title.includes(' vs ')
      );
      if (isExcluded) return false;
      
      // Include if it's clearly a concert/music event
      const isMusic = type.includes('concert') || 
             type.includes('music') ||
             taxonomy.some(t => t.includes('concert') || t.includes('music'));
      
      return isMusic;
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

      return {
        venueId,
        title: e.short_title || e.title,
        date: localDate,
        time: localTime,
        doors: null,
        price,
        genre,
        description: e.description || `${e.short_title || e.title} at ${venue.name}`,
        ticketUrl: e.url || venue.ticketBase,
        isEtix: venue.isEtix,
        source: e.url || `https://seatgeek.com`,
        dataSource: 'seatgeek',
      };
    });
}

// ---- TIER 2: Claude API + Web Search ----
async function fetchClaudeVenue(venueId, venue, apiKey) {
  const today = new Date().toISOString().split('T')[0];
  const future = new Date();
  future.setMonth(future.getMonth() + 2);
  const futureStr = future.toISOString().split('T')[0];

  const prompt = `Search for upcoming concerts and live music events at ${venue.name} in ${venue.city}, NC. The venue's calendar/website is: ${venue.calendarUrl}

Search their website and any event listings to find REAL, CONFIRMED upcoming music events from ${today} through ${futureStr}.

CRITICAL RULES:
- Only return events you found in actual search results — do NOT invent or guess events
- Only include music events (concerts, live bands, DJ sets, singer-songwriters)
- Exclude comedy shows, ballet, plays, film screenings, fundraisers, private events
- If you cannot find any confirmed events, return an empty array []

Return ONLY a valid JSON array (no markdown, no preamble). Each object must have:
{
  "venueId": "${venueId}",
  "title": "Artist/Show Name",
  "date": "YYYY-MM-DD",
  "time": "8:00 PM",
  "doors": "7:00 PM" or null,
  "price": "$20" or "$20-$45" or "Free" or "TBA",
  "genre": "Indie Rock",
  "description": "Brief 1-sentence description from the listing",
  "ticketUrl": "actual ticket URL if found, otherwise ${venue.ticketBase}",
  "isEtix": ${venue.isEtix},
  "source": "url where you found this event"
}

Return ONLY the raw JSON array. No explanation, no markdown fences.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Claude API error for ${venue.name}: ${response.status} ${errText}`);
    throw new Error(`Claude API returned ${response.status}`);
  }

  const data = await response.json();
  const textBlocks = data.content.filter(b => b.type === 'text').map(b => b.text);
  const raw = textBlocks.join('');
  const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const arrayMatch = clean.match(/\[[\s\S]*\]/);

  if (!arrayMatch) {
    console.warn(`No JSON array found for ${venue.name}`);
    return [];
  }

  const events = JSON.parse(arrayMatch[0]);
  return events
    .filter(e => e.title && e.date && e.date.match(/^\d{4}-\d{2}-\d{2}$/))
    .map(e => ({
      venueId,
      title: String(e.title),
      date: e.date,
      time: e.time || 'TBA',
      doors: e.doors || null,
      price: e.price || 'TBA',
      genre: e.genre || 'Live Music',
      description: e.description || `Live at ${venue.name}`,
      ticketUrl: e.ticketUrl || venue.ticketBase,
      isEtix: venue.isEtix,
      source: e.source || venue.calendarUrl,
      dataSource: 'claude',
    }));
}

// ---- MAIN HANDLER ----
export default async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const seatgeekClientId = Netlify.env.get('SEATGEEK_CLIENT_ID');
  const anthropicApiKey = Netlify.env.get('ANTHROPIC_API_KEY');

  if (!seatgeekClientId && !anthropicApiKey) {
    return new Response(
      JSON.stringify({ error: 'No API keys configured', events: [] }),
      { status: 500, headers }
    );
  }

  const allEvents = [];
  const results = { tier1: { success: 0, failed: 0 }, tier2: { success: 0, failed: 0 } };

  // ---- TIER 1: SeatGeek ----
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

    tier1Results.forEach(r => {
      if (r.status === 'fulfilled') allEvents.push(...r.value);
    });
  }

  // ---- TIER 2: Claude + Web Search ----
  if (anthropicApiKey) {
    const tier2Venues = Object.entries(VENUES).filter(([_, v]) => v.tier === 2);

    // Process in batches of 3 to avoid rate limits
    for (let i = 0; i < tier2Venues.length; i += 3) {
      const batch = tier2Venues.slice(i, i + 3);
      const batchResults = await Promise.allSettled(
        batch.map(async ([venueId, venue]) => {
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

      batchResults.forEach(r => {
        if (r.status === 'fulfilled') allEvents.push(...r.value);
      });
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

  return new Response(
    JSON.stringify({
      events: dedupedEvents,
      meta: {
        total: dedupedEvents.length,
        fetchedAt: new Date().toISOString(),
        results,
      },
    }),
    { status: 200, headers }
  );
};

export const config = {
  path: '/api/events',
};
