/**
 * Lahjat scoring engine — v0.2
 *
 * Score = distance points (geographic accuracy, decays with distance)
 *       + dialect points (how closely the guessed cluster relates to the answer's cluster)
 *       + exact-city bonus (small flat bonus for nailing the city)
 */

export interface City {
  name: string;
  country: string;
  cluster: string;
  macro_group: string;
  lat: number;
  lon: number;
  city_confidence?: string;
}

export interface Cluster {
  id: string;
  name: string;
  name_ar?: string;
  macro_group: string;
  color: string;
}

export interface DialectData {
  cities: City[];
  clusters: Cluster[];
}

export interface ClipAnswer {
  city: string;
  country: string;
  cluster: string;
  macro_group: string;
  lat: number;
  lon: number;
  city_confidence?: string;
}

export interface Clip {
  id: string;
  source: string;
  youtube_id: string;
  audio_url?: string;
  media_type?: string;
  start_seconds: number;
  label_provided: string;
  answer: ClipAnswer;
  alternate_acceptable_clusters: string[];
  verification_status: string;
  notes: string;
  reveal_draft: string;
}

export interface ScoreResult {
  total: number;
  distanceKm: number;
  distancePoints: number;
  dialectPoints: number;
  relationship: "exact" | "adjacent" | "macro" | "none";
  guessedCluster: string | null;
  guessedCity: string | null;
  exactCityBonus: number;
}

// --- Tunable constants ---

const MAX_SCORE = 5000;
const MAX_DISTANCE_POINTS = 3000;
const MAX_DIALECT_POINTS = 2000;
const EXACT_CITY_BONUS = 200;
const DISTANCE_DECAY_KM = 1000;

// Tunable: gentler than DISTANCE_DECAY_KM so any in-country guess still scores well
export const COUNTRY_DECAY_KM = 1500;

// Tunable: pin must be within GATE_FREE_KM of a city to get full dialect credit;
// beyond that, credit decays over GATE_DECAY_KM so ocean clicks score near zero
export const GATE_FREE_KM = 150;
export const GATE_DECAY_KM = 250;

const DIALECT_MULTIPLIERS: Record<string, number> = {
  exact: 1.0,
  adjacent: 0.6,
  macro: 0.25,
  none: 0,
};

// --- Cluster adjacency map ---

const CLUSTER_ADJACENCY: Record<string, string[]> = {
  moroccan:        ["algerian"],
  algerian:        ["moroccan", "saharanAlgerian"],
  saharanAlgerian: ["algerian", "hassaniya", "libyan"],
  hassaniya:       ["saharanAlgerian"],
  libyan:          ["saharanAlgerian", "cairene"],
  cairene:         ["libyan", "saidi", "gazan"],
  saidi:           ["cairene"],
  gazan:           ["cairene", "palestinianU", "palestinianR"],
  palestinianU:    ["gazan", "palestinianR", "jordanianU", "lebanese"],
  palestinianR:    ["palestinianU", "gazan"],
  jordanianU:      ["palestinianU", "jordanianB"],
  jordanianB:      ["jordanianU", "anbari", "hejazi"],
  hejazi:          ["jordanianB", "asiri"],
  najdi:           ["anbari", "hejazi"],
  anbari:          ["baghdadi", "jordanianB", "easternSyrian", "najdi"],
  baghdadi:        ["anbari", "southernIraqi"],
  southernIraqi:   ["baghdadi", "gulf"],
  aleppine:        ["moslawi", "easternSyrian", "northLevantine"],
  moslawi:         ["aleppine"],
  easternSyrian:   ["aleppine", "anbari", "northLevantine"],
  northLevantine:  ["aleppine", "easternSyrian", "coastalSyrian", "lebanese"],
  coastalSyrian:   ["northLevantine", "lebanese"],
  lebanese:        ["northLevantine", "coastalSyrian", "palestinianU"],
  asiri:           ["hejazi", "sanaani", "taizziAdeni"],
  sanaani:         ["asiri", "taizziAdeni"],
  taizziAdeni:     ["sanaani", "asiri", "hadrami"],
  hadrami:         ["taizziAdeni", "dhofari"],
  dhofari:         ["hadrami", "omani"],
  omani:           ["dhofari", "gulf"],
  gulf:            ["omani", "southernIraqi"],
  sudanese:        ["darfuri", "jubaArabic"],
  darfuri:         ["sudanese", "jubaArabic"],
  jubaArabic:      ["sudanese", "darfuri"],
  djibouti:        ["sudanese", "somali", "sanaani"],
  somali:          ["djibouti"],
  comorian:        ["somali"],
};

