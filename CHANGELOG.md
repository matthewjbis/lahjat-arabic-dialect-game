# Changelog

## [Unreleased]

- **"Why your clip matters" section on `/contribute`** — a short, gold-accented card above the recording guidelines explaining the value of contributing (share your dialect, help others learn, make the game better), shown to both signed-in contributors and signed-out visitors to encourage participation. Fully translated en + ar.

## 2026-06-19 (session 6 — feedback, Arabic UX, volume & auth polish)

### Added
- **Per-clip report button** — "Report a problem" pill button appears at the bottom of the `ScorePanel` reveal after each round. Clicking it expands an inline form with reason pills (Wrong dialect, Wrong city, Poor quality, Other) and an optional note field. Reports are saved to a new `clip_reports` Supabase table via `/api/report-clip`; no account required. Fully translated en + ar.
- **General feedback form on summary screen** — a textarea at the bottom of the end-of-game screen lets players leave longer suggestions or bug reports. Submitted to a new `general_feedback` Supabase table via `/api/submit-feedback`; no account required. Both forms show inline success/error state. Fully translated en + ar.
- **Auto language detection** — on first visit (no saved preference), the app checks `navigator.languages` for any Arabic variant (`ar-*`) instantly without a network call. If the browser language is not Arabic, a fast edge request to `/api/detect-lang` reads Vercel's `x-vercel-ip-country` header and sets Arabic for users in any of 24 Arabic-speaking countries. Explicit user toggle always overrides and is saved to `localStorage` as before.

### Changed
- **Arabic city and dialect names on summary screen** — the per-clip breakdown now shows city and cluster names in Arabic when the app is in Arabic mode, using `name_ar` from `dialect-cities.json`. `ClipAnswer` gained a `city_ar?: string` field; the clips API passes it through from `resolveLocation`. "X clips" count in the score header is now translated via `t.clipsLabel`.
- **Volume persists across clips** — `VideoPlayer` saves the user's volume level to `localStorage` (`lahjat-volume`) on every `volumechange` event, and restores it when a new clip's media element mounts. Works for both audio and video players.
- **Sign-in button hidden on auth page** — `AuthButton` returns `null` when the current path is `/auth`, removing the redundant "Sign in" pill from the floating nav while the user is already on the sign-in screen.
- **Google OAuth now live** — Google Cloud project configured (External consent screen, OAuth 2.0 client ID + secret), provider enabled in Supabase, and the "Continue with Google" button restored to the auth page. Works for both sign-in and sign-up; redirects back to the originating page via `/auth/callback`.

## 2026-06-18 (session 5 — continued: contribute page for signed-out visitors)

### Changed
- **Signed-out visitors to `/contribute` now see what the page is for** — previously the page jumped straight to a "Sign in to contribute" card. It now shows the same explanation ("Are you a native Arabic speaker?…") and recording guidelines that signed-in contributors see, above the sign-in prompt. Both are fully bilingual (en + ar) via the existing translations and language toggle. The guidelines were extracted into a reusable `RecordingGuidelines` component shared by both views.

## 2026-06-18 (session 5 — continued: instant timer & duration robustness)

### Changed
- **Timer countdown now starts the instant the player hits play** — removed the grace period that held the multiplier at full 1.5× before counting down. With the bonus/penalty windows already scaling with clip length, longer clips get proportionally more time, so the separate grace hold was redundant. The multiplier now decays 1.5×→1.0× over `~L`, then 1.0×→0× over `~1.5L`.

### Fixed
- **More robust clip-duration capture on upload** — `measureDuration` now handles the `MediaRecorder` case where a webm reports `duration: Infinity` on `loadedmetadata` (seeks to the end to force a real value), with a 5s safety net so it never blocks submission. Recorded clips also fall back to the exact elapsed-seconds counter if the media element can't report a duration. Verified in a real browser that uploaded wav/mp3/mp4 and a recorded audio/webm all yield correct durations.

## 2026-06-18 (session 5 — continued: duration capture & backfill)

### Fixed
- **Corrected the timer's duration column name** to `submissions.duration_seconds` (was `duration_second`); the clips API now selects and serves the real column.

