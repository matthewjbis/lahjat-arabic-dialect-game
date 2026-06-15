import type { Clip, Cluster, ScoreResult } from "@/lib/scoring";
import { MAX_SCORE } from "@/lib/scoring";

const REL_LABELS: Record<string, string> = {
  exact: "Right dialect",
  adjacent: "Closely related dialect",
  macro: "Same broad family",
  none: "Different dialect family",
};

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

interface ScorePanelProps {
  result: ScoreResult;
  clip: Clip;
  clusterMap: Record<string, Cluster>;
}

export function ScorePanel({ result, clip, clusterMap }: ScorePanelProps) {
  const answerCluster = clusterMap[clip.answer.cluster];
  const guessedCluster = result.guessedCluster
    ? clusterMap[result.guessedCluster]
    : null;

  return (
    <div
      className="rounded-xl p-5 text-sm"
      style={{ background: "var(--surface)" }}
    >
      <div className="text-xl font-semibold mb-1" style={{ color: "var(--text)" }}>
        {result.total.toLocaleString()} / {MAX_SCORE.toLocaleString()} points
      </div>
      <div className="text-xs mb-3.5" style={{ color: "var(--text-muted)" }}>
        {result.distanceKm.toLocaleString()} km from {clip.answer.city},{" "}
        {clip.answer.country}
      </div>

      <div className="grid gap-2 mb-3.5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { label: "Distance", value: result.distancePoints },
          { label: "Dialect", value: result.dialectPoints },
          { label: "City bonus", value: result.exactCityBonus },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg px-2.5 py-2"
            style={{ background: "var(--surface-2)" }}
          >
            <span
              className="block text-xs mb-0.5"
              style={{ color: "var(--text-faint)" }}
            >
              {label}
            </span>
            <span
              className="font-semibold text-base"
              style={{ color: "var(--text)" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <div
        className="pt-3"
        style={{ borderTop: "0.5px solid var(--border)", color: "var(--text)" }}
      >
        <div className="flex items-center gap-2 flex-wrap mb-2 text-sm font-medium">
          {clip.answer.city}, {clip.answer.country} —{" "}
          {answerCluster?.name ?? clip.answer.cluster}
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: REL_COLORS[result.relationship],
              color: REL_TEXT[result.relationship],
            }}
          >
            {REL_LABELS[result.relationship]}
          </span>
        </div>

        {guessedCluster && (
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            Your guess landed nearest to {result.guessedCity} (
            {guessedCluster.name}).
          </p>
        )}

        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
          {clip.reveal_draft ?? "Reveal text coming soon."}
        </p>
      </div>
    </div>
  );
}