// --- Geometry ---

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

export function nearestCity(lat: number, lon: number, cities: City[]): City | null {
  let best: City | null = null;
  let bestDist = Infinity;
  for (const city of cities) {
    const d = haversineDistanceKm(lat, lon, city.lat, city.lon);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

export function nearestCityInCountry(
  lat: number,
  lon: number,
  country: string,
  cities: City[]
): City | null {
  let best: City | null = null;
  let bestDist = Infinity;
  for (const city of cities) {
    if (city.country !== country) continue;
    const d = haversineDistanceKm(lat, lon, city.lat, city.lon);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

export function getClusterRelationship(
  guessedCluster: string | null,
  answer: ClipAnswer,
  alternateAcceptable: string[],
  clusterMacroGroup: Record<string, string>
): "exact" | "adjacent" | "macro" | "none" {
  if (!guessedCluster) return "none";

  const acceptable = [answer.cluster, ...alternateAcceptable];
  if (acceptable.includes(guessedCluster)) return "exact";

  const adjacent = CLUSTER_ADJACENCY[answer.cluster] || [];
  if (adjacent.includes(guessedCluster)) return "adjacent";

  if (
    clusterMacroGroup[guessedCluster] &&
    clusterMacroGroup[guessedCluster] === answer.macro_group
  ) {
    return "macro";
  }

  return "none";
}

export function scoreGuess(
  guessLat: number,
  guessLon: number,
  clip: Clip,
  dialectData: DialectData
): ScoreResult {
  const { cities, clusters } = dialectData;
  const answer = clip.answer;

  const clusterMacroGroup = Object.fromEntries(clusters.map((c) => [c.id, c.macro_group]));

  const distanceKm = haversineDistanceKm(guessLat, guessLon, answer.lat, answer.lon);
  const countryOnly = answer.city_confidence === "country";

  // Bug 1 fix: for country-only clips, decay from the nearest in-country city
  // rather than awarding the maximum unconditionally.
  let distancePoints: number;
  if (countryOnly) {
    const nearestInCountry = nearestCityInCountry(guessLat, guessLon, answer.country, cities);
    if (nearestInCountry) {
      const distToNearest = haversineDistanceKm(
        guessLat, guessLon,
        nearestInCountry.lat, nearestInCountry.lon
      );
      distancePoints = Math.round(MAX_DISTANCE_POINTS * Math.exp(-distToNearest / COUNTRY_DECAY_KM));
    } else {
      // Fallback: no cities on record for this country — grant max as before
      distancePoints = MAX_DISTANCE_POINTS;
    }
  } else {
    distancePoints = Math.round(MAX_DISTANCE_POINTS * Math.exp(-distanceKm / DISTANCE_DECAY_KM));
  }

  const guessedCity = nearestCity(guessLat, guessLon, cities);
  const guessedCluster = guessedCity ? guessedCity.cluster : null;

  // Bug 2 fix: scale dialect credit by proximity to the nearest city so that
  // an ocean pin cannot snap to a coastal city and claim full dialect points.
  const distToNearestCity = guessedCity
    ? haversineDistanceKm(guessLat, guessLon, guessedCity.lat, guessedCity.lon)
    : Infinity;
  const proximityFactor = Math.min(
    1,
    Math.exp(-Math.max(0, distToNearestCity - GATE_FREE_KM) / GATE_DECAY_KM)
  );

  const relationship = getClusterRelationship(
    guessedCluster,
    answer,
    clip.alternate_acceptable_clusters,
    clusterMacroGroup
  );
  const dialectPoints = Math.round(
    MAX_DIALECT_POINTS * DIALECT_MULTIPLIERS[relationship] * proximityFactor
  );

  const exactCity = !!(
    !countryOnly &&
    guessedCity &&
    guessedCity.name === answer.city &&
    guessedCity.country === answer.country
  );
  const exactCityBonus = exactCity ? EXACT_CITY_BONUS : 0;

  const total = Math.min(MAX_SCORE, distancePoints + dialectPoints + exactCityBonus);

  return {
    total,
    distanceKm: Math.round(distanceKm),
    distancePoints,
    dialectPoints,
    relationship,
    guessedCluster,
    guessedCity: guessedCity ? guessedCity.name : null,
    exactCityBonus,
  };
}

export {
  MAX_SCORE,
  MAX_DISTANCE_POINTS,
  MAX_DIALECT_POINTS,
  DISTANCE_DECAY_KM,
  DIALECT_MULTIPLIERS,
  CLUSTER_ADJACENCY,
  EXACT_CITY_BONUS,
};
