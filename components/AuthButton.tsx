"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/contexts/LanguageContext";

export function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const t = useT();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) return null;

  if (!user) {
    const redirectTo = pathname !== "/auth" ? `?redirectTo=${encodeURIComponent(pathname)}` : "";
    return (
      <Link
        href={`/auth${redirectTo}`}
        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
        style={{
          background: "var(--surface)",
          color: "var(--text-muted)",
          border: "1px solid var(--border-strong)",
        }}
      >
        {t.authSignIn}
      </Link>
    );
  }

  // Logged-in: show avatar initial + dropdown
  const displayName = user.user_metadata?.display_name as string | undefined;
  const initial = (displayName ?? user.email ?? "?")[0].toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-opacity hover:opacity-80"
        style={{
          background: "var(--accent)",
          color: "var(--gold-ink)",
        }}
        aria-label={t.authAccountMenu}
      >
        {initial}
      </button>

      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="absolute end-0 mt-2 z-50 rounded-xl py-1 min-w-[10rem] text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              boxShadow: "var(--shadow-lift)",
            }}
          >
            <div
              className="px-3 py-2"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {displayName && (
                <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                  {displayName}
                </p>
              )}
              <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>
                {user.email}
              </p>
            </div>
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
            >
              {t.profileLink}
            </Link>
            <button
              type="button"
              onClick={async () => { setMenuOpen(false); await signOut(); }}
              className="w-full text-start px-3 py-2 transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
            >
              {t.authSignOut}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
