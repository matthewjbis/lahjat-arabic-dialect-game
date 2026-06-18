"use client";

import { useEffect, useRef, useState } from "react";

// Hides when the user scrolls down, reappears when they scroll back up
// or return to the top. Floats in the top-right corner with no background.
export function NavBar({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 10) {
        setVisible(true);
      } else if (y > lastY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastY.current = y;
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
