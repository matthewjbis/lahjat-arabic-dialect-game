"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

interface SoundContextValue {
  muted: boolean;
  toggleMute: () => void;
  playSound: (kind: "success" | "medium" | "fail") => void;
}

const SoundContext = createContext<SoundContextValue>({
  muted: false,
  toggleMute: () => {},
  playSound: () => {},
});

const SOUND_PATHS: Record<"success" | "medium" | "fail", string> = {
  success: "/sounds/success.mp3",
  medium:  "/sounds/medium.mp3",
  fail:    "/sounds/failure.mp3",
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);

  // Restore saved preference on mount
  useEffect(() => {
    setMuted(localStorage.getItem("lahjat-muted") === "true");
  }, []);

  // Preload one HTMLAudioElement per sound — created once on mount
  const audioRef = useRef<Record<"success" | "medium" | "fail", HTMLAudioElement | null>>({
    success: null,
    medium: null,
    fail: null,
  });

  useEffect(() => {
    (["success", "medium", "fail"] as const).forEach((kind) => {
      const el = new Audio(SOUND_PATHS[kind]);
      el.preload = "auto";
      // Silence 404s — the player will drop the files in; until then nothing throws
      el.addEventListener("error", () => {});
      audioRef.current[kind] = el;
    });
  }, []);

  function toggleMute() {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem("lahjat-muted", String(next));
      return next;
    });
  }

  function playSound(kind: "success" | "medium" | "fail") {
    if (muted) return;
    const el = audioRef.current[kind];
    if (!el) return;
    // Rewind so rapid re-plays always start from the beginning
    el.currentTime = 0;
    el.play().catch(() => {});
  }

  return (
    <SoundContext.Provider value={{ muted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useMuted() {
  return useContext(SoundContext).muted;
}

export function useToggleMute() {
  return useContext(SoundContext).toggleMute;
}

export function useSound() {
  return useContext(SoundContext).playSound;
}
