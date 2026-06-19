"use client";

import { useState } from "react";
import type { Clip, Cluster } from "@/lib/scoring";
import { MAX_SCORE } from "@/lib/scoring";
import type { RoundResult } from "@/components/GameContainer";
import { useT } from "@/contexts/LanguageContext";
import { useCountUp } from "@/lib/useCountUp";

type ReportReason = "wrong_dialect" | "wrong_city" | "poor_quality" | "other";
type ReportState = "idle" | "open" | "submitting" | "done" | "error";

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

interface ScorePanelProps {
  result: RoundResult;
  clip: Clip;
  clusterMap: Record<string, Cluster>;
}

export function ScorePanel({ result, clip, clusterMap }: ScorePanelProps) {
  const t = useT();
  const { score, multiplier, finalScore } = result;

  const [reportState, setReportState] = useState<ReportState>("idle");
  const [reason, setReason] = useState<ReportReason>("wrong_dialect");
  const [note, setNote] = useState("");

  async function submitReport() {
    setReportState("submitting");
    try {
      const res = await fetch("/api/report-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clip_id: clip.id, reason, note: note.trim() || null }),
      });
      setReportState(res.ok ? "done" : "error");
    } catch {
      setReportState("error");
    }
  }

  const ratio = MAX_SCORE > 0 ? finalScore / MAX_SCORE : 0;
  const color = scoreColor(ratio);
  const animated = useCountUp(finalScore);

  const answerCluster = clusterMap[clip.answer.cluster];
  const guessedCluster = score.guessedCluster
    ? clusterMap[score.guessedCluster]
    : null;

  const hasBonus = multiplier > 1.001;
  const isTimedOut = multiplier < 0.001;
  const showSpeedTile = hasBonus || isTimedOut;
  const multStr = multiplier.toFixed(1);

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
        <div>
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
          {/* Speed-bonus breakdown — only shown when a bonus was applied */}
          {hasBonus && (
            <p className="text-xs mt-0.5 tabular-nums" style={{ color: "var(--text-faint)" }}>
              {t.multiplierBreakdown(score.total, multStr, finalScore)}
            </p>
          )}
        </div>
        {/* thin gold rule, a quiet calligraphic flourish */}
        <div
          className="flex-1 h-px mb-2.5 self-end"
          style={{ background: "var(--border-gold)" }}
        />
      </div>

      <div className="text-xs mb-4" style={{ color: isTimedOut ? "var(--accent-2)" : "var(--text-muted)" }}>
        {isTimedOut
          ? t.timesUp
          : t.kmFrom(score.distanceKm, clip.answer.city, clip.answer.country)}
      </div>

      {/* Breakdown */}
      <div
        className="grid gap-2 mb-4"
        style={{ gridTemplateColumns: showSpeedTile ? "repeat(4, 1fr)" : "repeat(3, 1fr)" }}
      >
        {[
          { label: t.distanceLabel, value: score.distancePoints },
          { label: t.dialectLabel, value: score.dialectPoints },
          { label: t.cityBonusLabel, value: score.exactCityBonus },
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

        {/* Speed tile — shown for bonus earned or timed-out penalty */}
        {showSpeedTile && (
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "var(--surface-inset)",
              boxShadow: "var(--shadow-inset)",
              border: "1px solid rgba(200,168,50,.18)",
            }}
          >
            <span
              className="block text-[11px] mb-1 uppercase tracking-wide"
              style={{ color: "var(--text-faint)" }}
            >
              {t.speedBonus}
            </span>
            <span
              className="font-bold text-lg tabular-nums"
              style={{ color: isTimedOut ? "var(--accent-2)" : "var(--accent)" }}
            >
              ×{multStr}
            </span>
          </div>
        )}
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
              background: REL_COLORS[score.relationship],
              color: REL_TEXT[score.relationship],
            }}
          >
            {relLabels[score.relationship]}
          </span>
        </div>

        {guessedCluster && (
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            {t.guessedNearest(score.guessedCity ?? "", guessedCluster.name)}
          </p>
        )}

        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
          {clip.reveal_draft ?? t.revealFallback}
        </p>

        {/* Per-clip report */}
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          {reportState === "done" ? (
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t.reportSuccess}</p>
          ) : reportState === "open" || reportState === "submitting" || reportState === "error" ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t.reportClip}</p>
              <div className="flex flex-wrap gap-2">
                {(["wrong_dialect", "wrong_city", "poor_quality", "other"] as ReportReason[]).map((r) => {
                  const labels: Record<ReportReason, string> = {
                    wrong_dialect: t.reportReasonWrongDialect,
                    wrong_city: t.reportReasonWrongCity,
                    poor_quality: t.reportReasonQuality,
                    other: t.reportReasonOther,
                  };
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className="text-xs px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background: reason === r ? "var(--accent)" : "var(--surface-inset)",
                        color: reason === r ? "var(--gold-ink)" : "var(--text-muted)",
                        border: "1px solid " + (reason === r ? "var(--accent)" : "var(--border-strong)"),
                      }}
                    >
                      {labels[r]}
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={2}
                maxLength={500}
                placeholder={t.reportNote}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-xs resize-none"
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
                  onClick={submitReport}
                  disabled={reportState === "submitting"}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity"
                  style={{
                    background: "var(--accent)",
                    color: "var(--gold-ink)",
                    opacity: reportState === "submitting" ? 0.6 : 1,
                  }}
                >
                  {reportState === "submitting" ? "…" : t.reportSubmit}
                </button>
                {reportState === "error" && (
                  <p className="text-xs" style={{ color: "var(--accent-2)" }}>{t.reportError}</p>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReportState("open")}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 flex items-center gap-1.5"
              style={{
                background: "var(--surface-inset)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-strong)",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              {t.reportClip}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
