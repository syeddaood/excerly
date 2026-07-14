/**
 * Android exact-alarm scheduling service.
 *
 * Wraps the local Expo native module (AlarmManager.setExactAndAllowWhileIdle,
 * full-screen intent, foreground ringing service, boot reschedule).
 *
 * Safe to import on iOS — all methods no-op when Platform.OS !== "android".
 */

import { Platform } from "react-native";
import {
  scheduleExactAlarm as nativeSchedule,
  cancelExactAlarm as nativeCancel,
  canScheduleExactAlarms as nativeCanSchedule,
  stopRinging as nativeStopRinging,
} from "../../modules/android-alarm/src";
import { nextTriggerAtMillis } from "./schedule";

export type SchedulableAlarm = {
  id: string;
  /** Local wall-clock time as HH:mm (24h). */
  time: string;
  /** Optional weekday names; empty/undefined = every day. */
  repeatDays?: string[];
  label?: string;
  /** When false, any existing native schedule is cancelled and nothing is set. */
  enabled?: boolean;
};

/**
 * Schedule (or cancel) the native Android exact alarm for a single alarm.
 * Computes the next trigger from wall-clock time + optional repeat days.
 */
export function scheduleAndroidAlarm(alarm: SchedulableAlarm, now: Date = new Date()): void {
  if (Platform.OS !== "android") {
    return;
  }

  if (alarm.enabled === false) {
    cancelAndroidAlarm(alarm.id);
    return;
  }

  const triggerAtMillis = nextTriggerAtMillis(alarm.time, alarm.repeatDays, now);
  nativeSchedule({
    alarmId: alarm.id,
    triggerAtMillis,
    label: alarm.label ?? "",
  });
}

/** Cancel a previously scheduled Android exact alarm. */
export function cancelAndroidAlarm(alarmId: string): void {
  if (Platform.OS !== "android") {
    return;
  }
  nativeCancel(alarmId);
}

/**
 * Re-apply native schedules for a full alarm list (e.g. after boot JS resume
 * or after bulk edit). Disabled alarms are cancelled.
 */
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
