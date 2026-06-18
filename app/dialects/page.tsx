import dialectCitiesJson from "@/lib/data/dialect-cities.json";
import { DialectMapView } from "@/components/DialectMapView";
import type { DialectData } from "@/lib/scoring";

export const metadata = {
  title: "Dialect Map — Lahjat",
  description:
    "Explore an interactive map of Arabic dialects across the Arab world — Maghrebi, Egyptian, Levantine, Gulf, and more. See how regional speech clusters and varies from country to country.",
  openGraph: {
    type: "website",
    url: "https://lahjat.app/dialects",
    siteName: "Lahjat",
    title: "Arabic Dialect Map — Lahjat",
    description:
      "An interactive map of Arabic dialects, from Maghrebi to Gulf. Explore how speech varies across the Arab world and which regions sound alike.",
  },
};

export default function DialectsPage() {
  const data = dialectCitiesJson as unknown as DialectData;
  return <DialectMapView cities={data.cities} clusters={data.clusters} />;
}
