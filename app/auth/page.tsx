"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setStatus("idle");
      } else {
        setStatus("done");
      }
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    boxShadow: "var(--shadow-card)",
    borderRadius: "1.25rem",
    padding: "2rem",
    width: "100%",
    maxWidth: "22rem",
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: "var(--bg)" }}
    >
      <Link href="/" aria-label="Home" className="flex items-baseline gap-2 font-semibold tracking-tight text-xl">
        <span style={{ color: "var(--heading)" }}>Lahjat</span>
        <span className="ar-display" style={{ color: "var(--heading)", fontSize: "1.7rem" }}>لهجات</span>
      </Link>

      <div style={cardStyle}>
        {/* Tabs */}
        <div
          className="flex rounded-xl mb-6 p-1 gap-1"
          style={{ background: "var(--surface-inset)" }}
        >
          {(["signin", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); }}
              className="flex-1 rounded-lg py-1.5 text-sm font-medium transition-all duration-150"
              style={{
                background: tab === t ? "var(--surface)" : "transparent",
                color: tab === t ? "var(--text)" : "var(--text-muted)",
                boxShadow: tab === t ? "var(--shadow-card)" : "none",
              }}
            >
              {t === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {status === "done" ? (
          <div className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            <p className="mb-1 font-medium" style={{ color: "var(--text)" }}>
              Check your email
            </p>
            <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                Email
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                Password
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
                ? "Sign in"
                : "Create account"}
            </button>

            {tab === "signin" && (
              <button
                type="button"
                onClick={async () => {
                  if (!email) { setError("Enter your email first."); return; }
                  setError(null);
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
                  });
                  if (error) setError(error.message);
                  else setError("Password reset email sent.");
                }}
                className="text-xs text-center"
                style={{ color: "var(--text-faint)" }}
              >
                Forgot password?
              </button>
            )}
          </form>
        )}
      </div>

      <Link href="/" className="text-xs" style={{ color: "var(--text-faint)" }}>
        ← Back to home
      </Link>
    </main>
  );
}
