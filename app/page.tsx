"use client";

import Link from "next/link";
import { useT } from "@/contexts/LanguageContext";

export default function Home() {
  const t = useT();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-5 text-center">
      <h1 className="font-semibold tracking-tight flex items-baseline gap-3 mb-1">
        <span className="text-4xl" style={{ color: "var(--heading)" }}>Lahjat</span>
        <span className="ar-display" style={{ color: "var(--heading)", fontSize: "3rem" }}>
          لهجات
        </span>
      </h1>
      <p
        className="text-base max-w-md mb-8 mt-2"
        style={{ color: "var(--on-bg-muted)" }}
      >
        {t.homeSubtitle}
      </p>
      <Link
        href="/play"
        className="inline-block px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-150"
        style={{
          background: "var(--accent)",
          color: "var(--gold-ink)",
          border: "1px solid var(--accent-strong)",
          boxShadow: "var(--shadow-lift)",
        }}
      >
        {t.playClassic}
      </Link>
    </main>
  );
}