### Added
- **Clip duration captured on upload** — the contribute page measures the file's length in the browser (throwaway `<audio>`/`<video>` element) and sends `duration_seconds` with the submission; `/api/submit-clip` stores it. New clips now arrive with a duration instead of null, so the length-aware timer works immediately.
- **Backfill script** (`scripts/backfill-durations.mjs`, `npm run backfill:durations`) — for existing rows with a null `duration_seconds`, signs each file's storage URL, reads its duration from the container metadata via `music-metadata` (no ffmpeg dependency), and writes it back. Supports `--dry`. Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in the environment.

## 2026-06-18 (session 5 — length-aware timer & YouTube removal)

### Changed
- **Round timer now scales with clip length** — instead of a fixed 15s bonus / 20s penalty window, each clip's timer is derived from its length `L` (Balanced curve): a grace period of `max(3s, L)` holds the multiplier at full 1.5× so the player can hear the whole clip before any countdown, then a bonus window of `~L` decays 1.5×→1.0×, then a penalty window of `~1.5L` decays 1.0×→0× (auto-fail). Short clips run a faster timer, long clips a slower one. Length comes from the `submissions.duration_second` column, falling back to the media element's measured duration, then an 8s default. The speed-bonus bar sits full during the grace period, then drops. Constants (`GRACE_MIN_SEC`, `BONUS_RATIO`, `PENALTY_RATIO`) are tunable at the top of `GameContainer`.

### Removed
- **YouTube clip support (legacy)** — all content is now self-hosted in Supabase Storage, so the YouTube code path is gone: removed the YouTube iframe branch and `youtubeId`/`startSeconds` props from `VideoPlayer`, the `source`/`youtube_id`/`start_seconds` fields from the `Clip` type and the clips API, the unused `clips.json` seed libraries (root + `lib/data`), and the `lahjat-player.html` prototype. Updated the README and product writeup to describe the self-hosted audio/video architecture.

## 2026-06-18 (session 4 — per-page SEO & social previews)

### Added
- **Per-page metadata** — `/dialects`, `/contribute`, `/play`, and `/profile` now each export their own meta `description` and full `openGraph` block (title + description), so links unfurl differently from the root `lahjat.app` when pasted in Instagram/iMessage or surfaced on Google. Previously all pages inherited the root layout's description. `/contribute` is a client component, so its metadata lives in a new `app/contribute/layout.tsx`.
- **Distinct Open Graph / Twitter images per page** — added `opengraph-image.png` + `twitter-image.png` (1200×630) via the Next.js file convention. The root uses the Lahjat wordmark; `/dialects`, `/contribute`, and `/play` each get a branded card with a page-specific icon (map pin / microphone / play), English + Arabic title, and tagline. Images were rendered from the site's own brand tokens (gold gradient, khatam star texture, Outfit + Aref Ruqaa) via headless Chrome at 3× DPI and downscaled for crispness.
- **`metadataBase`** set to `https://lahjat.app` on the root layout, so all canonical and OG image URLs resolve to absolute production URLs.

## 2026-06-17 (session 3 — features, nav, mobile fixes)

### Added
- **Completed games saved to `game_sessions`** — when a logged-in player reaches the summary screen, the game (mode, total score, max score, clip count) is persisted via a direct client insert, guarded by RLS (own-insert only) and a one-shot ref so each completed game records exactly once. The summary shows a subtle "Saved to your history" confirmation for members and a "Sign in to save your scores" link for guests (translated en + ar). Foundation for the upcoming profile and leaderboard features.
- **Profile / score-history page (`/profile`)** — logged-in players see stat tiles (games played, best score, average accuracy) and a reverse-chronological list of their games (mode, date, clip count, score, accuracy %), read from `game_sessions` via an RLS-scoped client query. Guests get a sign-in gate; empty state links to a first game. Added a "Profile" link to the account dropdown. Fully translated en + ar.
- **Clips-contributed stat on profile** — a fourth stat tile shows how many clips the player has submitted, counted server-side via a new `/api/my-contributions` route (admin client + server auth, so it's independent of the submissions table's RLS). Stat grid is now 2×2 on mobile, 1×4 on desktop.
- **Google sign-in** — "Continue with Google" button on the `/auth` page (above an "or" divider over the email form), wired to `signInWithOAuth`. Reuses the existing `/auth/callback` route. Translated en + ar. _Requires enabling the Google provider in the Supabase dashboard._
- **Vercel Analytics** — installed `@vercel/analytics` and added `<Analytics />` to the root layout; tracks page views across all routes automatically.
- **Home page redesigned as main menu** — Play (gold primary button), Dialect Map, and Contribute (secondary) presented as a three-button menu. Play has hover-lift to reinforce it as the primary action.
- **Scroll-aware floating nav** — replaced the solid full-width mobile nav bar with a position-based hide/show: nav fades out once the user scrolls past 60px, reappears only when back above 20px. Purely position-based (no direction tracking) so it is immune to iOS momentum scroll oscillations. All pages updated to `pt-14` top padding to clear the floating buttons at load.

