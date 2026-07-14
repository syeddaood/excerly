/**
 * Android exact-alarm scheduling service.
 *
 * Wraps the local Expo native module (AlarmManager.setAlarmClock,
 * full-screen intent, foreground ringing service, boot reschedule).
 *
 * Safe to import on iOS — all methods no-op when Platform.OS !== "android".
 */

import { Platform } from "react-native";
import { nextTriggerAtMillis } from "@dawnlock/shared";
import {
  scheduleExactAlarm as nativeSchedule,
  cancelExactAlarm as nativeCancel,
  canScheduleExactAlarms as nativeCanSchedule,
  stopRinging as nativeStopRinging,
} from "../../modules/android-alarm/src";

export type SchedulableAlarm = {
  id: string;
  /** Local wall-clock time as HH:mm (24h). */
  time: string;
  /** Optional weekday names; empty/undefined = every day. */
  repeatDays?: string[];
  label?: string;
  enabled?: boolean;
  randomOffsetMinutes?: number;
  missionKind?: string;
  repeatDaysForNative?: string[];
  /** When set, skips nextTriggerAtMillis computation (post-fire reschedule). */
  triggerAtMillis?: number;
};

/**
 * Schedule (or cancel) the native Android exact alarm for a single alarm.
 */
export function scheduleAndroidAlarm(alarm: SchedulableAlarm, now: Date = new Date()): void {
  if (Platform.OS !== "android") {
    return;
  }

  if (alarm.enabled === false) {
    cancelAndroidAlarm(alarm.id);
    return;
  }

  const triggerAtMillis =
    alarm.triggerAtMillis ??
    nextTriggerAtMillis(alarm.time, alarm.repeatDays, now, alarm.randomOffsetMinutes);

  nativeSchedule({
    alarmId: alarm.id,
    triggerAtMillis,
    label: alarm.label ?? "",
    repeatDays: alarm.repeatDaysForNative ?? alarm.repeatDays ?? [],
    missionKind: alarm.missionKind ?? "math",
  });
}

/** Cancel a previously scheduled Android exact alarm. */
export function cancelAndroidAlarm(alarmId: string): void {
  if (Platform.OS !== "android") {
    return;
  }
  nativeCancel(alarmId);
}

/** Re-apply native schedules for a full alarm list. */
export function rescheduleAllAndroidAlarms(
  alarms: SchedulableAlarm[],
  now: Date = new Date()
): void {
  if (Platform.OS !== "android") {
    return;
  }
  for (const alarm of alarms) {
    scheduleAndroidAlarm(alarm, now);
  }
}

export function canScheduleExactAlarms(): boolean {
  if (Platform.OS !== "android") {
    return false;
  }
  return nativeCanSchedule();
}

/** Stop the ringing foreground service after mission success. */
export function stopAndroidRinging(): void {
  if (Platform.OS !== "android") {
    return;
  }
  nativeStopRinging();
}
