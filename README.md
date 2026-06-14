# Lahjat — Guess the Arabic Dialect

A GeoGuessr-style game for Arabic speech. Players listen to a short clip — a vlog, podcast, street interview, song, or film snippet — and guess where the speaker is from. Scoring rewards dialect-family proximity, not just geographic distance, and every guess feeds a crowd-built dataset of dialect-tagged Arabic audio.

## Why

Arabic is a continuum of dialects spoken across 22+ countries, and people who speak it already play this game informally — guessing a friend's hometown from how they say a single word. Lahjat formalizes that instinct into a product:

- **Unbounded skill ceiling** — casual players guess countries, experts guess Basra vs. Baghdad or Agadir vs. Casablanca.
- **Teaches on every reveal** — after guessing, players see the actual location and the specific dialectal features that gave it away.
- **Builds a moat as a byproduct** — aggregated, accuracy-weighted guesses produce a self-correcting, crowd-tagged Arabic dialect corpus.

See [`lahjat-product-writeup.md`](./lahjat-product-writeup.md) for the full product vision, including game modes, content sourcing, and the longer-term roadmap toward a pan-Arabic language learning platform.

## Core design principle: dialect families over geography

Dialect boundaries don't follow national borders, and scoring shouldn't either. A player guessing **Mosul** for an **Aleppo** clip should score better than a player guessing **Baghdad** — even though Baghdad is geographically closer — because Mosul and Aleppo share *qeltu* dialect features that Baghdad doesn't.

This shapes the data model:

- Cities are grouped into ~37 linguistically motivated **dialect clusters** (e.g. `aleppine`, `moslawi`, `najdi`, `hejazi`, `dhofari`) rather than by country.
- Each cluster has a `macro_group` (e.g. `levantine`, `mesopotamian`, `peninsular`, `maghrebi`) enabling **two-tier scoring** — coarse credit for the right family, finer credit for the right sub-dialect.
- Cross-border continua (Aleppo–Mosul, Salalah–Mukalla, Asiri–Yemeni) and edge cases (Juba Arabic as a creole, Saharan Algerian, Hassaniya) are flagged explicitly as gameplay features, not noise.

## What's in this repo

| File | Description |
|---|---|
| [`dialect-cities.json`](./dialect-cities.json) | Canonical seed data — ~110 cities across ~23 countries, tagged with dialect cluster, macro group, coordinates, and edge-case notes. This is the source of truth for the map and scoring logic. |
| [`lahjat-dialect-map.html`](./lahjat-dialect-map.html) | Standalone interactive D3.js map of dialect coverage, color-coded by cluster (not country). Hover a city for details, click a cluster for its full city list. |
| [`lahjat-product-writeup.md`](./lahjat-product-writeup.md) | Full product spec: core loop, game modes, content sourcing, tech stack, MVP timeline, and success metrics. |

## Tech stack

- **Next.js** on **Vercel**
- **Supabase** — database, auth, realtime
- **Mapbox** — guessing interface
- **YouTube iframe API** — embedded clip sourcing
- **Whisper** — transcription of curated clips
- **Claude** — drafting dialect-feature reveal explanations (human-edited)

## Status

Early-stage. Current focus is the dialect/city data model and Classic mode (single audio clip, drop a pin, distance- and dialect-weighted scoring). See the product writeup's MVP timeline for the build sequence.

## Contributing

This project leans on input from native speakers across the Arab world — especially around dialect classification edge cases, clip sourcing, and reveal explanations. If you spot a misclassified city, a missing cluster, or a cross-border nuance the data model misses, open an issue or PR against `dialect-cities.json`.
