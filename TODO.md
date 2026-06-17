# TODO

Tracked tasks and known issues. Checked items are done; move completed ones to
`CHANGELOG.md` when shipped.

## 🟡 Medium priority

- [ ] **Internationalize the auth UI** ([app/auth/page.tsx](app/auth/page.tsx), [app/auth/reset/page.tsx](app/auth/reset/page.tsx), [components/AuthButton.tsx](components/AuthButton.tsx))
  - Hardcoded English; the only non-translated surface. Breaks consistency in Arabic/RTL mode.
  - Fix: move strings into `lib/translations.ts` (en + ar).

## Feature backlog (from auth groundwork)

- [ ] Save completed games to `game_sessions` (wire to SummaryScreen for logged-in players)
- [ ] Profile / score-history page (`/profile`)
- [ ] Leaderboard (query `game_sessions` ranked by score, filterable by mode)
- [ ] Regional game modes (see `lahjat-product-writeup.md` → Regional modes)
- [ ] Google / OAuth sign-in (dashboard toggle + `signInWithOAuth` button)

---

_Audit performed 2026-06-17. Completed items moved to `CHANGELOG.md`._
