import dialectCitiesJson from "@/lib/data/dialect-cities.json";
import { GameLoader } from "@/components/GameLoader";
import type { DialectData } from "@/lib/scoring";

export const metadata = {
  title: "Play — Lahjat",
};

export default function PlayPage() {
  const dialectData = dialectCitiesJson as unknown as DialectData;
  return <GameLoader dialectData={dialectData} />;
}
