# Lahjat — لهجات

A GeoGuessr-style game for Arabic speech. Players listen to a short clip — a vlog, podcast, street interview, song, or film snippet — and drop a pin where they think the speaker is from. Scoring rewards **dialect-family proximity**, not just geographic distance.

Live at **[lahjat.app](https://lahjat.app)**.

## Core design principle: dialect families over geography

Dialect boundaries don't follow national borders, and scoring shouldn't either. A player guessing **Mosul** for an **Aleppo** clip should score better than a player guessing **Baghdad** — even though Baghdad is geographically closer — because Mosul and Aleppo share *qeltu* dialect features that Baghdad doesn't.

This shapes the data model:

- Cities are grouped into ~37 linguistically motivated **dialect clusters** (e.g. `aleppine`, `moslawi`, `najdi`, `hejazi`, `dhofari`) rather than by country.
- Each cluster has a `macro_group` (e.g. `levantine`, `mesopotamian`, `peninsular`, `maghrebi`) enabling **two-tier scoring** — coarse credit for the right family, finer credit for the right sub-dialect.
- Cross-border continua (Aleppo–Mosul, Salalah–Mukalla, Asiri–Yemeni) and edge cases (Juba Arabic as a creole, Saharan Algerian, Hassaniya) are encoded explicitly in the cluster adjacency map as gameplay features.

See [`lahjat-product-writeup.md`](./lahjat-product-writeup.md) for the full product vision.

## Gameplay

- **Standard mode** — 10 rounds. **Blitz mode** — 5 rounds.
- A length-aware speed bonus rewards quick guesses (1.5×→1.0×) and a penalty window (1.0×→0×) auto-fails a round if the player stalls too long; both windows scale with each clip's duration.
- Full **English / Arabic** UI with RTL support; language is auto-detected from the browser and Vercel geo on first visit.
- Optional accounts (email or Google) persist completed games to a score history and surface a player profile.
- Players can **report mistagged clips** per round and leave **general feedback** on the summary screen.

## Tech stack

- **Next.js 16** (App Router, React 19, Turbopack) on **Vercel**
- **TypeScript** + **Tailwind CSS v4**
- **Supabase** — Postgres, auth (`@supabase/ssr`), and Storage (self-hosted audio/video clips served via short-lived signed URLs)
- **D3.js** + **TopoJSON** — the interactive guessing map
- **Vitest** — scoring engine tests
- **Vercel Analytics** — page-view tracking

## Project structure

| Path | Description |
|---|---|
| `app/` | App Router routes: `/` (menu), `/play`, `/dialects`, `/contribute`, `/profile`, `/auth`, and `app/api/*` route handlers |
| `components/` | UI — `GameContainer` (game loop), `GameMap`, `VideoPlayer`, `ScorePanel`, `SummaryScreen`, `ProfileView`, `DialectMapView` |
| `contexts/` | React providers — language, sound, auth |
| `lib/scoring.ts` | The scoring engine: distance + dialect-cluster + exact-city scoring, cluster adjacency. Tested in `lib/scoring.test.ts` |
| `lib/data/dialect-cities.json` | Canonical seed data — ~110 cities tagged with dialect cluster, macro group, coordinates, and Arabic names. Source of truth for the map and scoring |
| `supabase/schema.sql` | Database schema (profiles, game_sessions, clip_reports, general_feedback, submissions) |
| `scripts/` | Maintenance scripts (e.g. clip-duration backfill) |

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

Create a `.env.local` with the Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Run the Vitest suite |
| `npm run backfill:durations` | Backfill `duration_seconds` on existing clip submissions |

## Contributing

This project leans on input from native speakers across the Arab world — especially around dialect classification edge cases, clip sourcing, and reveal explanations. If you spot a misclassified city, a missing cluster, or a cross-border nuance the data model misses, open an issue or PR against `lib/data/dialect-cities.json`.
