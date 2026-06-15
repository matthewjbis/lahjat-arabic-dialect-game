"use client";

import Link from "next/link";
import { LangToggle } from "@/components/LangToggle";
import { useT } from "@/contexts/LanguageContext";

export default function Home() {
  const t = useT();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-5 text-center">
      <div className="absolute top-4 right-4">
        <LangToggle />
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
