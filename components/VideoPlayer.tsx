"use client";

import { useState, useEffect, useRef } from "react";
import { useT } from "@/contexts/LanguageContext";

interface VideoPlayerProps {
  youtubeId: string;
  startSeconds: number;
  audioUrl?: string;
  mediaType?: string;
}

const CLIP_SECONDS = 30;

export function VideoPlayer({ youtubeId, startSeconds, audioUrl, mediaType }: VideoPlayerProps) {
  const t = useT();
  const [revealed, setRevealed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const isVideo = mediaType?.startsWith("video/") ?? false;

  // Auto-pause after CLIP_SECONDS once the player is revealed
  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => {
      if (audioUrl) {
        mediaRef.current?.pause();
      } else {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      }
    }, CLIP_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [revealed, audioUrl]);

  // enablejsapi=1 is required for the postMessage pause command to work
  const src = `https://www.youtube.com/embed/${youtubeId}?start=${startSeconds}&autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1`;

  const cover = (
    <button
      onClick={() => setRevealed(true)}
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3"
      style={{ background: "var(--surface)", cursor: "pointer" }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "var(--accent)" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 3 }}>
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
        {t.clickToListen}
      </span>
    </button>
  );

  if (audioUrl) {
    return (
      <div
        className="relative w-full rounded-xl overflow-hidden mb-3.5 flex items-center justify-center"
        style={isVideo ? { aspectRatio: "16/9" } : { minHeight: "120px", background: "var(--surface)" }}
      >
        {!revealed ? cover : isVideo ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={audioUrl}
            controls
            autoPlay
            className="w-full h-full object-contain"
            style={{ background: "#000" }}
          />
        ) : (
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={audioUrl}
            controls
            autoPlay
            className="w-full px-6"
            style={{ accentColor: "var(--accent)" }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden mb-3.5"
      style={{ aspectRatio: "16/9", background: "var(--surface)" }}
    >
      {!revealed ? cover : (
        <>
          {/* Hides the YouTube title overlay at the top of the player */}
          <div
            className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
            style={{ height: "18%", background: "var(--surface)" }}
          />
          {/* Hides the control bar (progress bar, buttons, YouTube logo).
              pointer-events:none so clicks still reach the player underneath. */}
          <div
            className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
            style={{ height: "22%", background: "var(--surface)" }}
          />
          <iframe
            ref={iframeRef}
            src={src}
            className="w-full h-full border-0 block"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </>
      )}
    </div>
  );
}
