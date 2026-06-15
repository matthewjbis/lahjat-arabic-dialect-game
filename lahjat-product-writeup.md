All projects
Arabic Dialect Guessing Game
Claude Fable 5 is currently unavailable.
Learn more(opens in new tab)


How can I help you today?

    Naming a GitHub repository
    Last message 2 minutes ago
    Arab world audio context cities
    Last message May 14

Memory
Only you

Purpose & context Matthew is building Lahjat, a dialect identification game focused on Arabic speech. The core goal is to create an engaging, linguistically accurate game where players identify Arabic dialects from audio clips, with scoring that rewards dialect-family proximity rather than pure geographic distance. Success means capturing the real-world complexity of Arabic dialect continua across the Arab world. Key domain: Arabic dialectology, with emphasis on cross-border dialect clusters (e.g., the Aleppo–Mosul qeltu corridor, the Salalah–Mukalla gradient, Hejazi/Najdi distinctions). The project targets a level of linguistic sophistication suitable for expert-level gameplay. --- Current state Two core assets have been produced and recommended for import into the project's file area for session continuity: lahjat-dialect-map.html — Standalone interactive D3.js map, color-coded by dialect cluster (not country), with hover/click functionality dialect-cities.json — Structured seed file with ~110 cities, ~37 dialect clusters, ~23 countries, including macrogroup fields for two-tier scoring, ISO country codes, and edge-case/transitional city notes The dialect framework is organized into linguistically motivated cross-border clusters: Maghrebi, Egyptian, Sudanese, Levantine, Mesopotamian, Arabian Peninsula, and Yemeni — with sub-distinctions (e.g., qeltu vs. gilit in Mesopotamian Arabic) flagged as important for gameplay depth. --- Key learnings & principles Scoring philosophy: Dialect-family proximity should outweigh geographic distance — a player guessing Mosul for an Aleppo clip should score better than guessing Baghdad, even though Baghdad is geographically closer Cross-border continua matter: Dialect boundaries don't follow national borders; the framework should reflect linguistic reality over political geography Edge cases are features: Transitional varieties (e.g., Juba Arabic as a creole, Saharan Algerian) add gameplay richness and are worth flagging explicitly in data Two-tier scoring: The macrogroup field enables coarse (dialect family) and fine (sub-dialect) scoring layers --- Tools & resources D3.js for interactive map rendering Project file area (Claude.ai) for asset persistence across sessions JSON seed data as the canonical city/dialect reference for the game

Last updated May 27
Instructions

Add instructions to tailor Claude’s responses
Files
1% of project capacity used

lahjat-product-writeup.md
# Lahjat: Guess the Arabic Dialect
 
## The product in one line
 
A GeoGuessr-style game where players listen to short clips of Arabic speech and pinpoint exactly where the speaker is from, with the byproduct of building the most accurate crowd-tagged Arabic dialect corpus in existence.
 
## The core loop
 
Player hears a 5-15 second clip of natural Arabic speech (vlog, podcast, street interview, song, film). They drop a pin on a map of the Arab world. Scoring is distance-weighted with bonuses for hitting the correct city. After the guess, the game reveals the actual location plus the dialectal features that gave it away ("the qaf realization as /g/ confirms Bedouin/Gulf rather than urban Levantine"). The reveal is where the game *teaches* rather than just tests.
 
## Why this works
 
- **Skill ceiling is unbounded.** Casual players guess countries; experts guess Basra vs. Baghdad, Agadir vs. Casablanca, Riyadh vs. Jeddah.
- **Identity-driven engagement.** Dialect is more identity-laden than geography. Arabs already play this game informally; the product formalizes an existing social practice.
- **Native virality.** Watching someone correctly identify a speaker's hometown from a 10-second clip is shareable content. The Arabic-speaking internet has no equivalent product.
- **The data is the moat.** Aggregated guesses produce a continuously self-correcting dialect corpus with confidence scores, which is valuable infrastructure for the broader product roadmap.
## Game modes
 
- **Classic** — single clip, one guess, distance-scored
- **Daily challenge** — one curated hard clip per day, global leaderboard, shareable result cards (the Wordle pattern)
- **Round-based** — 5 clips, cumulative score, shareable summary
- **Speed round** — country-level only, as many as possible in 60 seconds
- **Expert mode** — sub-regional only, no country hints
- **Modality variants** — audio only, video only, song lyrics, poetry recitation, written text
## Content sourcing
 