### Changed
- **Video uploads bypass Vercel via Supabase pre-signed URLs** — `/api/submit-clip` now accepts metadata only and returns a signed upload URL; the browser uploads the file directly to Supabase storage, removing all Vercel request-size constraints. Fixes network errors on video files (tested at 13.4 MB).
- **Rounds capped at 10 clips** — `CLIPS_PER_ROUND = 10` constant in `GameContainer`; a fresh random 10 are drawn from the full pool each game.
- **Omdurman removed** — too geographically close to Khartoum on the map; Khartoum retained for the sudanese cluster.
- **Al-Ahsa and Jazan added** — Al-Ahsa (الاحساء, gulf cluster, SA) and Jazan (جازان, asiri cluster, SA) added to both dialect-cities JSON files.
- **Game nav restructured** — Brand reverted to plain heading (not a link); "Menu" NavPill added linking to `/`; Dialect Map and Contribute back links changed from `/` to `/play` so they return to the game.
- **Arabic lam clipping fixed** — `.ar-display` `line-height` raised from `1` to `1.2`; the calligraphic font's tall lam stroke was being clipped to the em box.
- **iOS video fullscreen prevented** — `playsInline` and `disablePictureInPicture` added to the `<video>` element; stops iOS Safari from hijacking playback into fullscreen.

---

## 2026-06-17 (continued — audit fixes)

### Security
- **Uploads now require a signed-in account** — `/api/submit-clip` returns 401 for anonymous requests, closing the open 50 MB upload endpoint to abuse; the contribute page shows a "Sign in to contribute" gate (translated en + ar) with a link to `/auth?redirectTo=/contribute` instead of letting users fill the form and hit a 401
- **`/api/clips?debug=1` gated to development** — the debug view (which exposes internal storage `file_path`s and drop reasons) now only responds when `NODE_ENV !== "production"`; production requests always get the plain `Clip[]`
- **Removed per-request console logging** from the clips route

### Added
- **Password reset page** (`app/auth/reset/page.tsx`) — completes the "Forgot password?" flow, which previously linked to a non-existent route and 404'd; user sets a new password via `supabase.auth.updateUser` with a confirm-password check
- **Contributor attribution** — `/api/submit-clip` now reads the signed-in session server-side and stores `user_id` on the submission (null for anonymous uploads)

