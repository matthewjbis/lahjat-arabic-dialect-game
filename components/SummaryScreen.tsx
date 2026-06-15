"use client";

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

interface SummaryScreenProps {
  results: ScoreResult[];
  clips: Clip[];
  clusterMap: Record<string, Cluster>;
  onPlayAgain: () => void;
}

export function SummaryScreen({
  results,
  clips,
  clusterMap,
  onPlayAgain,
}: SummaryScreenProps) {
  const t = useT();

  const total = results.reduce((sum, r) => sum + r.total, 0);
  const maxTotal = MAX_SCORE * clips.length;
  const pct = total / maxTotal;

  const relLabels: Record<string, string> = {
    exact: t.relExact,
    adjacent: t.relAdjacent,
    macro: t.relMacro,
    none: t.relNone,
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-7 pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-medium tracking-tight mb-1"
          style={{ color: "var(--text)" }}
        >
          Lahjat{" "}
          <span style={{ fontFamily: "serif", fontWeight: 400 }}>لهجات</span>
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.summaryTitle}
        </p>
      </div>

      {/* Score card */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{ background: "var(--surface)" }}
      >
        <div
          className="text-3xl font-semibold mb-1"
          style={{ color: "var(--text)" }}
        >
          {t.points(total, maxTotal)}
        </div>
        <span
          className="inline-block text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {t.tierLabel(pct)}
        </span>
      </div>

      {/* Per-clip breakdown */}
      <div
        className="rounded-xl overflow-hidden mb-4"
        style={{ background: "var(--surface)" }}
      >
        {results.map((result, i) => {
          const clip = clips[i];
          const answerCluster = clusterMap[clip.answer.cluster];

          return (
            <div
              key={clip.id}
              className="flex items-center gap-3 px-4 py-3 text-sm"
              style={{
                borderBottom:
                  i < results.length - 1
                    ? "0.5px solid var(--border)"
                    : undefined,
              }}
            >
              {/* Clip number */}
              <span
                className="text-xs tabular-nums shrink-0 w-14"
                style={{ color: "var(--text-faint)" }}
              >
                {t.clipLabel(i + 1)}
              </span>

              {/* Location + cluster */}
              <div className="flex-1 min-w-0">
                <span
                  className="font-medium truncate block"
                  style={{ color: "var(--text)" }}
                >
                  {clip.answer.city}, {clip.answer.country}
                </span>
                <span
                  className="text-xs truncate block"
                  style={{ color: "var(--text-muted)" }}
                >
                  {answerCluster?.name ?? clip.answer.cluster}
                </span>
              </div>

              {/* Relationship badge */}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 hidden sm:inline-block"
                style={{
                  background: REL_COLORS[result.relationship],
                  color: REL_TEXT[result.relationship],
                }}
              >
                {relLabels[result.relationship]}
              </span>

              {/* Score */}
              <span
                className="text-sm font-semibold tabular-nums shrink-0 w-14 text-end"
                style={{ color: "var(--text)" }}
              >
                {result.total.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Play again */}
      <button
        onClick={onPlayAgain}
        className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        {t.playAgain}
      </button>
    </div>
  );
}
