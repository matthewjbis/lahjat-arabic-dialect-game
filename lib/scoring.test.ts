import { describe, it, expect } from "vitest";
import { scoreGuess } from "./scoring";
import type { Clip, DialectData } from "./scoring";

const dialectData: DialectData = {
  cities: [
    { name: "Aleppo",  country: "Syria",         cluster: "aleppine",  macro_group: "levantine",    lat: 36.20, lon: 37.16 },
    { name: "Mosul",   country: "Iraq",           cluster: "moslawi",   macro_group: "mesopotamian", lat: 36.34, lon: 43.13 },
    { name: "Baghdad", country: "Iraq",           cluster: "baghdadi",  macro_group: "mesopotamian", lat: 33.34, lon: 44.40 },
    { name: "Riyadh",  country: "Saudi Arabia",   cluster: "najdi",     macro_group: "peninsular",   lat: 24.69, lon: 46.72 },
    { name: "Jeddah",  country: "Saudi Arabia",   cluster: "hejazi",    macro_group: "peninsular",   lat: 21.54, lon: 39.17 },
  ],
  clusters: [
    { id: "aleppine",  name: "Aleppine",  macro_group: "levantine",    color: "#e07" },
    { id: "moslawi",   name: "Moslawi",   macro_group: "mesopotamian", color: "#07e" },
    { id: "baghdadi",  name: "Baghdadi",  macro_group: "mesopotamian", color: "#0e7" },
    { id: "najdi",     name: "Najdi",     macro_group: "peninsular",   color: "#e70" },
    { id: "hejazi",    name: "Hejazi",    macro_group: "peninsular",   color: "#70e" },
  ],
};

const aleppoClip: Clip = {
  id: "test-aleppo",
  source: "test",
  youtube_id: "",
  start_seconds: 0,
  label_provided: "Aleppo",
  answer: {
    city: "Aleppo",
    country: "Syria",
    cluster: "aleppine",
    macro_group: "levantine",
    lat: 36.20,
    lon: 37.16,
    city_confidence: "high",
  },
  alternate_acceptable_clusters: [],
  verification_status: "verified",
  notes: "",
  reveal_draft: "",
};

const saudiCountryClip: Clip = {
  id: "test-saudi-country",
  source: "test",
  youtube_id: "",
  start_seconds: 0,
  label_provided: "Saudi Arabia",
  answer: {
    city: "",
    country: "Saudi Arabia",
    cluster: "najdi",
    macro_group: "peninsular",
    lat: 24.69,
    lon: 46.72,
    city_confidence: "country",
  },
  alternate_acceptable_clusters: [],
  verification_status: "verified",
  notes: "",
  reveal_draft: "",
};

describe("scoring — canonical city clip", () => {
  it("Mosul guess scores higher than Baghdad guess for an Aleppo clip", () => {
    // Mosul: moslawi cluster, adjacent to aleppine → dialect credit
    const mosulScore = scoreGuess(36.34, 43.13, aleppoClip, dialectData);
    // Baghdad: baghdadi cluster, not adjacent to aleppine → no dialect credit
    const baghdadScore = scoreGuess(33.34, 44.40, aleppoClip, dialectData);

    expect(mosulScore.relationship).toBe("adjacent");
    expect(baghdadScore.relationship).toBe("none");
    expect(mosulScore.total).toBeGreaterThan(baghdadScore.total);
  });
});

describe("scoring — country-only clip", () => {
  it("ocean click scores near zero", () => {
    // Indian Ocean — far from any Saudi city
    const result = scoreGuess(-10, 70, saudiCountryClip, dialectData);
    expect(result.total).toBeLessThan(500);
  });

  it("in-country guess still scores well", () => {
    // Clicking directly on Riyadh: nearest in-country city is distance 0
    const result = scoreGuess(24.69, 46.72, saudiCountryClip, dialectData);
    expect(result.distancePoints).toBe(3000);
    expect(result.total).toBeGreaterThanOrEqual(4000);
  });
});
