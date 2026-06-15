"use client";

import { useLang } from "@/contexts/LanguageContext";

export function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="text-xs px-2.5 py-1 rounded-md transition-opacity hover:opacity-80"
      style={{
        background: "var(--surface-2)",
        color: "var(--text-muted)",
        border: "0.5px solid var(--border)",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
      aria-label="Toggle language"
    >
      {lang === "en" ? "العربية" : "English"}
    </button>
  );
}
