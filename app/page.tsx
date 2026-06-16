"use client";

import Link from "next/link";
import { useT } from "@/contexts/LanguageContext";

export default function Home() {
  const t = useT();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-5 text-center">
      {/* Nav pills — top-left, styled for dark bg */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Link
          href="/dialects"
          className="text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
          style={{
            background: "rgba(236,226,205,0.06)",
            color: "var(--on-bg-muted)",
            border: "1px solid var(--border-on-bg)",
          }}
        >
          {t.dialectMap}
        </Link>
        <Link
          href="/contribute"
          className="text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
          style={{
            background: "rgba(236,226,205,0.06)",
            color: "var(--on-bg-muted)",
            border: "1px solid var(--border-on-bg)",
          }}
        >
          {t.contribute}
        </Link>
      </div>

      <h1 className="font-semibold tracking-tight flex items-baseline gap-3 mb-1" style={{ color: "var(--on-bg)" }}>
        <span className="text-4xl">Lahjat</span>
        <span className="ar-display" style={{ color: "var(--accent)", fontSize: "3rem" }}>
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
