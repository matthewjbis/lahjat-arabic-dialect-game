import dialectCitiesJson from "@/lib/data/dialect-cities.json";
import { GameLoader } from "@/components/GameLoader";
import type { DialectData } from "@/lib/scoring";

export const metadata = {
  title: "Play — Lahjat",
  description:
    "Listen to a clip of Arabic speech and drop a pin where you think the speaker is from. Scoring rewards dialect-family proximity, not just distance on the map.",
  openGraph: {
    type: "website",
    url: "https://lahjat.app/play",
    siteName: "Lahjat",
    title: "Play Lahjat — Guess the Arabic Dialect",
    description:
      "Can you tell a Moroccan accent from an Iraqi one? Listen to Arabic clips and guess where each speaker is from.",
  },
};

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const dialectData = dialectCitiesJson as unknown as DialectData;
  const resolvedMode = mode === "blitz" ? "blitz" : "standard";
  return <GameLoader dialectData={dialectData} mode={resolvedMode} />;
}
