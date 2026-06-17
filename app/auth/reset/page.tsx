"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useT } from "@/contexts/LanguageContext";

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

export default function ResetPasswordPage() {
  const t = useT();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError(t.authPasswordsNoMatch);
      return;
    }

    setStatus("loading");
    // The reset link establishes a session via /auth/callback, so updateUser works here.
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setStatus("idle");
    } else {
      setStatus("done");
      setTimeout(() => router.push("/"), 1500);
    }
  }

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
        <h1 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
          {t.authSetNewPassword}
        </h1>
        <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
          {t.authSetNewPasswordBody}
        </p>

        {status === "done" ? (
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            {t.authPasswordUpdated}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                {t.authNewPassword}
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                {t.authConfirmPassword}
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {status === "loading" ? "…" : t.authUpdatePassword}
            </button>
          </form>
        )}
      </div>

      <Link href="/" className="text-xs" style={{ color: "var(--text-faint)" }}>
        {t.authBackHome}
      </Link>
    </main>
  );
}
