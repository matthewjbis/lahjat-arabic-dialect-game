import dialectCitiesJson from "@/lib/data/dialect-cities.json";
import clipsJson from "@/lib/data/clips.json";
import { supabaseAdmin } from "@/lib/supabase";
import { GameContainer } from "@/components/GameContainer";
import type { DialectData, Clip, City } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Play — Lahjat",
};

const cities = dialectCitiesJson.cities as City[];

function resolveLocation(cityName: string | null, country: string) {
  if (cityName) {
    const exact = cities.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase() && c.country === country
    );
    if (exact) return exact;
  }
  // Fall back to any city in the same country
  return cities.find((c) => c.country === country) ?? null;
}

export default async function PlayPage() {
  const dialectData = dialectCitiesJson as unknown as DialectData;
  const staticClips = (clipsJson as { clips: Clip[] }).clips;

  const { data: submissions, error } = await supabaseAdmin
    .from("submissions")
    .select("id, file_path, file_type, country, city")
    .eq("status", "approved");

  if (error) console.error("Submissions fetch error:", error.message);

  const dbClips: Clip[] = (submissions ?? []).flatMap((s) => {
    const location = resolveLocation(s.city, s.country);
    if (!location) return [];

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("clip-submissions")
      .getPublicUrl(s.file_path);

    return [{
      id: `sub-${s.id}`,
      source: "upload",
      youtube_id: "",
      audio_url: publicUrl,
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
      },
      alternate_acceptable_clusters: [],
      verification_status: "approved",
      notes: "",
      reveal_draft: "",
    }];
  });

  const clips = [...staticClips, ...dbClips];

  return <GameContainer dialectData={dialectData} clips={clips} />;
}
