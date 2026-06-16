"use client";

import Link from "next/link";
import { useT } from "@/contexts/LanguageContext";

export default function Home() {
  const t = useT();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-5 text-center">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Link
          href="/dialects"
          className="text-xs px-2.5 py-1 rounded-md transition-opacity hover:opacity-80"
          style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "0.5px solid var(--border)" }}
        >
          {t.dialectMap}
        </Link>
        <Link
          href="/contribute"
          className="text-xs px-2.5 py-1 rounded-md transition-opacity hover:opacity-80"
          style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "0.5px solid var(--border)" }}
        >
          {t.contribute}
        </Link>
      </div>

      <h1
        className="text-4xl font-medium tracking-tight mb-1"
        style={{ color: "var(--text)" }}
      >
        Lahjat{" "}
        <span style={{ fontFamily: "serif" }}>لهجات</span>
      </h1>
      <p
        className="text-base max-w-md mb-8 mt-2"
        style={{ color: "var(--text-muted)" }}
      >
        {t.homeSubtitle}
      </p>
      <Link
        href="/play"
        className="inline-block px-6 py-3 rounded-lg text-white font-medium text-sm transition-opacity hover:opacity-90"
        style={{ background: "var(--accent)" }}
      >
        {t.playClassic}
      </Link>
    </main>
  );
}