### Changed
- **Auth UI internationalized** — the `/auth` sign-in/create-account page, the `/auth/reset` password page, and the `AuthButton` header control now pull all copy from `lib/translations.ts` (en + ar) and flip correctly in RTL, matching the rest of the app; ~22 new translation keys (Supabase's own error messages remain server-provided English)
- **`middleware.ts` → `proxy.ts`** — renamed to the Next.js 16 `proxy` file convention (function `middleware` → `proxy`); clears the build-time deprecation warning
- **`export const runtime = "nodejs"` added to `/api/submit-clip`** for parity with the clips route (both use the service-role admin client)
- **Memoized `clusterMap`** in `GameContainer` with `useMemo`

---

## 2026-06-17 (continued — auth)

### Added
- **Email authentication** — players can create an account and sign in with email + password; auth is entirely optional and gameplay requires no account
  - `app/auth/page.tsx` — sign in / create account page matching the Lahjat design system; tabbed layout with error display and "Check your email" confirmation state
  - `app/auth/callback/route.ts` — handles email confirmation links and future OAuth redirects
  - `contexts/AuthContext.tsx` — `useAuth()` hook providing `user`, `loading`, and `signOut`; listens to `onAuthStateChange` so state stays in sync across tabs
  - `components/AuthButton.tsx` — "Sign in" pill in the fixed top-right header when logged out; avatar initial + email/sign-out dropdown when logged in
  - `middleware.ts` — refreshes the session cookie on every request so sessions never silently expire
  - `lib/supabase-server.ts` — server-side Supabase client (`createServerSupabase`) and admin client, separated from the browser client to prevent `next/headers` bundling into the client
  - `supabase/schema.sql` — database schema: `profiles` table (auto-created on sign-up via trigger), `game_sessions` table for score persistence, `user_id` column on `submissions` for contributor attribution
  - Supabase `Site URL` updated to `https://lahjat.app` so confirmation emails link to the live domain
  - Google and other OAuth providers can be added later with a single dashboard toggle + one button

---

## 2026-06-17 (continued — content & fixes)

### Added
- **South Sudan added to contribute page** — `SS` (Juba Arabic / `jubaArabic` cluster) was already in `dialect-cities.json`; added to the country dropdown in `app/contribute/page.tsx`
- **End screen sound** — `public/sounds/endscreen.mp3` plays when the player clicks "View results"; fires on the button click (user-gesture tick, satisfying browser autoplay policy); preloaded alongside the other sounds in `SoundProvider`
- **`/api/clips?debug=1` diagnostic mode** — returns `{ total, serving, dropped[{id, country, city, file_path, reason}], clips }` so missing clips can be diagnosed without digging into server logs; normal requests return `Clip[]` as before

### Fixed
- **Video thumbnail hidden on desktop** — `preload="metadata"` caused Chrome to display the first video frame as a poster image before the user clicked play, potentially revealing the clip's location; replaced with the same click-to-reveal cover pattern used for YouTube embeds (`preload="none"`, solid surface overlay, gold play button, `videoRef.current.play()` on click)

---

## 2026-06-17 (continued — auto-fail timer)

### Added
- **Penalty zone and auto-fail** — the speed-bonus timer now continues past the 1.0× floor instead of stopping:
  - **Phase 1** (0 – 15 s): 1.5× → 1.0× gold/amber bar (speed bonus, unchanged)
  - **Phase 2** (15 – 35 s): 1.0× → 0× red bar (penalty zone)
  - **At 0×**: round auto-fails — fail sound plays, map locks, player scores 0 for that clip
  - Live badge bar turns red and the multiplier text turns red once in the penalty zone
  - ScorePanel shows "Time's up — 0 points" in red (translated in en + ar) and a red `×0.0` speed tile when auto-failed
  - New tunable constant `TIMER_PENALTY_SEC = 20` (seconds for the penalty phase)
  - New translation keys `timesUp` in en + ar

---

## 2026-06-17 (continued — UI fixes)

### Fixed
- **Game header centred in all languages** — replaced `justify-between` with `justify-center` on the header flex row so the "Lahjat لهجات" title and Dialect Map / Contribute nav pills stay centred regardless of LTR/RTL direction instead of flipping sides on language switch
- **Back link no longer covered by fixed toggles in Arabic** — `رجوع` on the Dialect Map and Contribute pages now uses `text-left` (a physical CSS property) to pin it to the physical left edge even in RTL mode, keeping it clear of the sound and language toggle buttons
- **Audio player icon and label centred** — added `justify-center` to the "Listen to the clip" header row inside the audio card so the icon reads as the natural thing to click
- **Double arrow removed from Next Clip button** — arrow was present in both the translation string and the JSX; removed from both translation strings (`nextClip` en + ar)
- **Fail sound mapped to correct filename** — code expected `fail.mp3` but uploaded file was named `failure.mp3`; path updated in `SoundContext`
- **Subtitle / clip counter no longer run together** — added `gap-4` to the flex row so "Classic Mode — …" and "Clip X of Y" always have space between them
- **Speed bonus window halved** — `TIMER_WINDOW_SEC` reduced from 30 s → 15 s for more meaningful time pressure

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
