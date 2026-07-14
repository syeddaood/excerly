import { Platform } from "react-native";
import AndroidAlarmModule from "./AndroidAlarmModule";

export type ScheduleExactAlarmParams = {
  /** Stable alarm id used as PendingIntent request code seed. */
  alarmId: string;
  /** UTC epoch milliseconds when the alarm should fire. */
  triggerAtMillis: number;
  /** Human-readable label shown on the full-screen ringing UI. */
  label?: string;
};

/**
 * Schedule an exact Android alarm via AlarmManager.setExactAndAllowWhileIdle.
 * No-ops on non-Android platforms (iOS is handled by a separate issue).
 */
export function scheduleExactAlarm(params: ScheduleExactAlarmParams): void {
  if (Platform.OS !== "android") {
    return;
  }
  if (!AndroidAlarmModule) {
    throw new Error(
      "dawnlock-android-alarm native module is not linked. Use a dev client / prebuild build (Expo Go is unsupported)."
    );
  }
  const { alarmId, triggerAtMillis, label = "" } = params;
  if (!alarmId) {
    throw new Error("scheduleExactAlarm requires a non-empty alarmId");
  }
  if (!Number.isFinite(triggerAtMillis) || triggerAtMillis <= 0) {
    throw new Error("scheduleExactAlarm requires a positive triggerAtMillis");
  }
  AndroidAlarmModule.scheduleExactAlarm(alarmId, triggerAtMillis, label);
}

/**
 * Cancel a previously scheduled exact alarm by id.
 */
export function cancelExactAlarm(alarmId: string): void {
  if (Platform.OS !== "android") {
    return;
  }
  if (!AndroidAlarmModule) {
    return;
  }
  if (!alarmId) {
    throw new Error("cancelExactAlarm requires a non-empty alarmId");
  }
  AndroidAlarmModule.cancelAlarm(alarmId);
}

/**
 * Whether the app currently holds the SCHEDULE_EXACT_ALARM privilege (API 31+).
 * Always true on pre-S Android; false on non-Android.
 */
export function canScheduleExactAlarms(): boolean {
  if (Platform.OS !== "android") {
    return false;
  }
  if (!AndroidAlarmModule) {
    return false;
  }
  return AndroidAlarmModule.canScheduleExactAlarms();
}

/**
 * Stop the ringing foreground service (call after mission success).
 */
export function stopRinging(): void {
  if (Platform.OS !== "android") {
    return;
  }
  AndroidAlarmModule?.stopRinging();
}

export default {
  scheduleExactAlarm,
  cancelExactAlarm,
  canScheduleExactAlarms,
  stopRinging,
};
