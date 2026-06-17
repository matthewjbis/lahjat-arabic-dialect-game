# TODO

Tracked tasks and known issues. Checked items are done; move completed ones to
`CHANGELOG.md` when shipped.

## 🔴 High priority — security

- [ ] **Lock down `/api/submit-clip`** ([app/api/submit-clip/route.ts](app/api/submit-clip/route.ts))
  - Unauthenticated and unthrottled: anyone can POST 50 MB files to Supabase Storage with no auth or rate limit — a storage-cost / DoS vector.
  - MIME check uses client-controlled `file.type`, so the allowlist is advisory only.
  - Fix: require a logged-in session (auth now exists), add a per-IP rate limit, and/or validate magic bytes instead of declared MIME.

- [ ] **Gate `/api/clips?debug=1`** ([app/api/clips/route.ts:79](app/api/clips/route.ts#L79))
  - Publicly reachable; leaks internal `file_path`s, drop reasons, and the full clip list.
  - Fix: `const debug = ... && process.env.NODE_ENV !== "production"`, or require a secret header.

## 🟡 Medium priority

- [ ] **Build the password-reset page** ([app/auth/page.tsx](app/auth/page.tsx))
  - "Forgot password?" sends a reset email pointing at `/auth/reset`, which doesn't exist → 404. User ends up logged in with no way to set a new password.
  - Fix: add `app/auth/reset/page.tsx` (uses `supabase.auth.updateUser({ password })`), or remove the link until built.

- [ ] **Attach `user_id` to clip submissions** ([app/contribute/page.tsx](app/contribute/page.tsx), [app/api/submit-clip/route.ts](app/api/submit-clip/route.ts))
  - `submissions.user_id` column exists in the schema but is never set, so contributor attribution (a stated goal of auth) isn't wired up.
  - Fix: read the session in the submit route and insert `user_id`.

- [ ] **Internationalize the auth UI** ([app/auth/page.tsx](app/auth/page.tsx), [components/AuthButton.tsx](components/AuthButton.tsx))
  - Hardcoded English; the only non-translated surface. Breaks consistency in Arabic/RTL mode.
  - Fix: move strings into `lib/translations.ts` (en + ar).

- [ ] **Migrate `middleware.ts` → `proxy` convention** ([middleware.ts](middleware.ts))
  - Next.js 16 build warns the `middleware` file convention is deprecated; will break on the next major.

## 🟢 Low priority / polish

- [ ] **Add `export const runtime = "nodejs"` to submit-clip** ([app/api/submit-clip/route.ts](app/api/submit-clip/route.ts)) — present in `clips` route but not here, despite both using `supabaseAdmin`.
- [ ] **Trim production debug logging** in `app/api/` — `[lahjat] serving X/Y clips` runs on every clips request; 6 `console.*` calls total.
- [ ] **Memoize cluster maps** — `scoreGuess` rebuilds `clusterMacroGroup` per call; `GameContainer` rebuilds `clusterMap` per render. Only worth it if clip counts grow.

## Feature backlog (from auth groundwork)

- [ ] Save completed games to `game_sessions` (wire to SummaryScreen for logged-in players)
- [ ] Profile / score-history page (`/profile`)
- [ ] Leaderboard (query `game_sessions` ranked by score, filterable by mode)
- [ ] Regional game modes (see `lahjat-product-writeup.md` → Regional modes)
- [ ] Google / OAuth sign-in (dashboard toggle + `signInWithOAuth` button)

---

_Audit performed 2026-06-17. See git history for context._
