"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { VideoPlayer } from "@/components/VideoPlayer";
import { GameMap } from "@/components/GameMap";
import { ScorePanel } from "@/components/ScorePanel";
import { SummaryScreen } from "@/components/SummaryScreen";
import { useT } from "@/contexts/LanguageContext";
import { scoreGuess } from "@/lib/scoring";
import type { Clip, Cluster, DialectData, ScoreResult } from "@/lib/scoring";

interface GameContainerProps {
  dialectData: DialectData;
  clips: Clip[];
}

interface GuessState {
  lat: number;
  lon: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---- Reusable header (title + nav). Wraps gracefully on narrow screens. ---- */
function Brand({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <h1
      className={`font-semibold tracking-tight flex items-baseline gap-2 ${
        size === "lg" ? "text-3xl" : "text-xl"
      }`}
    >
      <span style={{ color: "var(--heading)" }}>Lahjat</span>
      <span
        className="ar-display"
        style={{ color: "var(--heading)", fontSize: size === "lg" ? "2.4rem" : "1.7rem" }}
      >
        لهجات
      </span>
    </h1>
  );
}

function NavPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
      style={{
        background: "rgba(236,226,205,0.06)",
        color: "var(--on-bg-muted)",
        border: "1px solid var(--border-on-bg)",
      }}
    >
      {children}
    </Link>
  );
}

export function GameContainer({ dialectData, clips }: GameContainerProps) {
  const t = useT();

  const [shuffledClips, setShuffledClips] = useState(() => shuffle(clips));
  const [clipIndex, setClipIndex] = useState(0);
  const [guess, setGuess] = useState<GuessState | null>(null);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [flash, setFlash] = useState(false);

  const clusterMap: Record<string, Cluster> = Object.fromEntries(
    dialectData.clusters.map((c) => [c.id, c])
  );

  const currentClip = shuffledClips[clipIndex];
  const isLastClip = clipIndex === shuffledClips.length - 1;
  const total = shuffledClips.length;

  const handleGuess = useCallback(
    (lat: number, lon: number) => {
      if (locked) return;
      setGuess({ lat, lon });
    },
    [locked]
  );

  function handleSubmit() {
    if (!guess || locked) return;
    const scored = scoreGuess(guess.lat, guess.lon, currentClip, dialectData);
    setResult(scored);
    setResults((prev) => [...prev, scored]);
    setLocked(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 650);
  }

  function handleNext() {
    setClipIndex((i) => i + 1);
    setGuess(null);
    setLocked(false);
    setResult(null);
  }

  function handlePlayAgain() {
    setShuffledClips(shuffle(clips));
    setClipIndex(0);
    setGuess(null);
    setLocked(false);
    setResult(null);
    setResults([]);
    setShowSummary(false);
  }

  if (showSummary) {
    return (
      <SummaryScreen
        results={results}
        clips={shuffledClips}
        clusterMap={clusterMap}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-5 py-5 sm:py-7 pb-16">
      {/* Header — single flex row that wraps on small screens */}
      <header className="flex items-center justify-between flex-wrap gap-y-3 gap-x-3 mb-3">
        <Brand />
        <nav className="flex items-center gap-2 flex-wrap">
          <NavPill href="/dialects">{t.dialectMap}</NavPill>
          <NavPill href="/contribute">{t.contribute}</NavPill>
        </nav>
      </header>

      {/* Journey progress strip */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs sm:text-sm" style={{ color: "var(--on-bg-muted)" }}>
            {t.subtitle}
          </p>
          <span
            className="text-xs font-medium tabular-nums shrink-0"
            style={{ color: "var(--accent)" }}
          >
            {t.clipOf(clipIndex + 1, total)}
          </span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                background:
                  i < clipIndex
                    ? "var(--accent)"
                    : i === clipIndex
                    ? "var(--accent-soft)"
                    : "rgba(236,226,205,0.14)",
                boxShadow: i === clipIndex ? "0 0 0 1px rgba(200,168,50,.4)" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Media player card */}
      <div className="mb-4">
        <VideoPlayer
          key={currentClip.id}
          youtubeId={currentClip.youtube_id}
          startSeconds={currentClip.start_seconds}
          audioUrl={currentClip.audio_url}
          mediaType={currentClip.media_type ?? "youtube"}
        />
      </div>

      <p className="text-xs mb-2.5" style={{ color: "var(--on-bg-muted)" }}>
        {locked ? t.instructionsAfter : t.instructionsBefore}
      </p>

      {/* Map card — flashes gold when a guess is locked in */}
      <div
        className={`rounded-2xl overflow-hidden mb-4 ${flash ? "lahjat-flash" : ""}`}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <GameMap
          onGuess={handleGuess}
          locked={locked}
          guess={guess}
          answer={
            locked
              ? { lat: currentClip.answer.lat, lon: currentClip.answer.lon }
              : null
          }
          cities={dialectData.cities}
        />
      </div>

      {/* Actions — full-width & thumb-friendly on mobile, inline on larger screens */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 mb-4">
        {!locked && (
          <button
            onClick={handleSubmit}
            disabled={!guess}
            className="w-full sm:w-auto rounded-xl text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed active:translate-y-0"
            style={{
              minHeight: 48,
              padding: "0 1.5rem",
              background: !guess ? "rgba(236,226,205,0.08)" : "var(--accent)",
              color: !guess ? "var(--on-bg-faint)" : "var(--gold-ink)",
              border: !guess ? "1px solid var(--border-on-bg)" : "1px solid var(--accent-strong)",
              boxShadow: !guess ? "none" : "var(--shadow-lift)",
            }}
            onMouseEnter={(e) => {
              if (guess) e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {t.submitGuess}
          </button>
        )}

        {guess && !locked && (
          <button
            onClick={() => setGuess(null)}
            className="w-full sm:w-auto rounded-xl text-sm font-medium transition-opacity hover:opacity-85"
            style={{
              minHeight: 48,
              padding: "0 1.25rem",
              background: "transparent",
              color: "var(--accent-2)",
              border: "1px solid color-mix(in srgb, var(--accent-2) 55%, transparent)",
            }}
          >
            {t.resetPin}
          </button>
        )}

        {locked && !isLastClip && (
          <button
            onClick={handleNext}
            className="w-full sm:w-auto rounded-xl text-sm font-semibold transition-all duration-150"
            style={{
              minHeight: 48,
              padding: "0 1.75rem",
              background: "var(--accent)",
              color: "var(--gold-ink)",
              border: "1px solid var(--accent-strong)",
              boxShadow: "var(--shadow-lift)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {t.nextClip} →
          </button>
        )}

        {locked && isLastClip && (
          <button
            onClick={() => setShowSummary(true)}
            className="w-full sm:w-auto rounded-xl text-sm font-semibold transition-all duration-150"
            style={{
              minHeight: 48,
              padding: "0 1.75rem",
              background: "var(--accent)",
              color: "var(--gold-ink)",
              border: "1px solid var(--accent-strong)",
              boxShadow: "var(--shadow-lift)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {t.viewResults} →
          </button>
        )}
      </div>

      {result && (
        <ScorePanel result={result} clip={currentClip} clusterMap={clusterMap} />
      )}
    </div>
  );
}
