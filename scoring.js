/**
 * Lahjat scoring engine — v0.1
 *
 * Core principle (see lahjat-product-writeup.md and README):
 * a guess in the right DIALECT FAMILY should score better than a guess that is
 * merely geographically closer but linguistically unrelated. A player who guesses
 * Mosul for an Aleppo clip should beat a player who guesses Baghdad, even though
 * Baghdad is the closer pin on the map.
 *
 * Score = distance points (geographic accuracy, decays with distance)
 *       + dialect points (how closely the guessed cluster relates to the answer's cluster)
 *       + exact-city bonus (small flat bonus for nailing the city)
 *
 * This is a first-pass implementation. CLUSTER_ADJACENCY below encodes the
 * cross-border continua flagged in dialect-cities.json (e.g. the Aleppo–Mosul
 * qeltu corridor, the Salalah–Mukalla gradient, Asiri as transitional to Yemeni).
 * It's a starting heuristic, not a verified linguistic ground truth — review and
 * adjust as the dataset's edge-case notes are refined.
 */

(function (global) {

  const EARTH_RADIUS_KM = 6371;

  // --- Tunable constants -----------------------------------------------

  const MAX_SCORE = 5000;            // total possible points for one guess
  const MAX_DISTANCE_POINTS = 3000;  // share of the score from raw geographic accuracy
  const MAX_DIALECT_POINTS = 2000;   // share of the score from dialect-family proximity
  const EXACT_CITY_BONUS = 200;      // small flat bonus, on top of the 5000 cap below

  // Controls how quickly distance points fall off. At this many km from the
  // true location, distance points have decayed to ~37% (1/e) of MAX_DISTANCE_POINTS.
  const DISTANCE_DECAY_KM = 1000;

  // Dialect-point multipliers by relationship between guessed cluster and answer cluster.
  const DIALECT_MULTIPLIERS = {
    exact: 1.0,      // same cluster, or an alternate_acceptable_cluster for this clip
    adjacent: 0.6,   // flagged cross-border continuum (e.g. aleppine <-> moslawi)
    macro: 0.25,     // same macro_group, unrelated cluster
    none: 0
  };

  // --- Cluster adjacency map --------------------------------------------
  //
  // Symmetric map of cross-border / transitional relationships drawn from the
  // "note" fields in dialect-cities.json. Each entry lists clusters that are
  // linguistically closer to this one than the macro_group alone would suggest.
  // Treat this as a living document — extend it as edge cases get verified.

  const CLUSTER_ADJACENCY = {
    // Maghrebi corridor
    moroccan:        ['algerian'],
    algerian:        ['moroccan', 'saharanAlgerian'],
    saharanAlgerian: ['algerian', 'hassaniya', 'libyan'],
    hassaniya:       ['saharanAlgerian'],
    libyan:          ['saharanAlgerian', 'cairene'],

    // Libyan <-> Egyptian (Benghazi note: "closer to Egyptian than Tripoli")
    cairene:         ['libyan', 'saidi', 'gazan'],
    saidi:           ['cairene'],

    // Levantine <-> Egyptian (Gaza note: "Bedouin/Egyptian-influenced")
    gazan:           ['cairene', 'palestinianU', 'palestinianR'],
    palestinianU:    ['gazan', 'palestinianR', 'jordanianU', 'lebanese'],
    palestinianR:    ['palestinianU', 'gazan'],
    jordanianU:      ['palestinianU', 'jordanianB'],
    jordanianB:      ['jordanianU', 'anbari', 'hejazi'],

    // Hejazi <-> Najdi <-> Bedouin/Iraqi Bedouin corridor
    hejazi:          ['jordanianB', 'asiri'],
    najdi:           ['anbari', 'hejazi'],

    // Mesopotamian
    anbari:          ['baghdadi', 'jordanianB', 'easternSyrian', 'najdi'],
    baghdadi:        ['anbari', 'southernIraqi'],
    southernIraqi:   ['baghdadi', 'gulf'],

    // The Aleppo-Mosul qeltu corridor — the canonical example from the README
    aleppine:        ['moslawi', 'easternSyrian', 'northLevantine'],
    moslawi:         ['aleppine'],
    easternSyrian:   ['aleppine', 'anbari', 'northLevantine'],

    // North Levantine cluster
    northLevantine:  ['aleppine', 'easternSyrian', 'coastalSyrian', 'lebanese'],
    coastalSyrian:   ['northLevantine', 'lebanese'],
    lebanese:        ['northLevantine', 'coastalSyrian', 'palestinianU'],

    // Peninsular <-> Yemeni gradient (Asiri "transitional to Yemen")
    asiri:           ['hejazi', 'sanaani', 'taizziAdeni'],
    sanaani:         ['asiri', 'taizziAdeni'],
    taizziAdeni:     ['sanaani', 'asiri', 'hadrami'],
    hadrami:         ['taizziAdeni', 'dhofari'],

    // Salalah-Mukalla gradient (Dhofari "closer to Yemeni than Omani")
    dhofari:         ['hadrami', 'omani'],
    omani:           ['dhofari', 'gulf'],
    gulf:            ['omani', 'southernIraqi'],

    // Sudanic belt
    sudanese:        ['darfuri', 'jubaArabic'],
    darfuri:         ['sudanese', 'jubaArabic'],
    jubaArabic:      ['sudanese', 'darfuri'],

    // Peripheral / L2 varieties — loosely tied to nearest Arabic-speaking neighbors
    djibouti:        ['sudanese', 'somali', 'sanaani'],
    somali:          ['djibouti'],
    comorian:        ['somali']
  };

  // --- Geometry -----------------------------------------------------------

  function toRadians(deg) {
    return (deg * Math.PI) / 180;
  }

  /** Great-circle distance between two lat/lon points, in kilometers. */
  function haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  /** Find the city in `cities` nearest to (lat, lon). Returns the city object or null. */
  function nearestCity(lat, lon, cities) {
    let best = null;
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

  // --- Dialect relationship -----------------------------------------------

  /**
   * Classify how a guessed cluster relates to the clip's answer cluster.
   * Returns one of: 'exact' | 'adjacent' | 'macro' | 'none'.
   */
  function getClusterRelationship(guessedCluster, answer, clusterMacroGroup) {
    if (!guessedCluster) return 'none';

    const acceptable = [answer.cluster, ...(answer.alternate_acceptable_clusters || [])];
    if (acceptable.includes(guessedCluster)) return 'exact';

    const adjacent = CLUSTER_ADJACENCY[answer.cluster] || [];
    if (adjacent.includes(guessedCluster)) return 'adjacent';

    if (clusterMacroGroup[guessedCluster] && clusterMacroGroup[guessedCluster] === answer.macro_group) {
      return 'macro';
    }

    return 'none';
  }

  // --- Main scoring function ----------------------------------------------

  /**
   * Score a single guess.
   *
   * @param {number} guessLat - latitude of the player's pin
   * @param {number} guessLon - longitude of the player's pin
   * @param {object} clip - a clip entry from clips.json (must have `answer`)
   * @param {object} dialectData - the parsed dialect-cities.json object
   *   (must have `cities` and `clusters` arrays)
   * @returns {object} score breakdown
   */
  function scoreGuess(guessLat, guessLon, clip, dialectData) {
    const { cities, clusters } = dialectData;
    const answer = clip.answer;

    const clusterMacroGroup = Object.fromEntries(clusters.map(c => [c.id, c.macro_group]));

    // Geographic component
    const distanceKm = haversineDistanceKm(guessLat, guessLon, answer.lat, answer.lon);
    const distancePoints = Math.round(MAX_DISTANCE_POINTS * Math.exp(-distanceKm / DISTANCE_DECAY_KM));

    // Dialect component — derive the "guessed cluster" from the nearest known city
    // to the player's pin.
    const guessedCity = nearestCity(guessLat, guessLon, cities);
    const guessedCluster = guessedCity ? guessedCity.cluster : null;
    const relationship = getClusterRelationship(guessedCluster, answer, clusterMacroGroup);
    const dialectPoints = Math.round(MAX_DIALECT_POINTS * DIALECT_MULTIPLIERS[relationship]);

    // Exact-city bonus (only meaningful for clips where city_confidence isn't
    // downgraded to "cluster-level only" — see clips.json notes)
    const exactCity = !!(guessedCity &&
      guessedCity.name === answer.city &&
      guessedCity.country === answer.country);
    const exactCityBonus = exactCity ? EXACT_CITY_BONUS : 0;

    const total = Math.min(MAX_SCORE, distancePoints + dialectPoints + exactCityBonus);

    return {
      total,
      distanceKm: Math.round(distanceKm),
      distancePoints,
      dialectPoints,
      relationship,        // 'exact' | 'adjacent' | 'macro' | 'none'
      guessedCluster,
      guessedCity: guessedCity ? guessedCity.name : null,
      exactCityBonus
    };
  }

  // --- Exports --------------------------------------------------------------

  const api = {
    haversineDistanceKm,
    nearestCity,
    getClusterRelationship,
    scoreGuess,
    CLUSTER_ADJACENCY,
    MAX_SCORE,
    MAX_DISTANCE_POINTS,
    MAX_DIALECT_POINTS,
    DISTANCE_DECAY_KM,
    DIALECT_MULTIPLIERS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.LahjatScoring = api;
  }

})(typeof window !== 'undefined' ? window : globalThis);
