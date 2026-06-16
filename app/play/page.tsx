import dialectCitiesJson from "@/lib/data/dialect-cities.json";
import clipsJson from "@/lib/data/clips.json";
import { supabaseAdmin } from "@/lib/supabase";
import { GameContainer } from "@/components/GameContainer";
import type { DialectData, Clip } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Play — Lahjat",
};

export default async function PlayPage() {
  const dialectData = dialectCitiesJson as unknown as DialectData;
  const staticClips = (clipsJson as { clips: Clip[] }).clips;

  const { data: submissions } = await supabaseAdmin
    .from("submissions")
    .select("id, file_path, country, city, cluster, macro_group, lat, lon, reveal_draft")
    .eq("approved", true)
    .not("cluster", "is", null)
    .not("lat", "is", null);

  const dbClips: Clip[] = (submissions ?? []).map((s) => {
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("clip-submissions")
      .getPublicUrl(s.file_path);
    return {
      id: `sub-${s.id}`,
      source: "upload",
      youtube_id: "",
      audio_url: publicUrl,
      start_seconds: 0,
      label_provided: s.cluster,
      answer: {
        city: s.city ?? "",
        country: s.country,
        cluster: s.cluster,
        macro_group: s.macro_group,
        lat: s.lat,
        lon: s.lon,
      },
      alternate_acceptable_clusters: [],
      verification_status: "approved",
      notes: "",
      reveal_draft: s.reveal_draft ?? "",
    };
  });

  const clips = [...staticClips, ...dbClips];

  return <GameContainer dialectData={dialectData} clips={clips} />;
}
