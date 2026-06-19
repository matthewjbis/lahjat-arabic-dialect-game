"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { translations, type Lang } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Restore saved preference, or auto-detect on first visit. This must run after
  // mount (localStorage/navigator are client-only) and would cause a hydration
  // mismatch as a lazy initializer, so the setState-on-mount is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem("lahjat-lang") as Lang | null;
    if (saved === "en" || saved === "ar") {
      setLangState(saved);
      return;
    }
    // No saved preference — check browser language first (fast, no network)
    const browserArabic = (navigator.languages ?? [navigator.language]).some(
      (l) => l.toLowerCase().startsWith("ar")
    );
    if (browserArabic) {
      setLangState("ar");
      localStorage.setItem("lahjat-lang", "ar");
      return;
    }
    // Fall back to Vercel geo header (catches Arabic-country users with English browsers)
    fetch("/api/detect-lang")
      .then((r) => r.json())
      .then((data) => {
        if (data.lang === "ar") {
          setLangState("ar");
          localStorage.setItem("lahjat-lang", "ar");
        }
      })
      .catch(() => {});
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Sync html lang + dir attributes so the browser and RTL CSS both work
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lahjat-lang", l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

export function useT() {
  const { lang } = useLang();
  return translations[lang];
}
