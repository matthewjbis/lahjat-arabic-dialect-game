"use client";

import { useState, useCallback } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { GameMap } from "@/components/GameMap";
import { ScorePanel } from "@/components/ScorePanel";
import { LangToggle } from "@/components/LangToggle";
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

export function GameContainer({ dialectData, clips }: GameContainerProps) {
  const t = useT();

  const [clipIndex, setClipIndex] = useState(0);
  const [guess, setGuess] = useState<GuessState | null>(null);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);

  const clusterMap: Record<string, Cluster> = Object.fromEntries(
    dialectData.clusters.map((c) => [c.id, c])
  );

  const currentClip = clips[clipIndex];
  const isLastClip = clipIndex === clips.length - 1;

  const handleGuess = useCallback((lat: number, lon: number) => {
    if (locked) return;
    setGuess({ lat, lon });
  }, [locked]);

  function handleSubmit() {
    if (!guess || locked) return;
    const scored = scoreGuess(guess.lat, guess.lon, currentClip, dialectData);
    setResult(scored);
    setLocked(true);
  }

  function handleNext() {
    setClipIndex((i) => i + 1);
    setGuess(null);
    setLocked(false);
    setResult(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-7 pb-12">
      <div className="flex items-center justify-between mb-1">
        <h1
          className="text-2xl font-medium tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Lahjat{" "}
          <span style={{ fontFamily: "serif", fontWeight: 400 }}>لهجات</span>
        </h1>
        <div className="flex items-center gap-3">
          <LangToggle />
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}
          >
            {t.clipOf(clipIndex + 1, clips.length)}
          </span>
        </div>
      </div>

      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        {t.subtitle}
      </p>

      <VideoPlayer
        key={currentClip.youtube_id}
        youtubeId={currentClip.youtube_id}
        startSeconds={currentClip.start_seconds}
      />

      <p className="text-xs mb-2.5" style={{ color: "var(--text-muted)" }}>
        {locked ? t.instructionsAfter : t.instructionsBefore}
      </p>

      <GameMap
        onGuess={handleGuess}
        locked={locked}
        guess={guess}
        answer={locked ? { lat: currentClip.answer.lat, lon: currentClip.answer.lon } : null}
        cities={dialectData.cities}
      />

      <div className="flex gap-2.5 mb-3.5">
        <button
          onClick={handleSubmit}
          disabled={!guess || locked}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:cursor-not-allowed"
          style={{
            background: !guess || locked ? "var(--surface-2)" : "var(--accent)",
            color: !guess || locked ? "var(--text-faint)" : "#fff",
          }}
        >
          {t.submitGuess}
        </button>

        {guess && !locked && (
          <button
            onClick={() => setGuess(null)}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85"
            style={{ background: "var(--accent-2)", color: "#fff" }}
          >
            {t.resetPin}
          </button>
        )}

        {locked && !isLastClip && (
          <button
            onClick={handleNext}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            {t.nextClip}
          </button>
        )}

        {locked && isLastClip && (
          <button
            onClick={() => {
              setClipIndex(0);
              setGuess(null);
              setLocked(false);
              setResult(null);
            }}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            {t.playAgain}
          </button>
        )}
      </div>

      {result && (
        <ScorePanel
          result={result}
          clip={currentClip}
          clusterMap={clusterMap}
        />
      )}
    </div>
  );
}
