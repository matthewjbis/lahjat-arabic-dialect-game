"use client";

import { useEffect, useState } from "react";
import { GameContainer } from "@/components/GameContainer";
import type { Clip, DialectData } from "@/lib/scoring";

interface GameLoaderProps {
  dialectData: DialectData;
  mode?: string;
}

export function GameLoader({ dialectData, mode = "standard" }: GameLoaderProps) {
  const [clips, setClips] = useState<Clip[] | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch("/api/clips")
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json() as Promise<Clip[]>;
      })
      .then(setClips)
      .catch(() => setFetchError(true));
  }, []);

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Could not load clips — please refresh.
        </p>
      </div>
    );
  }

  if (!clips) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          {/* Pulsing gold ring */}
          <span
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--accent) transparent var(--accent) var(--accent)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            Loading clips…
          </p>
        </div>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No clips available yet — check back soon.
        </p>
      </div>
    );
  }

  return <GameContainer dialectData={dialectData} clips={clips} mode={mode} />;
}
