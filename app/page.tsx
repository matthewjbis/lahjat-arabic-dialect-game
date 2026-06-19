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
        className="text-base max-w-md mb-10 mt-2"
        style={{ color: "var(--on-bg-muted)" }}
      >
        {t.homeSubtitle}
      </p>

      {/* Mode selection */}
      <div className="flex gap-3 mb-4">
        <Link
          href="/play?mode=standard"
          className="flex flex-col items-center px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-150"
          style={{
            background: "var(--accent)",
            color: "var(--gold-ink)",
            border: "1px solid var(--accent-strong)",
            boxShadow: "var(--shadow-lift)",
            minWidth: "9rem",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <span>{t.modeStandard}</span>
          <span className="text-xs font-normal mt-0.5 opacity-80">{t.modeStandardDesc}</span>
        </Link>
        <Link
          href="/play?mode=blitz"
          className="flex flex-col items-center px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-150"
          style={{
            background: "rgba(236,226,205,0.06)",
            color: "var(--on-bg)",
            border: "1px solid var(--border-on-bg)",
            minWidth: "9rem",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <span>{t.modeBlitz}</span>
          <span className="text-xs font-normal mt-0.5 opacity-70">{t.modeBlitzDesc}</span>
        </Link>
      </div>

      {/* Secondary actions */}
      <div className="flex gap-3">
        <Link
          href="/dialects"
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
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
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: "rgba(236,226,205,0.06)",
            color: "var(--on-bg-muted)",
            border: "1px solid var(--border-on-bg)",
          }}
        >
          {t.contribute}
        </Link>
      </div>
    </main>
  );
}
