"use client";

import { useState } from "react";

interface VideoPlayerProps {
  youtubeId?: string | null;
  startSeconds?: number | null;
  audioUrl?: string | null;
  mediaType: "youtube" | "audio" | string;
}

/*
  Media player wrapped in a parchment "tile panel" surface.
  - audio  -> full-width, custom-styled play bar (see .lahjat-audio in globals.css)
  - youtube -> click-to-reveal embed behind a gold play medallion
*/
export function VideoPlayer({
  youtubeId,
  startSeconds,
  audioUrl,
  mediaType,
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    boxShadow: "var(--shadow-card)",
  };

  /* ---- Audio clip ---- */
  if (mediaType === "audio" && audioUrl) {
    return (
      <div className="rounded-2xl p-4 sm:p-5" style={cardStyle}>
        <div className="flex items-center gap-3 mb-3">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0"
            style={{ background: "var(--accent)", color: "var(--gold-ink)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
            </svg>
          </span>
          <span
            className="text-xs uppercase tracking-[0.16em]"
            style={{ color: "var(--text-faint)" }}
          >
            Listen to the clip
          </span>
        </div>
        <audio className="lahjat-audio" controls preload="metadata" src={audioUrl} />
      </div>
    );
  }

  /* ---- YouTube clip ---- */
  if (youtubeId) {
    const src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${
      startSeconds ?? 0
    }&rel=0`;

    return (
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          {playing ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={src}
              title="Dialect clip"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 group"
              style={{ background: "var(--surface)" }}
            >
              <span
                className="inline-flex items-center justify-center w-16 h-16 rounded-full transition-transform duration-150 group-hover:scale-105"
                style={{
                  background: "var(--accent)",
                  color: "var(--gold-ink)",
                  boxShadow: "var(--shadow-lift)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Click to listen
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ---- Fallback ---- */
  return (
    <div
      className="rounded-2xl p-8 text-center text-sm"
      style={{ ...cardStyle, color: "var(--text-muted)" }}
    >
      No clip available
    </div>
  );
}
