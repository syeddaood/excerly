export type AlarmId = string;

export type Weekday = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export const WEEKDAYS: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type MathDifficulty = "easy" | "medium" | "hard";

export type MathMissionConfig = {
  kind: "math";
  difficulty: MathDifficulty;
  /** Number of problems to solve (1–5). */
  count: number;
};

export type MissionConfig = MathMissionConfig;

export type SoundId = "default" | "classic" | "digital" | "gentle";

export interface Alarm {
  id: AlarmId;
  label: string;
  /** Local wall-clock time as HH:mm (24h). */
  time: string;
  enabled: boolean;
  /** Weekday recurrence. Empty array = every day. */
  repeatDays: Weekday[];
  soundId: SoundId;
  mission: MissionConfig;
  /** If set, alarm rings at a random time within this many minutes before `time`. */
  randomWindowMinutes?: number;
  /** Persisted random offset (minutes before `time`) when armed. */
  armedRandomOffsetMinutes?: number;
  createdAt: number;
  updatedAt: number;
}

export interface WakeEvent {
  id: string;
  alarmId: AlarmId;
  firedAt: number;
  completedAt: number;
  /** True when dismissed via fallback path (Phase 2). */
  assisted: boolean;
}

export function formatAlarmLabel(alarm: Pick<Alarm, "label" | "time">): string {
  return `${alarm.time} — ${alarm.label}`;
}

export function createDefaultAlarm(partial?: Partial<Alarm>): Alarm {
  const now = Date.now();
  return {
    id: partial?.id ?? `alarm_${now}`,
    label: partial?.label ?? "Wake up",
    time: partial?.time ?? "07:00",
    enabled: partial?.enabled ?? true,
    repeatDays: partial?.repeatDays ?? [],
    soundId: partial?.soundId ?? "default",
    mission: partial?.mission ?? { kind: "math", difficulty: "easy", count: 3 },
    randomWindowMinutes: partial?.randomWindowMinutes,
    armedRandomOffsetMinutes: partial?.armedRandomOffsetMinutes,
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
  };
}
