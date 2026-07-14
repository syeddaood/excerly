/**
 * @dawnlock/shared — types and pure utilities for DawnLock / RiseLock.
 */

export type {
  Alarm,
  AlarmId,
  MathDifficulty,
  MathMissionConfig,
  MissionConfig,
  SoundId,
  WakeEvent,
  Weekday,
} from "./types/alarm";

export {
  WEEKDAYS,
  createDefaultAlarm,
  formatAlarmLabel,
} from "./types/alarm";

export {
  effectiveWallClockTime,
  nextTriggerAfterMillis,
  nextTriggerAtMillis,
  parseWallClockTime,
  pickRandomOffsetMinutes,
} from "./alarms/schedule";

export const PACKAGE_NAME = "@dawnlock/shared" as const;
