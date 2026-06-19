"use client";

import { useEffect, useRef, useState } from "react";

const VOLUME_KEY = "lahjat-volume";
function getSavedVolume(): number {
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY) ?? "");
    return isNaN(v) ? 1 : Math.max(0, Math.min(1, v));
  } catch {
    return 1;
  }
}
function saveVolume(v: number) {
  try { localStorage.setItem(VOLUME_KEY, String(v)); } catch {}
}

interface VideoPlayerProps {
  audioUrl?: string | null;
  mediaType: "audio" | "video" | string;
  onPlayStart?: () => void;
  /** Reports the clip's real length (seconds) once the media metadata loads. */
  onDurationKnown?: (seconds: number) => void;
}

/*
  Media player wrapped in a parchment "tile panel" surface.
  - audio/*  -> full-width audio bar (see .lahjat-audio in globals.css)
  - video/*  -> inline <video> player
*/
export function VideoPlayer({
  audioUrl,
  mediaType,
  onPlayStart,
  onDurationKnown,
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  // Guard so onPlayStart fires only on the very first playback event per mount
  const playStartFired = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const vol = getSavedVolume();
    if (videoRef.current) videoRef.current.volume = vol;
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  const firePlayStart = () => {
    if (!playStartFired.current) {
      playStartFired.current = true;
      onPlayStart?.();
    }
  };
  const reportDuration = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const d = e.currentTarget.duration;
    if (Number.isFinite(d) && d > 0) onDurationKnown?.(d);
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    boxShadow: "var(--shadow-card)",
  };

  const isAudio = mediaType === "audio" || mediaType.startsWith("audio/");
  const isVideo = mediaType === "video" || mediaType.startsWith("video/");

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
          ref={audioRef}
          className="lahjat-audio"
          controls
          preload="metadata"
          src={audioUrl}
          onPlay={firePlayStart}
          onLoadedMetadata={reportDuration}
          onVolumeChange={(e) => saveVolume((e.currentTarget as HTMLAudioElement).volume)}
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
            preload="metadata"
            src={audioUrl}
            style={{ background: "#000" }}
            onPlay={firePlayStart}
            onLoadedMetadata={reportDuration}
            onVolumeChange={(e) => saveVolume((e.currentTarget as HTMLVideoElement).volume)}
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
