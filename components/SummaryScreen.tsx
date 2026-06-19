"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { Clip, Cluster } from "@/lib/scoring";
import { MAX_SCORE } from "@/lib/scoring";
import type { RoundResult } from "@/components/GameContainer";
import { useT, useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface SummaryScreenProps {
  results: RoundResult[];
  clips: Clip[];
  clusterMap: Record<string, Cluster>;
  maxPossible: number;
  onPlayAgain: () => void;
  mode?: string;
}

const REL_COLORS: Record<string, string> = {
  exact: "#1D9E75",
  adjacent: "#97C459",
  macro: "#CECBF6",
  none: "var(--surface-2)",
};

function tierColor(ratio: number): string {
  if (ratio >= 0.66) return "var(--score-high)";
  if (ratio >= 0.33) return "var(--score-mid)";
  return "var(--score-low)";
}

/* Big total counts up — the summary is the reward. */
function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);
  return value;
}

export function SummaryScreen({
  results,
  clips,
  clusterMap,
  maxPossible,
  onPlayAgain,
  mode = "classic",
}: SummaryScreenProps) {
  const t = useT();
  const { lang } = useLang();
  const { user, loading: authLoading } = useAuth();

  const grandTotal = results.reduce((sum, r) => sum + r.finalScore, 0);
  const ratio = maxPossible > 0 ? grandTotal / maxPossible : 0;
  const color = tierColor(ratio);
  const animatedTotal = useCountUp(grandTotal);
  const pct = Math.round(ratio * 100);

  // Persist the completed game for logged-in players. RLS restricts inserts to
  // the player's own user_id, so a direct client insert is safe here.
  // The ref guards against double-insert (StrictMode, re-renders) — one
  // SummaryScreen mount equals one completed game.
  const [saved, setSaved] = useState(false);
  const savedRef = useRef(false);

  const [fbText, setFbText] = useState("");
  const [fbState, setFbState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const submitFeedback = useCallback(async () => {
    if (!fbText.trim()) return;
    setFbState("submitting");
    try {
      const res = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fbText.trim() }),
      });
      setFbState(res.ok ? "done" : "error");
    } catch {
      setFbState("error");
    }
  }, [fbText]);
  useEffect(() => {
    if (authLoading || !user || savedRef.current) return;
    savedRef.current = true;
    supabase
      .from("game_sessions")
      .insert({
        user_id: user.id,
        mode,
        total_score: grandTotal,
        max_score: Math.round(maxPossible),
        clip_count: results.length,
      })
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) {
          // Allow a retry on a later render if the insert failed
          savedRef.current = false;
          console.error("Failed to save game session:", error.message);
        } else {
          setSaved(true);
        }
      });
  }, [authLoading, user, mode, grandTotal, maxPossible, results.length]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-5 pt-14 pb-16">
      <p
        className="text-xs uppercase tracking-[0.18em] mb-3"
        style={{ color: "var(--on-bg-muted)" }}
      >
        {t.summaryTitle}
      </p>

      {/* The reward — total displayed large & bold */}
      <div
        className="rounded-2xl px-6 py-9 mb-6 text-center lahjat-pop relative overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-gold)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          className="ar-display mb-3"
          style={{ color: "var(--accent)", fontSize: "1.9rem", opacity: 0.9 }}
        >
          لهجات
        </div>
        <div className="flex items-baseline justify-center gap-2">
          <span
            className="font-bold tabular-nums leading-none"
            style={{ fontSize: "clamp(3.5rem, 16vw, 5.5rem)", color }}
          >
            {animatedTotal}
          </span>
          <span
            className="text-2xl font-medium"
            style={{ color: "var(--text-faint)" }}
          >
            / {Math.round(maxPossible)}
          </span>
        </div>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          {`${pct}% — ${results.length} ${t.clipsLabel}`}
        </p>
        {/* progress meter */}
        <div
          className="mt-5 mx-auto max-w-xs h-2 rounded-full overflow-hidden"
          style={{ background: "var(--surface-2)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, pct)}%`, background: color }}
          />
        </div>
      </div>

      {/* Score persistence — saved tick for members, CTA card for guests */}
      {!authLoading && (
        <>
          {user ? (
            saved && (
              <div className="text-center -mt-3 mb-6">
                <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: "var(--text-faint)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t.scoreSaved}
                </p>
              </div>
            )
          ) : (
            <div
              className="rounded-2xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-gold)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--heading)" }}>
                  {t.saveScoresCta}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t.saveScoresBody}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  href="/auth?redirectTo=/play"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-center transition-opacity hover:opacity-85"
                  style={{ background: "var(--accent)", color: "var(--gold-ink)" }}
                >
                  {t.createAccount}
                </Link>
                <Link
                  href="/auth?redirectTo=/play"
                  className="text-xs text-center transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-faint)" }}
                >
                  {t.alreadyHaveAccount}
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* Per-clip breakdown — clean list */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {results.map((r, i) => {
          const clip = clips[i];
          const cluster = clip ? clusterMap[clip.answer.cluster] : null;
          const rRatio = MAX_SCORE > 0 ? r.finalScore / MAX_SCORE : 0;
          const hasBonus = r.multiplier > 1.001;
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-4 sm:px-5 py-3"
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
              }}
            >
              <span
                className="w-6 shrink-0 text-xs font-semibold tabular-nums"
                style={{ color: "var(--text-faint)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text)" }}
                >
                  {lang === "ar" ? (clip?.answer.city_ar ?? clip?.answer.city) : clip?.answer.city}, {clip?.answer.country}
                </div>
                <div
                  className="text-xs truncate flex items-center gap-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{
                      background:
                        REL_COLORS[r.score.relationship] ?? "var(--surface-2)",
                    }}
                  />
                  {lang === "ar" ? (cluster?.name_ar ?? cluster?.name ?? clip?.answer.cluster) : (cluster?.name ?? clip?.answer.cluster)}
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 shrink-0">
                <span
                  className="text-base font-bold tabular-nums"
                  style={{ color: tierColor(rRatio) }}
                >
                  {r.finalScore}
                </span>
                {hasBonus && (
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: "var(--accent)" }}
                  >
                    ×{r.multiplier.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* General feedback */}
      <div
        className="rounded-2xl px-5 py-4 mb-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
          {t.feedbackTitle}
        </p>
        {fbState === "done" ? (
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t.feedbackSuccess}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea
              rows={3}
              maxLength={5000}
              placeholder={t.feedbackPlaceholder}
              value={fbText}
              onChange={(e) => setFbText(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm resize-none"
              style={{
                background: "var(--surface-inset)",
                border: "1px solid var(--border-strong)",
                color: "var(--text)",
                outline: "none",
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={submitFeedback}
                disabled={fbState === "submitting" || !fbText.trim()}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity"
                style={{
                  background: "var(--accent)",
                  color: "var(--gold-ink)",
                  opacity: fbState === "submitting" || !fbText.trim() ? 0.5 : 1,
                }}
              >
                {fbState === "submitting" ? "…" : t.feedbackSubmit}
              </button>
              {fbState === "error" && (
                <p className="text-xs" style={{ color: "var(--accent-2)" }}>{t.feedbackError}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={onPlayAgain}
          className="w-full sm:flex-1 rounded-xl text-sm font-semibold transition-all duration-150"
          style={{
            minHeight: 48,
            background: "var(--accent)",
            color: "var(--gold-ink)",
            border: "1px solid var(--accent-strong)",
            boxShadow: "var(--shadow-lift)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          {t.playAgain}
        </button>
        <Link
          href="/dialects"
          className="w-full sm:w-auto rounded-xl text-sm font-medium flex items-center justify-center transition-opacity hover:opacity-85"
          style={{
            minHeight: 48,
            padding: "0 1.5rem",
            background: "rgba(236,226,205,0.06)",
            color: "var(--on-bg)",
            border: "1px solid var(--border-on-bg)",
          }}
        >
          {t.dialectMap}
        </Link>
      </div>
    </div>
  );
}
