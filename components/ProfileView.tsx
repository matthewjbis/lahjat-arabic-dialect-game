"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useT, useLang } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { computeCurrentStreak, computeLongestStreak } from "@/lib/streak";

// Mirrors the public.game_sessions table
interface GameSession {
  id: string;
  mode: string;
  total_score: number;
  max_score: number;
  clip_count: number;
  played_at: string;
}

function tierColor(ratio: number): string {
  if (ratio >= 0.66) return "var(--score-high)";
  if (ratio >= 0.33) return "var(--score-mid)";
  return "var(--score-low)";
}

export function ProfileView() {
  const t = useT();
  const { lang } = useLang();
  const { user, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState<GameSession[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [contributions, setContributions] = useState<number | null>(null);

  const [editingLocation, setEditingLocation] = useState(false);
  const [locationCountry, setLocationCountry] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const allCountries = useMemo(() => {
    const names = new Intl.DisplayNames([lang], { type: "region" });
    const codes = [
      "AF","AL","DZ","AD","AO","AG","AR","AM","AU","AT","AZ","BS","BH","BD","BB",
      "BY","BE","BZ","BJ","BT","BO","BA","BW","BR","BN","BG","BF","BI","CV","KH",
      "CM","CA","CF","TD","CL","CN","CO","KM","CD","CG","CR","HR","CU","CY","CZ",
      "DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FJ","FI","FR",
      "GA","GM","GE","DE","GH","GR","GD","GT","GN","GW","GY","HT","HN","HU","IS",
      "IN","ID","IR","IQ","IE","IL","IT","JM","JP","JO","KZ","KE","KI","KP","KR",
      "KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MG","MW","MY","MV",
      "ML","MT","MH","MR","MU","MX","FM","MD","MC","MN","ME","MA","MZ","MM","NA",
      "NR","NP","NL","NZ","NI","NE","NG","MK","NO","OM","PK","PW","PS","PA","PG",
      "PY","PE","PH","PL","PT","QA","RO","RU","RW","KN","LC","VC","WS","SM","ST",
      "SA","SN","RS","SC","SL","SG","SK","SI","SB","SO","ZA","SS","ES","LK","SD",
      "SR","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TO","TT","TN","TR","TM",
      "TV","UG","UA","AE","GB","US","UY","UZ","VU","VE","VN","YE","ZM","ZW",
    ];
    return codes
      .map((code) => ({ code, name: names.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [lang]);

  useEffect(() => {
    if (!user) return;
    setLocationCountry((user.user_metadata?.country as string | undefined) ?? "");
    setLocationCity((user.user_metadata?.city as string | undefined) ?? "");
  }, [user]);

  async function saveLocation() {
    if (!user) return;
    setLocationStatus("saving");
    const { error: authError } = await supabase.auth.updateUser({
      data: { country: locationCountry || null, city: locationCity.trim() || null },
    });
    if (authError) { setLocationStatus("error"); return; }
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ country: locationCountry || null, city: locationCity.trim() || null })
      .eq("id", user.id);
    if (dbError) { setLocationStatus("error"); return; }
    setLocationStatus("saved");
    setEditingLocation(false);
    setTimeout(() => setLocationStatus("idle"), 2000);
  }

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    supabase
      .from("game_sessions")
      .select("id, mode, total_score, max_score, clip_count, played_at")
      .order("played_at", { ascending: false })
      .then(({ data, error }: { data: GameSession[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load game history:", error.message);
          setLoadError(true);
        } else {
          setSessions(data ?? []);
        }
      });

    // Contribution count is served by an API route (admin client), so it works
    // regardless of the submissions table's RLS configuration.
    fetch("/api/my-contributions")
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((json: { count?: number }) => {
        if (!cancelled) setContributions(json.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setContributions(0);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  // ── Loading (auth) ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--accent) transparent var(--accent) var(--accent)" }}
        />
      </div>
    );
  }

  // ── Sign-in gate ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main className="max-w-lg mx-auto px-5 pt-14 pb-10">
        <div className="text-left mb-6">
          <Link href="/" className="text-sm" style={{ color: "var(--on-bg-muted)" }}>
            {t.backLink}
          </Link>
        </div>
        <h1 className="text-2xl font-medium tracking-tight mb-1" style={{ color: "var(--heading)" }}>
          {t.profileTitle}
        </h1>
        <div
          className="rounded-xl p-6 mt-6 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text)" }}>
            {t.profileSignInTitle}
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            {t.profileSignInBody}
          </p>
          <Link
            href="/auth?redirectTo=/profile"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "var(--gold-ink)" }}
          >
            {t.signInCta}
          </Link>
        </div>
      </main>
    );
  }

  const displayName = (user.user_metadata?.display_name as string | undefined) ?? user.email;

  // ── Stats ──────────────────────────────────────────────────────────────────────
  const gamesPlayed = sessions?.length ?? 0;
  const bestScore = gamesPlayed ? Math.max(...sessions!.map((s) => s.total_score)) : 0;
  const avgAccuracy =
    gamesPlayed > 0
      ? sessions!.reduce((sum, s) => sum + (s.max_score > 0 ? s.total_score / s.max_score : 0), 0) /
        gamesPlayed
      : 0;

  const playedDates = sessions?.map((s) => s.played_at) ?? [];
  const currentStreak = computeCurrentStreak(playedDates);
  const longestStreak = computeLongestStreak(playedDates);

  const dateFmt = new Intl.DateTimeFormat(lang, { month: "short", day: "numeric", year: "numeric" });

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-5 pt-14 pb-16">
      <div className="text-left mb-6">
        <Link href="/" className="text-sm" style={{ color: "var(--on-bg-muted)" }}>
          {t.backLink}
        </Link>
      </div>

      <h1 className="text-2xl font-medium tracking-tight mb-1" style={{ color: "var(--heading)" }}>
        {t.profileTitle}
      </h1>
      <p className="text-sm truncate" style={{ color: "var(--on-bg-muted)" }}>
        {displayName}
      </p>

      {/* Location row */}
      <div className="flex items-center gap-2 mb-7 mt-1 flex-wrap">
        {!editingLocation ? (
          <>
            <span className="text-sm" style={{ color: "var(--text-faint)" }}>
              {locationCountry
                ? [new Intl.DisplayNames([lang], { type: "region" }).of(locationCountry), locationCity.trim()].filter(Boolean).join(", ")
                : t.profileCountryLabel}
            </span>
            <button
              onClick={() => setEditingLocation(true)}
              className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: "var(--surface)", color: "var(--text-muted)", border: "0.5px solid var(--border)" }}
            >
              {locationStatus === "saved" ? t.profileLocationSaved : t.profileEditLocation}
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <select
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
              className="text-sm rounded-lg px-3 py-2 appearance-none"
              style={{ background: "var(--surface)", color: locationCountry ? "var(--text)" : "var(--text-faint)", border: "0.5px solid var(--border)" }}
            >
              <option value="">{t.authCountryPlaceholder}</option>
              {allCountries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {locationCountry && (
              <input
                type="text"
                maxLength={60}
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder={t.profileCityPlaceholder}
                className="text-sm rounded-lg px-3 py-2"
                style={{ background: "var(--surface)", color: "var(--text)", border: "0.5px solid var(--border)" }}
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={saveLocation}
                disabled={locationStatus === "saving"}
                className="text-xs px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--gold-ink)" }}
              >
                {locationStatus === "saving" ? "…" : t.profileSaveLocation}
              </button>
              <button
                onClick={() => { setEditingLocation(false); setLocationStatus("idle"); }}
                className="text-xs px-3 py-1.5 rounded-md"
                style={{ background: "var(--surface)", color: "var(--text-muted)", border: "0.5px solid var(--border)" }}
              >
                {t.profileCancelEdit}
              </button>
            </div>
            {locationStatus === "error" && (
              <p className="text-xs" style={{ color: "var(--accent-2)" }}>{t.profileLocationError}</p>
            )}
          </div>
        )}
      </div>

      {/* Streak banner */}
      {currentStreak > 0 && (
        <div
          className="rounded-2xl px-5 py-4 mb-4 flex items-center gap-3.5"
          style={{ background: "var(--surface)", border: "1px solid var(--border-gold)", boxShadow: "var(--shadow-card)" }}
        >
          <span style={{ fontSize: "2rem", lineHeight: 1 }} aria-hidden>🔥</span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--heading)" }}>
                {currentStreak}
              </span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {t.streakUnitDays(currentStreak)}
              </span>
            </div>
            <div className="text-xs" style={{ color: "var(--text-faint)" }}>
              {t.profileStreakCurrent} · {t.profileStreakLongest(longestStreak)}
            </div>
          </div>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-7">
        {[
          { label: t.profileStatGames, value: gamesPlayed.toLocaleString() },
          { label: t.profileStatBest, value: bestScore.toLocaleString() },
          { label: t.profileStatAvg, value: `${Math.round(avgAccuracy * 100)}%` },
          { label: t.profileStatClips, value: contributions === null ? "—" : contributions.toLocaleString() },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl px-3 py-4 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "var(--on-bg-muted)" }}>
        {t.profileRecentGames}
      </p>

      {/* History list / empty / error / loading states */}
      {loadError ? (
        <p className="text-sm" style={{ color: "var(--accent-2)" }}>
          {t.profileLoadError}
        </p>
      ) : sessions === null ? (
        <div className="flex justify-center py-8">
          <span
            className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--accent) transparent var(--accent) var(--accent)" }}
          />
        </div>
      ) : sessions.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-10 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
        >
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            {t.profileNoGames}
          </p>
          <Link
            href="/play"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "var(--gold-ink)" }}
          >
            {t.profilePlayCta}
          </Link>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-card)" }}
        >
          {sessions.map((s, i) => {
            const ratio = s.max_score > 0 ? s.total_score / s.max_score : 0;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 sm:px-5 py-3"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {t.profileModeLabel(s.mode)}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {dateFmt.format(new Date(s.played_at))} · {t.profileClipCount(s.clip_count)}
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-base font-bold tabular-nums" style={{ color: tierColor(ratio) }}>
                    {s.total_score.toLocaleString()}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: "var(--text-faint)" }}>
                    {Math.round(ratio * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
