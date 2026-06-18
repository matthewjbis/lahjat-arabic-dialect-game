import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LangToggle } from "@/components/LangToggle";
import { SoundToggle } from "@/components/SoundToggle";
import { AuthButton } from "@/components/AuthButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lahjat — Guess the Arabic Dialect",
  description:
    "A GeoGuessr-style game for Arabic speech. Listen to a clip and drop a pin where you think the speaker is from.",
  openGraph: {
    title: "Lahjat — Guess the Arabic Dialect",
    description:
      "Listen to Arabic speech clips and guess where the speaker is from. Scoring rewards dialect-family proximity, not just geography.",
    siteName: "Lahjat",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <LanguageProvider>
            <SoundProvider>
              {/* Mobile: full-width bar with bg so content scrolls cleanly under it.
                  Desktop (sm+): floating corner trio, no background. */}
              <div className="fixed top-0 left-0 right-0 sm:top-4 sm:left-auto sm:right-4 z-50 flex h-14 sm:h-auto items-center justify-end gap-2 px-4 sm:px-0 bg-[var(--bg)] sm:bg-transparent border-b border-[var(--border-on-bg)] sm:border-0">
                <AuthButton />
                <SoundToggle />
                <LangToggle />
              </div>
              {children}
              <Analytics />
            </SoundProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
