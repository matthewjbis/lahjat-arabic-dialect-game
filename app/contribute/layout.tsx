import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contribute a Clip — Lahjat",
  description:
    "Help build Lahjat. Record or upload a short clip of your own Arabic dialect and add your city to the map — every contribution makes the game smarter.",
  openGraph: {
    type: "website",
    url: "https://lahjat.app/contribute",
    siteName: "Lahjat",
    title: "Contribute Your Dialect — Lahjat",
    description:
      "Record or upload a short clip of your Arabic dialect and put your city on the map. Help others learn to recognize how your region really sounds.",
  },
};

export default function ContributeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
