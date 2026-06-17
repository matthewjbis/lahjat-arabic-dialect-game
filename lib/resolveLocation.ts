import dialectCitiesJson from "@/lib/data/dialect-cities.json";

type RawCity = {
  name: string;
  name_ar?: string;
  country: string;
  lat: number;
  lon: number;
  cluster: string;
};

type RawCluster = { id: string; macro_group: string };

const rawCities = dialectCitiesJson.cities as unknown as RawCity[];

const clusterMacroGroup = Object.fromEntries(
  (dialectCitiesJson.clusters as unknown as RawCluster[]).map((c) => [
    c.id,
    c.macro_group,
  ])
);

export function resolveLocation(cityName: string | null, country: string) {
  const city =
    (cityName
      ? rawCities.find(
          (c) =>
            c.country === country &&
            (c.name.toLowerCase() === cityName.toLowerCase() ||
              (c.name_ar != null && c.name_ar === cityName))
        )
      : null) ??
    rawCities.find((c) => c.country === country) ??
    null;

  if (!city) return null;
  return { ...city, macro_group: clusterMacroGroup[city.cluster] ?? "unknown" };
}
