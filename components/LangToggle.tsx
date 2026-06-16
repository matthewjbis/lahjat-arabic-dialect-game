"use client";

import { useLang } from "@/contexts/LanguageContext";

export function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
      style={{
        background: "rgba(236,226,205,0.06)",
        color: "var(--on-bg-muted)",
        border: "1px solid var(--border-on-bg)",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
      aria-label="Toggle language"
    >
      {lang === "en" ? "العربية" : "English"}
    </button>
  );
}
