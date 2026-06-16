import dialectCitiesJson from "@/lib/data/dialect-cities.json";
import { supabaseAdmin } from "@/lib/supabase";
import { GameContainer } from "@/components/GameContainer";
import type { DialectData, Clip } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Play — Lahjat",
};

type RawCity = { name: string; name_ar?: string; country: string; lat: number; lon: number; cluster: string };
type RawCluster = { id: string; macro_group: string };

const rawCities = dialectCitiesJson.cities as unknown as RawCity[];
const clusterMacroGroup = Object.fromEntries(
  (dialectCitiesJson.clusters as unknown as RawCluster[]).map((c) => [c.id, c.macro_group])
);

function resolveLocation(cityName: string | null, country: string) {
  const city = (cityName
    ? rawCities.find((c) => c.country === country && (
        c.name.toLowerCase() === cityName.toLowerCase() ||
        (c.name_ar != null && c.name_ar === cityName)
      ))
    : null) ?? rawCities.find((c) => c.country === country) ?? null;

  if (!city) return null;
  return { ...city, macro_group: clusterMacroGroup[city.cluster] ?? "unknown" };
}

export default async function PlayPage() {
  const dialectData = dialectCitiesJson as unknown as DialectData;

  const { data: submissions, error } = await supabaseAdmin
    .from("submissions")
    .select("id, file_path, file_type, country, city")
    .eq("status", "approved");

  if (error) console.error("[lahjat] submissions fetch error:", error.message);
  console.log(`[lahjat] submissions: ${submissions?.length ?? 0} rows, dbClips will be built next`);

  const filePaths = (submissions ?? []).map((s) => s.file_path);
  const { data: signedEntries } = filePaths.length
    ? await supabaseAdmin.storage
        .from("clip-submissions")
        .createSignedUrls(filePaths, 60 * 60)
    : { data: [] };

  const signedUrlMap = Object.fromEntries(
    (signedEntries ?? []).map((e) => [e.path, e.signedUrl])
  );

  const dbClips: Clip[] = (submissions ?? []).flatMap((s) => {
    const location = resolveLocation(s.city ?? null, s.country);
    if (!location) return [];

    const audioUrl = signedUrlMap[s.file_path];
    if (!audioUrl) return [];

    return [{
      id: `sub-${s.id}`,
      source: "upload",
      youtube_id: "",
      audio_url: audioUrl,
      media_type: s.file_type,
      start_seconds: 0,
      label_provided: location.cluster,
      answer: {
        city: location.name,
        country: location.country,
        cluster: location.cluster,
        macro_group: location.macro_group,
        lat: location.lat,
        lon: location.lon,
        city_confidence: s.city ? undefined : "country",
      },
      alternate_acceptable_clusters: [],
      verification_status: "approved",
      notes: "",
      reveal_draft: "",
    }];
  });

  const clips = dbClips;

  return <GameContainer dialectData={dialectData} clips={clips} />;
}
