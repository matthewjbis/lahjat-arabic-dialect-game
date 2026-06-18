"use client";

import { useEffect, useState } from "react";

// Position-based visibility: visible near the top, hidden once the user
// has scrolled past HIDE_AT. Shows again only when back above SHOW_AT.
// Purely position-based — no direction tracking, immune to iOS momentum
// scroll oscillations that cause direction-based logic to flicker.
const HIDE_AT = 60;  // hide once scrolled this many px down
const SHOW_AT = 20; // only show again once back above this px

export function NavBar({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < SHOW_AT) setVisible(true);
      else if (y > HIDE_AT) setVisible(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-2 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-6px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}
