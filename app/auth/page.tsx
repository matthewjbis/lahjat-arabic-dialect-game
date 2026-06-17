"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useT } from "@/contexts/LanguageContext";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

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
        options: { data: { display_name: displayName.trim() || null } },
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
