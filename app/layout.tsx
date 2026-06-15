import type { Metadata } from "next";
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
