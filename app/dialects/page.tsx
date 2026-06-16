import dialectCitiesJson from "@/lib/data/dialect-cities.json";
import { DialectMapView } from "@/components/DialectMapView";
import type { DialectData } from "@/lib/scoring";

export const metadata = {
  title: "Dialect Map — Lahjat",
};

export default function DialectsPage() {
  const data = dialectCitiesJson as unknown as DialectData;
  return <DialectMapView cities={data.cities} clusters={data.clusters} />;
}
