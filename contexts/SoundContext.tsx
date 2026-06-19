"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export type SoundKind = "success" | "medium" | "fail" | "endscreen";

interface SoundContextValue {
  muted: boolean;
  toggleMute: () => void;
  playSound: (kind: SoundKind) => void;
  /** Start the looping clock-ticking used during the timer's penalty zone. */
  startTicking: () => void;
  /** Stop and rewind the clock-ticking loop. */
  stopTicking: () => void;
}

const SoundContext = createContext<SoundContextValue>({
  muted: false,
  toggleMute: () => {},
  playSound: () => {},
  startTicking: () => {},
  stopTicking: () => {},
});

const SOUND_PATHS: Record<SoundKind, string> = {
  success:   "/sounds/success.mp3",
  medium:    "/sounds/medium.mp3",
  fail:      "/sounds/failure.mp3",
  endscreen: "/sounds/endscreen.mp3",
};

const TICKING_PATH = "/sounds/clockticking.mp3";

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  // Mirror `muted` into a ref so the audio callbacks can read the latest value
  // without being recreated on every toggle (keeps the context value stable).
  const mutedRef = useRef(false);

  // Restore saved preference on mount. localStorage is client-only, so reading
  // it as a lazy initializer would cause a hydration mismatch; the setState here
  // is the intentional SSR-safe hydration pattern.
  useEffect(() => {
    const saved = localStorage.getItem("lahjat-muted") === "true";
    mutedRef.current = saved;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(saved);
  }, []);

  // Preload one HTMLAudioElement per one-shot sound, plus the looping ticking.
  const audioRef = useRef<Record<SoundKind, HTMLAudioElement | null>>({
    success: null,
    medium: null,
    fail: null,
    endscreen: null,
  });
  const tickingRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    (Object.keys(SOUND_PATHS) as SoundKind[]).forEach((kind) => {
      const el = new Audio(SOUND_PATHS[kind]);
      el.preload = "auto";
      // Silence 404s — the player will drop the files in; until then nothing throws
      el.addEventListener("error", () => {});
      audioRef.current[kind] = el;
    });

    const tick = new Audio(TICKING_PATH);
    tick.loop = true;
    tick.preload = "auto";
    tick.addEventListener("error", () => {});
    tickingRef.current = tick;

    return () => {
      tickingRef.current?.pause();
    };
  }, []);

  const stopTicking = useCallback(() => {
    const el = tickingRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  const startTicking = useCallback(() => {
    if (mutedRef.current) return;
    const el = tickingRef.current;
    if (el && el.paused) el.play().catch(() => {});
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      localStorage.setItem("lahjat-muted", String(next));
      // Muting mid-round should silence the ongoing ticking immediately.
      if (next) tickingRef.current?.pause();
      return next;
    });
  }, []);

  const playSound = useCallback((kind: SoundKind) => {
    if (mutedRef.current) return;
    const el = audioRef.current[kind];
    if (!el) return;
    // Rewind so rapid re-plays always start from the beginning
    el.currentTime = 0;
    el.play().catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ muted, toggleMute, playSound, startTicking, stopTicking }),
    [muted, toggleMute, playSound, startTicking, stopTicking]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
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

export function useTicking() {
  const { startTicking, stopTicking } = useContext(SoundContext);
  return { start: startTicking, stop: stopTicking };
}
