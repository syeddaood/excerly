/**
 * @dawnlock/shared — public API surface for types and pure utilities.
 * Feature modules land in later issues; this is the monorepo smoke entrypoint.
 */

export type AlarmId = string;
export type MissionId = string;

/** Minimal alarm shape shared by mobile + API (expanded in later issues). */
export interface Alarm {
  id: AlarmId;
  label: string;
  /** Local wall-clock time as HH:mm (24h). */
  time: string;
  enabled: boolean;
  missionId: MissionId | null;
  /**
   * Optional weekday names for recurrence (e.g. ["Mon","Wed"]).
   * Empty / omitted means every day. Used by Android exact-alarm scheduling.
   */
  repeatDays?: string[];
  /** Ringtone key; default handled by the platform ringing service. */
  sound?: string;
  /** Mission kind string used by the ringing / mission flow. */
  missionType?: MissionKind | string;
}

/** Placeholder mission kinds; concrete mission payloads arrive in later issues. */
export type MissionKind = "photo" | "math" | "steps";

export interface Mission {
  id: MissionId;
  kind: MissionKind;
  label: string;
}

/** Smoke helper used by the shared package test + typecheck path. */
export function formatAlarmLabel(alarm: Pick<Alarm, "label" | "time">): string {
  return `${alarm.time} — ${alarm.label}`;
}

export const PACKAGE_NAME = "@dawnlock/shared" as const;
