"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { VideoPlayer } from "@/components/VideoPlayer";
import { GameMap } from "@/components/GameMap";
import { ScorePanel } from "@/components/ScorePanel";
import { SummaryScreen } from "@/components/SummaryScreen";
import { useT } from "@/contexts/LanguageContext";
import { useSound } from "@/contexts/SoundContext";
import { scoreGuess, MAX_SCORE } from "@/lib/scoring";
import type { Clip, Cluster, DialectData, ScoreResult } from "@/lib/scoring";

const CLIPS_PER_ROUND = 10;

// --- Tunable speed-bonus / penalty constants ---
const TIMER_MAX_MULTIPLIER = 1.5; // Tunable: multiplier at instant submission
const TIMER_WINDOW_SEC = 15;      // Tunable: seconds to decay from 1.5× down to 1.0×
const TIMER_PENALTY_SEC = 20;     // Tunable: additional seconds from 1.0× down to 0× (auto-fail)

// Phase 1 (0 → TIMER_WINDOW_SEC):      1.5× → 1.0× (speed bonus)
// Phase 2 (TIMER_WINDOW_SEC → total):  1.0× → 0×   (penalty; hits 0 → auto-fail)
function computeMultiplier(startMs: number): number {
  const elapsed = (Date.now() - startMs) / 1000;
  if (elapsed <= TIMER_WINDOW_SEC) {
    const t = elapsed / TIMER_WINDOW_SEC;
    return TIMER_MAX_MULTIPLIER - (TIMER_MAX_MULTIPLIER - 1) * t;
  }
  const t = Math.min(1, (elapsed - TIMER_WINDOW_SEC) / TIMER_PENALTY_SEC);
  return 1 - t;
}

export interface RoundResult {
  score: ScoreResult;
  multiplier: number;
  finalScore: number;
}

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

function multiplierColor(mult: number): string {
  if (mult < 1.0) return "var(--accent-2)"; // penalty zone: red
  const ratio = (mult - 1.0) / (TIMER_MAX_MULTIPLIER - 1.0);
  if (ratio > 0.55) return "var(--accent)";
  if (ratio > 0.2) return "var(--score-mid)";
  return "var(--text-faint)";
}

// Bar fills 100% → 50% during bonus phase, then 50% → 0% during penalty phase
function barFill(mult: number): number {
  if (mult >= 1.0) return 50 + ((mult - 1.0) / (TIMER_MAX_MULTIPLIER - 1.0)) * 50;
  return Math.max(0, mult * 50);
}

