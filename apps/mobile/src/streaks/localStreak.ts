import type { WakeEvent } from "@dawnlock/shared";

export type LocalStreakStatus = {
  /** Consecutive successful wake days ending today or yesterday. */
  current: number;
  /** Longest consecutive run in the provided history. */
  longest: number;
  /** Distinct calendar days with at least one completed wake. */
  totalWins: number;
};

function dayKey(ts: number, timeZone?: string): string {
  // YYYY-MM-DD in local (or given) timezone
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts));
}

function shiftDayKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Lightweight local streak from wake events for the mission success screen.
 * Full streak engine (DST edges, losses, server finalize) lives in a later issue.
 */
export function computeLocalStreak(
  wakeEvents: WakeEvent[],
  now: number = Date.now(),
  timeZone?: string
): LocalStreakStatus {
  const winDays = new Set<string>();
  for (const e of wakeEvents) {
    if (typeof e.completedAt === "number" && e.completedAt > 0) {
      winDays.add(dayKey(e.completedAt, timeZone));
    }
  }

  const totalWins = winDays.size;
  if (totalWins === 0) {
    return { current: 0, longest: 0, totalWins: 0 };
  }

  const today = dayKey(now, timeZone);
  const yesterday = shiftDayKey(today, -1);

  // Current streak: walk backward from today if won today, else from yesterday.
  let cursor: string | null = null;
  if (winDays.has(today)) cursor = today;
  else if (winDays.has(yesterday)) cursor = yesterday;

  let current = 0;
  while (cursor && winDays.has(cursor)) {
    current += 1;
    cursor = shiftDayKey(cursor, -1);
  }

  // Longest streak over all win days
  const sorted = Array.from(winDays).sort();
  let longest = sorted.length > 0 ? 1 : 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (shiftDayKey(prev, 1) === cur) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, current);

  return { current, longest, totalWins };
}
