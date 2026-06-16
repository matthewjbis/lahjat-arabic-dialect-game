"use client";

import { useEffect, useRef, useState } from "react";
import type { Clip, Cluster, ScoreResult } from "@/lib/scoring";
import { MAX_SCORE } from "@/lib/scoring";
import { useT } from "@/contexts/LanguageContext";

const REL_COLORS: Record<string, string> = {
  exact: "#1D9E75",
  adjacent: "#97C459",
  macro: "#CECBF6",
  none: "var(--surface-2)",
};

const REL_TEXT: Record<string, string> = {
  exact: "#fff",
  adjacent: "#1a1a18",
  macro: "#1a1a18",
  none: "var(--text-muted)",
};

/* Score colour-coding: green for high, amber for mid, muted for low. */
function scoreColor(ratio: number): string {
  if (ratio >= 0.66) return "var(--score-high)";
  if (ratio >= 0.33) return "var(--score-mid)";
  return "var(--score-low)";
}

/* Count a number up from 0 — the reveal should feel earned. */
function useCountUp(target: number, duration = 900): number {
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
      // easeOutCubic
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

interface ScorePanelProps {
  result: ScoreResult;
  clip: Clip;
  clusterMap: Record<string, Cluster>;
}

export function ScorePanel({ result, clip, clusterMap }: ScorePanelProps) {
  const t = useT();

  const ratio = MAX_SCORE > 0 ? result.total / MAX_SCORE : 0;
  const color = scoreColor(ratio);
  const animated = useCountUp(result.total);

  const answerCluster = clusterMap[clip.answer.cluster];
  const guessedCluster = result.guessedCluster
    ? clusterMap[result.guessedCluster]
    : null;

  const relLabels: Record<string, string> = {
    exact: t.relExact,
    adjacent: t.relAdjacent,
    macro: t.relMacro,
    none: t.relNone,
  };

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 text-sm lahjat-pop"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Earned score — large, colour-coded, counts up */}
      <div className="flex items-end justify-between gap-3 mb-1">
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-bold tabular-nums leading-none"
            style={{ fontSize: "2.75rem", color }}
          >
            {animated}
          </span>
          <span
            className="text-base font-medium"
            style={{ color: "var(--text-faint)" }}
          >
            / {MAX_SCORE}
          </span>
        </div>
        {/* thin gold rule, a quiet calligraphic flourish */}
        <div
          className="flex-1 h-px mb-2.5"
          style={{ background: "var(--border-gold)" }}
        />
      </div>

      <div className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        {t.kmFrom(result.distanceKm, clip.answer.city, clip.answer.country)}
      </div>

      {/* Breakdown */}
      <div
        className="grid gap-2 mb-4"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {[
          { label: t.distanceLabel, value: result.distancePoints },
          { label: t.dialectLabel, value: result.dialectPoints },
          { label: t.cityBonusLabel, value: result.exactCityBonus },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "var(--surface-inset)",
              boxShadow: "var(--shadow-inset)",
            }}
          >
            <span
              className="block text-[11px] mb-1 uppercase tracking-wide"
              style={{ color: "var(--text-faint)" }}
            >
              {label}
            </span>
            <span
              className="font-bold text-lg tabular-nums"
              style={{ color: "var(--text)" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Reveal */}
      <div
        className="pt-3.5"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text)" }}
      >
        <div className="flex items-center gap-2 flex-wrap mb-2 text-sm font-semibold">
          {clip.answer.city}, {clip.answer.country} —{" "}
          {answerCluster?.name ?? clip.answer.cluster}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: REL_COLORS[result.relationship],
              color: REL_TEXT[result.relationship],
            }}
          >
            {relLabels[result.relationship]}
          </span>
        </div>

        {guessedCluster && (
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            {t.guessedNearest(result.guessedCity ?? "", guessedCluster.name)}
          </p>
        )}

        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
          {clip.reveal_draft ?? t.revealFallback}
        </p>
      </div>
    </div>
  );
}
