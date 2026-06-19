"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export type SoundKind = "success" | "medium" | "fail" | "endscreen";

interface SoundContextValue {
  muted: boolean;
  toggleMute: () => void;
  playSound: (kind: SoundKind) => void;
}

const SoundContext = createContext<SoundContextValue>({
  muted: false,
  toggleMute: () => {},
  playSound: () => {},
});

const SOUND_PATHS: Record<SoundKind, string> = {
  success:   "/sounds/success.mp3",
  medium:    "/sounds/medium.mp3",
  fail:      "/sounds/failure.mp3",
  endscreen: "/sounds/endscreen.mp3",
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);

  // Restore saved preference on mount. localStorage is client-only, so reading
  // it as a lazy initializer would cause a hydration mismatch; the setState here
  // is the intentional SSR-safe hydration pattern.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(localStorage.getItem("lahjat-muted") === "true");
  }, []);

  // Preload one HTMLAudioElement per sound — created once on mount
  const audioRef = useRef<Record<SoundKind, HTMLAudioElement | null>>({
    success: null,
    medium: null,
    fail: null,
    endscreen: null,
  });

  useEffect(() => {
    (Object.keys(SOUND_PATHS) as SoundKind[]).forEach((kind) => {
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

  function playSound(kind: SoundKind) {
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
