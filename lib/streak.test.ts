import { describe, it, expect } from "vitest";
import { computeCurrentStreak, computeLongestStreak } from "./streak";

// Fixed "now" so tests are deterministic: noon, June 18 2026 (local time).
const NOW = new Date(2026, 5, 18, 12, 0, 0);
const day = (n: number) => new Date(2026, 5, n, 9, 0, 0); // 9am on June `n`

describe("computeCurrentStreak", () => {
  it("is 0 with no games", () => {
    expect(computeCurrentStreak([], NOW)).toBe(0);
  });

  it("counts a single play today as 1", () => {
    expect(computeCurrentStreak([day(18)], NOW)).toBe(1);
  });

  it("counts consecutive days ending today", () => {
    expect(computeCurrentStreak([day(16), day(17), day(18)], NOW)).toBe(3);
  });

  it("stays alive when the last play was yesterday", () => {
    expect(computeCurrentStreak([day(16), day(17)], NOW)).toBe(2);
  });

  it("is 0 when the last play is older than yesterday", () => {
    expect(computeCurrentStreak([day(15), day(16)], NOW)).toBe(0);
  });

  it("ignores multiple games on the same day (deduped)", () => {
    expect(
      computeCurrentStreak([day(18), new Date(2026, 5, 18, 20, 0, 0), day(17)], NOW)
    ).toBe(2);
  });

  it("stops at a gap", () => {
    // played 18, 17, then a gap (missed 16), then 15 — current streak is 2
    expect(computeCurrentStreak([day(15), day(17), day(18)], NOW)).toBe(2);
  });

  it("accepts ISO date strings", () => {
    expect(
      computeCurrentStreak([day(17).toISOString(), day(18).toISOString()], NOW)
    ).toBe(2);
  });
});

describe("computeLongestStreak", () => {
  it("is 0 with no games", () => {
    expect(computeLongestStreak([])).toBe(0);
  });

  it("finds the longest run regardless of recency", () => {
    // run of 3 (1,2,3), gap, run of 2 (10,11)
    const dates = [day(1), day(2), day(3), day(10), day(11)];
    expect(computeLongestStreak(dates)).toBe(3);
  });

  it("treats same-day duplicates as one", () => {
    expect(computeLongestStreak([day(5), day(5), day(6)])).toBe(2);
  });
});
