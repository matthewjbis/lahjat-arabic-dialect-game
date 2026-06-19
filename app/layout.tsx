import type { Metadata } from "next";
import { Outfit, Aref_Ruqaa } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LangToggle } from "@/components/LangToggle";
import { SoundToggle } from "@/components/SoundToggle";
import { AuthButton } from "@/components/AuthButton";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

// Self-hosted via next/font — no render-blocking request, no layout shift.
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-aref",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lahjat.app"),
  title: "Lahjat — Guess the Arabic Dialect",
  description:
    "A GeoGuessr-style game for Arabic speech. Listen to a clip and drop a pin where you think the speaker is from.",
  openGraph: {
    type: "website",
    url: "https://lahjat.app",
    siteName: "Lahjat",
    title: "Lahjat — Guess the Arabic Dialect",
    description:
      "Listen to Arabic speech clips and guess where the speaker is from. Scoring rewards dialect-family proximity, not just geography.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${outfit.variable} ${arefRuqaa.variable}`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <LanguageProvider>
            <SoundProvider>
              <NavBar>
                <AuthButton />
                <SoundToggle />
                <LangToggle />
              </NavBar>
              {children}
              <Analytics />
            </SoundProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
