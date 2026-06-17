# TODO

Tracked tasks and known issues. Checked items are done; move completed ones to
`CHANGELOG.md` when shipped.

## Feature backlog (higher priority)

From the auth groundwork — build these before the forum-era features below.

- [ ] Save completed games to `game_sessions` (wire to SummaryScreen for logged-in players)
- [ ] Profile / score-history page (`/profile`)
- [ ] Leaderboard (query `game_sessions` ranked by score, filterable by mode)
- [ ] Regional game modes (see `lahjat-product-writeup.md` → Regional modes)
- [ ] Google / OAuth sign-in (dashboard toggle + `signInWithOAuth` button)

## Forum-era features (lower priority)

Gated on standing up the forum at `forum.lahjat.app`. These extend the profile
into a social/community identity and only make sense once the forum exists.

- [ ] **Profile customization** — expand `/profile` beyond score history into a
  forum-ready identity (avatar, bio, display name editing, public profile URL,
  links). Foundations: `profiles` table already exists; `display_name` already
  stored in `user_metadata`.
- [ ] **Achievement badges (scoring thresholds)** — award tiered badges as players
  cross cumulative/best-score thresholds, e.g. Classic Mode **Novice →
  Intermediate → Expert → Master**. Mirror the existing `tierLabel()` tiers in
  `lib/translations.ts`. Depends on `game_sessions` (score persistence) landing first.
- [ ] **Regional dialect badges** — per-region mastery badges (e.g. Maghrebi Expert,
  Levant Master), one tier ladder per regional game mode. Depends on **Regional
  game modes** shipping first.
- [ ] **Role badges** — manually/automatically assigned account flags: **Developer**,
  **Contributor** (earned via approved clip submissions — `submissions.user_id`
  already links clips to users), **Donator / Member** (gated on monetized features
  if/when added).
- [ ] **Badge data model** — design once before building the above: a `badges`
  catalog table + a `user_badges` join, or a JSON column on `profiles`. Decide
  earned-vs-granted logic and how badges render on profiles and (eventually) forum posts.

---

_Audit performed 2026-06-17. Completed items moved to `CHANGELOG.md`._
