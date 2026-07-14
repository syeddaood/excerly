/**
 * Pure helpers for computing the next Android exact-alarm trigger time.
 * Kept free of native imports so unit tests and shared logic stay portable.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse "HH:mm" (24h) into hours/minutes. Throws on invalid input. */
export function parseWallClockTime(time: string): { hours: number; minutes: number } {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) {
    throw new Error(`Invalid wall-clock time "${time}"; expected HH:mm (24h)`);
  }
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

/**
 * Next UTC epoch millis for a local wall-clock time, optionally constrained
 * to a set of weekday names (e.g. ["Mon","Tue"]). Empty/undefined repeatDays
 * means "every day" (fire at the next occurrence of that time).
 *
 * Weekday names are matched case-insensitively against the first 3 letters of
 * the English short weekday (Sun..Sat).
 */
export function nextTriggerAtMillis(
  time: string,
  repeatDays?: string[] | null,
  now: Date = new Date()
): number {
  const { hours, minutes } = parseWallClockTime(time);
  const allowed = normalizeRepeatDays(repeatDays);

  // Start from "today" at the target local wall-clock time.
  const candidate = new Date(now.getTime());
  candidate.setSeconds(0, 0);
  candidate.setHours(hours, minutes, 0, 0);

  for (let offset = 0; offset < 8; offset++) {
    const day = new Date(candidate.getTime() + offset * DAY_MS);
    // Re-apply wall-clock after day arithmetic to avoid DST edge drift.
    day.setHours(hours, minutes, 0, 0);
    if (day.getTime() <= now.getTime()) {
      continue;
    }
    if (allowed === null || allowed.has(weekdayKey(day))) {
      return day.getTime();
    }
  }

  // Fallback: 24h from now (should be unreachable with a full week scan).
  return now.getTime() + DAY_MS;
}

function normalizeRepeatDays(repeatDays?: string[] | null): Set<string> | null {
  if (!repeatDays || repeatDays.length === 0) {
    return null;
  }
  const set = new Set<string>();
  for (const d of repeatDays) {
    const key = d.trim().slice(0, 3).toLowerCase();
    if (key) set.add(key);
  }
  return set.size === 0 ? null : set;
}

function weekdayKey(date: Date): string {
  // "Sun","Mon",... → lowercase 3-letter key
  return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3).toLowerCase();
}
