# Changelog

## [Unreleased]

---

## 2026-06-17 (continued — sound)

### Added
- **Result sound effects** in Classic mode — triggered on the submit click (satisfies browser autoplay policy):
  - `exact` relationship → `public/sounds/success.mp3`
  - `adjacent` or `macro` → `public/sounds/medium.mp3`
  - `none` → `public/sounds/fail.mp3`
  - Three `HTMLAudioElement` objects are preloaded once on `SoundProvider` mount; 404 errors are silently swallowed so a missing file never throws
- **Mute toggle** button (speaker icon) in the fixed header, left of the language toggle; preference persisted to `localStorage` under `lahjat-muted`
- `contexts/SoundContext.tsx` — `SoundProvider`, `useSound()`, `useMuted()`, `useToggleMute()` hooks, mirroring the LanguageContext pattern
- `components/SoundToggle.tsx` — icon button that switches between speaker-on / speaker-crossed-out SVGs
- New translation keys `muteSound` / `unmuteSound` in en + ar

---

## 2026-06-17 (continued — security)

### Security
- **Clip URLs no longer appear in crawlable HTML** — signed Supabase media URLs were previously embedded in the SSR output of `/play`, exposing them to scrapers and spoiling clip locations before a player interacted with the page
- Moved clip fetching entirely to a new server-only API route (`app/api/clips/route.ts`): queries approved submissions, generates signed URLs, and returns `Clip[]` as JSON — `supabaseAdmin` and the service-role key never leave the server
- `/play` is now a static server component that passes only `dialect-cities.json` (public geographic data) at build time; no Supabase calls at SSR
- Added `components/GameLoader.tsx` — client component that fetches `/api/clips` on mount and renders a loading spinner until clips arrive, then hands off to `GameContainer`
- Extracted `resolveLocation()` from the old play page into `lib/resolveLocation.ts` for reuse by the API route
- Added `app/robots.ts` (Next.js Metadata API) — allows `/`, `/dialects`, `/contribute`; disallows `/play` and `/api/`

---

## 2026-06-17 (continued)

### Added
- **Speed-bonus multiplier in Classic mode** — rewards quick guesses, never punishes slow ones
  - Timer starts on first play (first "Click to listen"), not on clip load
  - Multiplier decays smoothly from **×1.5** (instant) down to a **×1.0 floor** over **30 seconds** (all three values are tunable constants in `GameContainer.tsx`)
  - `finalScore = round(baseScore × multiplier)` — accumulated into all totals
  - **Live ticking badge** appears between the player and the map once the clip starts, showing the current multiplier and a depleting bar; disappears on submit
  - **ScorePanel** shows `finalScore` as the primary number; when a bonus was earned, a "Speed bonus ×X.X" breakdown tile is added to the grid and a `base × mult = final` annotation appears under the score
  - **SummaryScreen** uses `finalScore` for all per-clip and grand totals; per-clip rows show a `×X.X` badge when a bonus applied; the denominator reflects the multiplied maximum
  - Timer resets correctly in `handleNext` and `handlePlayAgain`
  - New translations: `speedBonus` and `multiplierBreakdown` (en + ar)
  - `RoundResult` type exported from `GameContainer.tsx` — wraps `ScoreResult` with `multiplier` and `finalScore`

---

## 2026-06-17

### Fixed
- **Ocean clicks no longer score points** — two bugs in `lib/scoring.ts` let a pin dropped in open water earn a full score:
  - *Bug 1 (country-only clips):* `scoreGuess()` was awarding a flat `MAX_DISTANCE_POINTS` (3000) for any `city_confidence === "country"` clip regardless of where the pin landed. Fixed by measuring distance to the nearest in-country city and decaying with `COUNTRY_DECAY_KM = 1500` (gentler than the city-level decay so any reasonable in-country guess still scores well).
  - *Bug 2 (dialect points):* `dialectPoints` had no distance gate, so an ocean pin could snap to a coastal city and claim full cluster credit. Fixed by computing a `proximityFactor` that is 1.0 within `GATE_FREE_KM = 150 km` of the nearest city and decays to near-zero over `GATE_DECAY_KM = 250 km` beyond that.
- New exported tunable constants: `COUNTRY_DECAY_KM`, `GATE_FREE_KM`, `GATE_DECAY_KM`
- New helper `nearestCityInCountry(lat, lon, country, cities)` exported from `lib/scoring.ts`

### Added
- Vitest test suite (`lib/scoring.test.ts`) covering:
  - Mosul guess scores higher than Baghdad guess for an Aleppo clip (adjacent vs. none relationship)
  - Ocean click on a country-only clip scores < 500
  - In-country click on a country-only clip scores ≥ 4000

---

## 2026-06-16

- Added Arabic language support to the dialect map, now Arabic language is mapped to each country, city, and dialect
- Added Classical / Quranic Arabic to the dialect map, located in Hotat Bani Tamim

## 2026-06-15 (continued)

### Added
- End-of-game summary screen after the last clip: total score, tier label (Dialect Master → Just Starting), and a per-clip breakdown table with relationship badges and individual scores
- "View results" button replaces "Play again" on the last clip
- Summary screen fully translated in Arabic and English

---

## 2026-06-15

### Fixed
- RTL layout shift when toggling to Arabic: `scrollbar-gutter: stable both-edges` now reserves equal gutter on both sides, preventing the map and video from resizing on direction change
- Button row in Arabic now wraps gracefully with `flex-wrap` so longer Arabic text doesn't overflow

### Changed
- Clip auto-pause bumped from 20s → 30s

---

## 2026-06-14

### Added
- Full Arabic/English i18n support — all UI copy lives in `lib/translations.ts`
- `LanguageContext` with `useLang()` and `useT()` hooks; language preference persists to localStorage
- `LangToggle` button in the header and home page to switch between English and Arabic
- RTL layout automatically activates when Arabic is selected (`document.dir = "rtl"`)
- Bilingual title "Lahjat لهجات" displayed throughout the app

---

## 2026-06-10

### Added
- Opaque cover over the YouTube iframe hides thumbnail and title until the user clicks play
- Video auto-pauses after 10s via YouTube IFrame postMessage API (later bumped to 30s)
- Top and bottom overlay bars hide the YouTube branding, title overlay, and control bar
- Reset pin button (red, `accent-2`) lets players clear their guess before submitting
- City dot markers (~110 cities) on the map with progressive hover tooltip: "Iraq" → "Baghdad, Iraq"
- Scroll-to-zoom and drag-to-pan on the map (double-click zoom disabled)
- Country name tooltip on map hover
- Documented self-hosted audio via yt-dlp → Supabase Storage as long-term roadmap item in `lahjat-product-writeup.md`

### Fixed
- Map projection center shifted so all Arab-world countries (Morocco through Oman) are fully visible
- Mauritania no longer cut off — projection center moved to [21, 23] at scale 720
- Pin placement now correctly accounts for zoom transform before inverting through projection

---

## 2026-06-08

### Added
- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 scaffold replacing the HTML prototype
- `lib/scoring.ts` — TypeScript port of scoring logic: `scoreGuess()`, `haversineDistanceKm()`, `nearestCity()`, dialect multipliers, cluster adjacency map
- `lib/data/dialect-cities.json` — ~110 cities across ~37 dialect clusters
- D3.js v7 map with geoMercator projection, TopoJSON world atlas, and country coloring for the Arab world
- `GameContainer`, `GameMap`, `VideoPlayer`, `ScorePanel` components
- `public/world-atlas.json` — TopoJSON extracted from the original HTML prototype
- Deployed to Vercel with auto-deploy from GitHub `main` branch
