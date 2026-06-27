"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useT, useLang } from "@/contexts/LanguageContext";

type Tab = "signin" | "signup";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  borderRadius: "0.75rem",
  border: "1px solid var(--border-strong)",
  background: "var(--surface-inset)",
  color: "var(--text)",
  fontSize: "0.9rem",
  outline: "none",
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  boxShadow: "var(--shadow-card)",
  borderRadius: "1.25rem",
  padding: "2rem",
  width: "100%",
  maxWidth: "22rem",
};

function AuthForm() {
  const t = useT();
  const { lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const allCountries = useMemo(() => {
    const names = new Intl.DisplayNames([lang], { type: "region" });
    // ISO 3166-1 alpha-2 codes for all UN-recognised countries
    const codes = [
      "AF","AL","DZ","AD","AO","AG","AR","AM","AU","AT","AZ","BS","BH","BD","BB",
      "BY","BE","BZ","BJ","BT","BO","BA","BW","BR","BN","BG","BF","BI","CV","KH",
      "CM","CA","CF","TD","CL","CN","CO","KM","CD","CG","CR","HR","CU","CY","CZ",
      "DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FJ","FI","FR",
      "GA","GM","GE","DE","GH","GR","GD","GT","GN","GW","GY","HT","HN","HU","IS",
      "IN","ID","IR","IQ","IE","IL","IT","JM","JP","JO","KZ","KE","KI","KP","KR",
      "KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MG","MW","MY","MV",
      "ML","MT","MH","MR","MU","MX","FM","MD","MC","MN","ME","MA","MZ","MM","NA",
      "NR","NP","NL","NZ","NI","NE","NG","MK","NO","OM","PK","PW","PS","PA","PG",
      "PY","PE","PH","PL","PT","QA","RO","RU","RW","KN","LC","VC","WS","SM","ST",
      "SA","SN","RS","SC","SL","SG","SK","SI","SB","SO","ZA","SS","ES","LK","SD",
      "SR","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TO","TT","TN","TR","TM",
      "TV","UG","UA","AE","GB","US","UY","UZ","VU","VE","VN","YE","ZM","ZW",
    ];
    return codes
      .map((code) => ({ code, name: names.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [lang]);

  async function handleGoogle() {
    setError(null);
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    if (tab === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setStatus("idle");
      } else {
        router.push(redirectTo);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim() || null,
            country: country || null,
            city: city.trim() || null,
          },
        },
      });
      if (error) {
        setError(error.message);
        setStatus("idle");
      } else {
        setStatus("done");
      }
    }
  }

  return (
    <div style={cardStyle}>
      {/* Tabs */}
      <div
        className="flex rounded-xl mb-6 p-1 gap-1"
        style={{ background: "var(--surface-inset)" }}
      >
        {(["signin", "signup"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => { setTab(tabKey); setError(null); }}
            className="flex-1 rounded-lg py-1.5 text-sm font-medium transition-all duration-150"
            style={{
              background: tab === tabKey ? "var(--surface)" : "transparent",
              color: tab === tabKey ? "var(--text)" : "var(--text-muted)",
              boxShadow: tab === tabKey ? "var(--shadow-card)" : "none",
            }}
          >
            {tabKey === "signin" ? t.authSignIn : t.authCreateAccount}
          </button>
        ))}
      </div>

      {status === "done" ? (
        <div className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          <p className="mb-1 font-medium" style={{ color: "var(--text)" }}>
            {t.authCheckEmailTitle}
          </p>
          <p>{t.authConfirmSentTo} <strong>{email}</strong>. {t.authConfirmSentAfter}</p>
        </div>
      ) : (
        <>
          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={status === "loading"}
            className="w-full rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2.5 transition-opacity duration-150"
            style={{
              background: "var(--surface-inset)",
              color: "var(--text)",
              border: "1px solid var(--border-strong)",
              opacity: status === "loading" ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
            {t.authContinueWithGoogle}
          </button>

          {/* "or" divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: "var(--border-strong)" }} />
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>{t.orDivider}</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-strong)" }} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              {t.authEmail}
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          {tab === "signup" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                  {t.authDisplayName} <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>{t.nameOptional}</span>
                </label>
                <input
                  type="text"
                  autoComplete="nickname"
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t.authDisplayNamePlaceholder}
                  style={{ ...inputStyle, color: displayName ? "var(--text)" : undefined }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                  {t.authCountry} <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>{t.nameOptional}</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={{ ...inputStyle, color: country ? "var(--text)" : "var(--text-faint)", appearance: "none" }}
                >
                  <option value="">{t.authCountryPlaceholder}</option>
                  {allCountries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              {country && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                    {t.authCity} <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>{t.nameOptional}</span>
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t.authCityPlaceholder}
                    style={{ ...inputStyle, color: city ? "var(--text)" : undefined }}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              {t.authPassword}
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(200,60,60,.12)", color: "var(--accent-2)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity duration-150"
            style={{
              background: "var(--accent)",
              color: "var(--gold-ink)",
              opacity: status === "loading" ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            {status === "loading"
              ? "…"
              : tab === "signin"
              ? t.authSignIn
              : t.authCreateAccount}
          </button>

          {tab === "signin" && (
            <button
              type="button"
              onClick={async () => {
                if (!email) { setError(t.authEnterEmailFirst); return; }
                setError(null);
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
                });
                if (error) setError(error.message);
                else setError(t.authResetEmailSent);
              }}
              className="text-xs text-center"
              style={{ color: "var(--text-faint)" }}
            >
              {t.authForgotPassword}
            </button>
          )}
          </form>
        </>
      )}
    </div>
  );
}

function BackHomeLink() {
  const t = useT();
  return (
    <Link href="/" className="text-xs" style={{ color: "var(--text-faint)" }}>
      {t.authBackHome}
    </Link>
  );
}

export default function AuthPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: "var(--bg)" }}
    >
      <Link href="/" aria-label="Home" className="flex items-baseline gap-2 font-semibold tracking-tight text-xl">
        <span style={{ color: "var(--heading)" }}>Lahjat</span>
        <span className="ar-display" style={{ color: "var(--heading)", fontSize: "1.7rem" }}>لهجات</span>
      </Link>

      <Suspense>
        <AuthForm />
      </Suspense>

      <BackHomeLink />
    </main>
  );
}