export function GameContainer({ dialectData, clips }: GameContainerProps) {
  const t = useT();
  const playSound = useSound();

  const [shuffledClips, setShuffledClips] = useState(() => shuffle(clips).slice(0, CLIPS_PER_ROUND));
  const [clipIndex, setClipIndex] = useState(0);
  const [guess, setGuess] = useState<GuessState | null>(null);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [flash, setFlash] = useState(false);

  // Timer state — set to Date.now() the first time the player starts the clip
  const [playStartedAt, setPlayStartedAt] = useState<number | null>(null);
  const [liveMultiplier, setLiveMultiplier] = useState<number | null>(null);

  // Tick the live multiplier display while the player is deciding
  useEffect(() => {
    if (playStartedAt === null || locked) {
      setLiveMultiplier(null);
      return;
    }
    const tick = () => {
      setLiveMultiplier(Math.max(0, computeMultiplier(playStartedAt)));
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [playStartedAt, locked]);

  // Auto-fail when the penalty timer hits 0
  useEffect(() => {
    if (liveMultiplier === null || liveMultiplier > 0 || locked) return;
    const zeroScore: ScoreResult = {
      total: 0, distanceKm: 0, distancePoints: 0, dialectPoints: 0,
      relationship: "none", guessedCluster: null, guessedCity: null, exactCityBonus: 0,
    };
    const roundResult: RoundResult = { score: zeroScore, multiplier: 0, finalScore: 0 };
    playSound("fail");
    setResult(roundResult);
    setResults((prev) => [...prev, roundResult]);
    setLocked(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 650);
  }, [liveMultiplier, locked, playSound]);

  const clusterMap: Record<string, Cluster> = useMemo(
    () => Object.fromEntries(dialectData.clusters.map((c) => [c.id, c])),
    [dialectData.clusters]
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

  const handlePlayStart = useCallback(() => {
    // Functional update: only record the first play; ignore subsequent fires
    setPlayStartedAt((prev) => (prev === null ? Date.now() : prev));
  }, []);

  function handleSubmit() {
    if (!guess || locked) return;
    const scored = scoreGuess(guess.lat, guess.lon, currentClip, dialectData);

    const multiplier =
      playStartedAt !== null ? Math.max(0, computeMultiplier(playStartedAt)) : 1.0;
    const finalScore = Math.round(scored.total * multiplier);

    // Play the result sound on the submit click — satisfies browser autoplay policy
    const soundKind =
      scored.relationship === "exact"
        ? "success"
        : scored.relationship === "none"
        ? "fail"
        : "medium";
    playSound(soundKind);

    const roundResult: RoundResult = { score: scored, multiplier, finalScore };
    setResult(roundResult);
    setResults((prev) => [...prev, roundResult]);
    setLocked(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 650);
  }

  function handleNext() {
    setClipIndex((i) => i + 1);
    setGuess(null);
    setLocked(false);
    setResult(null);
    setPlayStartedAt(null);
  }

  function handlePlayAgain() {
    setShuffledClips(shuffle(clips).slice(0, CLIPS_PER_ROUND));
    setClipIndex(0);
    setGuess(null);
    setLocked(false);
    setResult(null);
    setResults([]);
    setShowSummary(false);
    setPlayStartedAt(null);
  }

  if (showSummary) {
    return (
      <SummaryScreen
        results={results}
        clips={shuffledClips}
        clusterMap={clusterMap}
        maxPossible={shuffledClips.length * MAX_SCORE * TIMER_MAX_MULTIPLIER}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  const currentBarFill = liveMultiplier !== null ? barFill(liveMultiplier) : 0;
  const currentColor = liveMultiplier !== null ? multiplierColor(liveMultiplier) : "var(--text-faint)";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-5 pt-14 sm:pt-7 pb-16">
      {/* Header — centred regardless of text direction */}
      <header className="flex items-center justify-start flex-wrap gap-x-4 gap-y-2 mb-3">
        <Brand />
        <nav className="flex items-center justify-center gap-2 flex-wrap">
          <NavPill href="/">{t.homeMenu}</NavPill>
          <NavPill href="/dialects">{t.dialectMap}</NavPill>
          <NavPill href="/contribute">{t.contribute}</NavPill>
        </nav>
      </header>

      {/* Journey progress strip */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-4 mb-1.5">
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
      <div className="mb-3">
        <VideoPlayer
          key={currentClip.id}
          youtubeId={currentClip.youtube_id}
          startSeconds={currentClip.start_seconds}
          audioUrl={currentClip.audio_url}
          mediaType={currentClip.media_type ?? "youtube"}
          onPlayStart={handlePlayStart}
        />
      </div>

      {/* Live speed-bonus badge — appears after first play, before submit */}
      {liveMultiplier !== null && !locked && (
        <div
          className="rounded-xl px-3.5 py-2 mb-3 flex items-center gap-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
          }}
        >
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            {t.speedBonus}
          </span>
          <span
            className="text-sm font-bold tabular-nums ml-auto"
            style={{ color: currentColor }}
          >
            ×{liveMultiplier.toFixed(1)}
          </span>
          {/* Depleting bar — gold in bonus phase, red in penalty phase */}
          <div
            className="w-24 h-1.5 rounded-full overflow-hidden shrink-0"
            style={{ background: "rgba(236,226,205,0.12)" }}
          >
            <div
              className="h-full rounded-full transition-none"
              style={{
                width: `${currentBarFill}%`,
                background: currentColor,
              }}
            />
          </div>
        </div>
      )}

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
            {t.nextClip}
          </button>
        )}

        {locked && isLastClip && (
          <button
            onClick={() => { playSound("endscreen"); setShowSummary(true); }}
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
