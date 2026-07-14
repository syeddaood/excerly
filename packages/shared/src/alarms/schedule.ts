/**
 * Pure helpers for computing the next alarm trigger time.
 * No platform imports — safe for unit tests and shared logic.
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
 * Effective wall-clock time after applying a persisted random window offset.
 * Offset is minutes BEFORE the target time (e.g. 15 = ring 15 min early).
 */
export function effectiveWallClockTime(
  time: string,
  randomOffsetMinutes?: number
): { hours: number; minutes: number } {
  if (!randomOffsetMinutes || randomOffsetMinutes <= 0) {
    return parseWallClockTime(time);
  }
  const { hours, minutes } = parseWallClockTime(time);
  const total = hours * 60 + minutes - randomOffsetMinutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return { hours: Math.floor(normalized / 60), minutes: normalized % 60 };
}

/**
 * Pick a deterministic random offset in [0, windowMinutes] for an alarm id.
 * Persist the result on the alarm as armedRandomOffsetMinutes when arming.
 */
export function pickRandomOffsetMinutes(alarmId: string, windowMinutes: number): number {
  if (windowMinutes <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < alarmId.length; i++) {
    hash = (hash * 31 + alarmId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % (windowMinutes + 1);
}

/**
 * Next UTC epoch millis for a local wall-clock time, optionally constrained
 * to weekday names. Empty repeatDays means every day.
 */
export function nextTriggerAtMillis(
  time: string,
  repeatDays?: string[] | null,
  now: Date = new Date(),
  randomOffsetMinutes?: number
): number {
  const { hours, minutes } = effectiveWallClockTime(time, randomOffsetMinutes);
  const allowed = normalizeRepeatDays(repeatDays);

  const candidate = new Date(now.getTime());
  candidate.setSeconds(0, 0);
  candidate.setHours(hours, minutes, 0, 0);

  for (let offset = 0; offset < 8; offset++) {
    const day = new Date(candidate.getTime() + offset * DAY_MS);
    day.setHours(hours, minutes, 0, 0);
    if (day.getTime() <= now.getTime()) {
      continue;
    }
    if (allowed === null || allowed.has(weekdayKey(day))) {
      return day.getTime();
    }
  }

  return now.getTime() + DAY_MS;
}

/** Next trigger strictly after a given instant (for post-fire reschedule). */
export function nextTriggerAfterMillis(
  time: string,
  repeatDays: string[] | null | undefined,
  after: Date,
  randomOffsetMinutes?: number
): number {
  return nextTriggerAtMillis(time, repeatDays, new Date(after.getTime() + 1000), randomOffsetMinutes);
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
  return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3).toLowerCase();
}
