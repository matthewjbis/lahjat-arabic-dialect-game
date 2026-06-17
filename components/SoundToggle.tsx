"use client";

import { useMuted, useToggleMute } from "@/contexts/SoundContext";
import { useT } from "@/contexts/LanguageContext";

export function SoundToggle() {
  const muted = useMuted();
  const toggleMute = useToggleMute();
  const t = useT();

  return (
    <button
      onClick={toggleMute}
      aria-label={muted ? t.unmuteSound : t.muteSound}
      className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
      style={{
        background: "rgba(236,226,205,0.06)",
        color: muted ? "var(--text-faint)" : "var(--on-bg-muted)",
        border: "1px solid var(--border-on-bg)",
        cursor: "pointer",
      }}
    >
      {muted ? (
        /* Speaker crossed out */
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18l2 2L21 18.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
        </svg>
      ) : (
        /* Speaker on */
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      )}
    </button>
  );
}
