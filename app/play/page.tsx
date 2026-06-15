import dialectCitiesJson from "@/lib/data/dialect-cities.json";
import clipsJson from "@/lib/data/clips.json";
import { GameContainer } from "@/components/GameContainer";
import type { DialectData, Clip } from "@/lib/scoring";

export const metadata = {
  title: "Play — Lahjat",
};

export default function PlayPage() {
  const dialectData = dialectCitiesJson as unknown as DialectData;
  const clips = (clipsJson as { clips: Clip[] }).clips;

  return <GameContainer dialectData={dialectData} clips={clips} />;
}
