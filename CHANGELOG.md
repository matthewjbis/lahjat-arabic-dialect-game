# Changelog

## [Unreleased]

---

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
