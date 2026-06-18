"use client";

import { useRef, useState } from "react";

interface VideoPlayerProps {
  youtubeId?: string | null;
  startSeconds?: number | null;
  audioUrl?: string | null;
  mediaType: "youtube" | "audio" | string;
  onPlayStart?: () => void;
}

/*
  Media player wrapped in a parchment "tile panel" surface.
  - audio/*  -> full-width audio bar (see .lahjat-audio in globals.css)
  - video/*  -> inline <video> player
  - youtube  -> click-to-reveal embed behind a gold play medallion
*/
export function VideoPlayer({
  youtubeId,
  startSeconds,
  audioUrl,
  mediaType,
  onPlayStart,
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  // Guard so onPlayStart fires only on the very first playback event per mount
  const playStartFired = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const firePlayStart = () => {
    if (!playStartFired.current) {
      playStartFired.current = true;
      onPlayStart?.();
    }
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    boxShadow: "var(--shadow-card)",
  };

  const isAudio = mediaType === "audio" || mediaType.startsWith("audio/");
  const isVideo = mediaType.startsWith("video/");

  /* ---- Audio clip (audio/webm, audio/mp4, audio/mpeg, etc.) ---- */
  if (isAudio && audioUrl) {
    return (
      <div className="rounded-2xl p-4 sm:p-5" style={cardStyle}>
        <div className="flex items-center justify-center gap-3 mb-3">
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
        <audio
          className="lahjat-audio"
          controls
          preload="metadata"
          src={audioUrl}
          onPlay={firePlayStart}
        />
      </div>
    );
  }

  /* ---- Video clip (video/mp4, video/webm, video/quicktime, etc.) ---- */
  if (isVideo && audioUrl) {
    return (
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full"
            controls
            playsInline
            disablePictureInPicture
            preload="none"
            src={audioUrl}
            style={{ background: "#000" }}
            onPlay={firePlayStart}
          />
          {!playing && (
            <button
              type="button"
              onClick={() => {
                setPlaying(true);
                videoRef.current?.play();
                firePlayStart();
              }}
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
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                Click to watch
              </span>
            </button>
          )}
        </div>
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
              onClick={() => { setPlaying(true); firePlayStart(); }}
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
