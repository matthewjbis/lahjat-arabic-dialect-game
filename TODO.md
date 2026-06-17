# TODO

Tracked tasks and known issues. Checked items are done; move completed ones to
`CHANGELOG.md` when shipped.

## 🔴 High priority — security

- [ ] **Rate-limit / harden `/api/submit-clip`** ([app/api/submit-clip/route.ts](app/api/submit-clip/route.ts))
  - Still unthrottled: anyone can POST 50 MB files repeatedly — a storage-cost / DoS vector. (Submissions are now attributed to a user when signed in, but anonymous uploads are still allowed.)
  - MIME check uses client-controlled `file.type`, so the allowlist is advisory only.
  - **Blocked on a decision:** require a signed-in session to submit? Add a per-IP rate limit (needs Upstash/Vercel KV)? Validate magic bytes instead of declared MIME?

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
