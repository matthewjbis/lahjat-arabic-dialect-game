/**
 * Daily-streak math, computed from the timestamps of completed games.
 *
 * A "day" is the player's local calendar day. The current streak counts
 * consecutive days up to today; it is still considered alive if the player
 * last played *yesterday* (so a streak only breaks after a full missed day).
 */

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function uniqueDays(playedAt: Array<string | Date>): Set<number> {
  return new Set(playedAt.map((p) => startOfDay(new Date(p))));
}

/**
 * Consecutive-day streak ending today (or yesterday, if today hasn't been
 * played yet). Returns 0 if the most recent play is older than yesterday.
 */
export function computeCurrentStreak(
  playedAt: Array<string | Date>,
  now: Date = new Date()
): number {
  const days = uniqueDays(playedAt);
  if (days.size === 0) return 0;

  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  // Anchor on today; if today hasn't been played, allow yesterday so an
  // in-progress streak isn't reported as broken before the day is over.
  if (!days.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.getTime())) return 0;
  }

  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Longest consecutive-day streak anywhere in the player's history. */
export function computeLongestStreak(playedAt: Array<string | Date>): number {
  const days = [...uniqueDays(playedAt)].sort((a, b) => a - b);
  if (days.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    const expectedPrev = new Date(days[i]);
    expectedPrev.setDate(expectedPrev.getDate() - 1);
    if (expectedPrev.getTime() === days[i - 1]) {
      current++;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }
  return longest;
}