- Hand-curated MVP library (200-500 clips covering major dialect groups)
- YouTube via official iframe embedding for scale (no hosting, no licensing issues)
- User-uploaded clips with consent for long-tail content and social mechanics
- Eventually: commissioned recordings from native speakers for gold-standard tagged data
## Technical stack
 
- Next.js on Vercel
- Supabase for database, auth, and realtime
- Mapbox for the guessing interface
- YouTube iframe API for embedded content (MVP — see note below)
- Whisper for transcription of curated clips
- Claude for drafting reveal explanations (human-edited)
### A note on clip delivery: YouTube iframe → self-hosted audio

**MVP approach:** YouTube iframe API with an opaque cover that hides the thumbnail and title until the player clicks "Listen". This is fast to ship, costs nothing, and is explicitly permitted under YouTube's Terms of Service for embedded playback. Short clips (under ~15 seconds) used for commentary, criticism, or educational purposes are also defensible under fair use doctrine, though this has not been tested in court for a product like Lahjat.

**Long-term target:** Extract audio from curated clips using `yt-dlp`, store as `.mp3` files in Supabase Storage, and serve via a native `<audio>` element with a custom player UI. This eliminates all remaining spoiler vectors (video ID in network requests, channel name in player), removes the YouTube dependency entirely, and enables a cleaner audio-only game experience. It also opens the door to commissioned recordings from native speakers as the content library matures.

**Migration path:** The `clips.json` schema already captures `youtube_id` and `start_seconds`. When moving to self-hosted audio, add a `audio_url` field to each clip entry and update the player component to prefer `audio_url` over the YouTube embed when present. This allows a gradual clip-by-clip migration with no breaking changes to the data model.

## The annotation engine
 
Every player guess becomes a data point. Aggregated across thousands of native-speaker guesses, with each user's vote weighted by their proven accuracy and dialect proximity to the clip's origin, the system produces high-confidence dialect tags as a byproduct of gameplay. Clips with persistent expert disagreement get flagged for re-review. This is crowd-sourced annotation built on Foldit/reCAPTCHA/Zooniverse lineage, applied to a domain where it hasn't been done well.
 
## Strategic role
 
Lahjat is the wedge, not the business. The viral consumer game builds three assets:
 
1. An Arab-speaker user base that becomes the marketing channel for the next product
2. A high-quality tagged Arabic dialect corpus that powers the next product
3. Credibility and visibility in the Arabic-speaking internet that takes the founder from unknown to known
The next product is a pan-Arabic language learning platform built on LingQ-style comprehensible input methodology, with proper dialect handling, Classical Arabic support, and the content infrastructure that no existing app provides. Lahjat ships first because it's smaller, faster, more viral, and produces the inputs that the bigger product depends on.
 
## Positioning
 
"Arabic is one of the world's great languages — a millennium-deep literary tradition, the liturgical language of nearly two billion Muslims, and a living continuum of dialects spoken across 22 countries. Lahjat is the first product built to celebrate that continuum: a game that tests your ear for the music of Arabic, from Casablanca to Baghdad, from Khartoum to Aleppo."
 
## MVP scope and timeline
 
**Weekend 1:** Static prototype. Single mode (Classic, audio-only), 10 hand-curated clips, basic map, no accounts. Playable end-to-end.
 
**Weekends 2-3:** Supabase integration, persistent users, leaderboard, expand to 50 clips covering major dialect groups.
 
**Weekends 4-5:** Daily challenge mode, shareable result cards, dialect-feature reveal content.
 
**Weekends 6-8:** Polish, additional modes, launch playbook execution (Arab Twitter outreach, Reddit communities, Product Hunt, TikTok content).
 
**Target launch:** 8 weeks from start, with 200+ clips, 4+ game modes, daily challenge live.
 
## Success metrics
 
- **Best case:** 100K+ players in first 90 days, viral moment in Arabic-speaking internet, corpus of 50K+ tagged clips, foundation for the learning app fully established.
- **Median case:** 5-20K players over six months, 10-50K tagged clips, strong portfolio artifact and credible base for next product.
- **Floor:** Shipped product, real codebase, demonstrated ability to build viral consumer products in underserved language markets. Even this is better than not shipping.
 
