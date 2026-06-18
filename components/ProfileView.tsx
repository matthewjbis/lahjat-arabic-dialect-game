"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useT, useLang } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

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
      <main className="max-w-lg mx-auto px-5 py-10">
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

  const dateFmt = new Intl.DateTimeFormat(lang, { month: "short", day: "numeric", year: "numeric" });

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-5 pt-14 sm:pt-12 pb-16">
      <div className="text-left mb-6">
        <Link href="/" className="text-sm" style={{ color: "var(--on-bg-muted)" }}>
          {t.backLink}
        </Link>
      </div>

      <h1 className="text-2xl font-medium tracking-tight mb-1" style={{ color: "var(--heading)" }}>
        {t.profileTitle}
      </h1>
      <p className="text-sm mb-7 truncate" style={{ color: "var(--on-bg-muted)" }}>
        {displayName}
      </p>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-2.5 mb-7">
        {[
          { label: t.profileStatGames, value: gamesPlayed.toLocaleString() },
          { label: t.profileStatBest, value: bestScore.toLocaleString() },
          { label: t.profileStatAvg, value: `${Math.round(avgAccuracy * 100)}%` },
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
