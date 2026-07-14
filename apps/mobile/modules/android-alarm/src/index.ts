import { Platform } from "react-native";
import AndroidAlarmModule from "./AndroidAlarmModule";

export type ScheduleExactAlarmParams = {
  /** Stable alarm id used as PendingIntent request code seed. */
  alarmId: string;
  /** UTC epoch milliseconds when the alarm should fire. */
  triggerAtMillis: number;
  /** Human-readable label shown on the full-screen ringing UI. */
  label?: string;
  /** Weekday names persisted for BootReceiver reschedule metadata. */
  repeatDays?: string[];
  missionKind?: string;
};

/**
 * Whether the custom Android alarm native module is linked (dev build only).
 * Always false on iOS and in Expo Go.
 */
export function isNativeAlarmLinked(): boolean {
  return Platform.OS === "android" && AndroidAlarmModule != null;
}

/**
 * Schedule an exact Android alarm via AlarmManager.setExactAndAllowWhileIdle.
 * No-ops on non-Android platforms and when the native module is not linked (Expo Go).
 */
export function scheduleExactAlarm(params: ScheduleExactAlarmParams): void {
  if (Platform.OS !== "android") {
    return;
  }
  if (!AndroidAlarmModule) {
    if (__DEV__) {
      console.warn(
        "[DawnLock] Native alarm module not linked — alarms will not fire. " +
          "Use `npx expo run:android` for a dev build (Expo Go is not supported)."
      );
    }
    return;
  }
  const {
    alarmId,
    triggerAtMillis,
    label = "",
    repeatDays = [],
    missionKind = "math",
  } = params;
  if (!alarmId) {
    throw new Error("scheduleExactAlarm requires a non-empty alarmId");
  }
  if (!Number.isFinite(triggerAtMillis) || triggerAtMillis <= 0) {
    throw new Error("scheduleExactAlarm requires a positive triggerAtMillis");
  }
  AndroidAlarmModule.scheduleExactAlarm(
    alarmId,
    triggerAtMillis,
    label,
    repeatDays,
    missionKind
  );
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
 * Always true on pre-S Android; false on non-Android / unlinked module.
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
 * Next stored wall-clock trigger epoch-ms for [alarmId], or null if none / unlinked.
 */
export function getStoredTriggerAtMillis(alarmId: string): number | null {
  if (Platform.OS !== "android" || !AndroidAlarmModule) {
    return null;
  }
  if (!alarmId) {
    return null;
  }
  const value = AndroidAlarmModule.getStoredTriggerAtMillis(alarmId);
  return value > 0 ? value : null;
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
  getStoredTriggerAtMillis,
  stopRinging,
  isNativeAlarmLinked,
};
