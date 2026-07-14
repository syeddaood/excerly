import { requireNativeModule, NativeModule } from "expo-modules-core";
import { Platform } from "react-native";

/**
 * Typed surface of the Android-only Expo native module.
 *
 * Linked only in a custom dev client / prebuild (`npx expo run:android`).
 * Not available in Expo Go.
 */
export type AndroidAlarmNativeModule = {
  /**
   * Schedule via AlarmManager.setExactAndAllowWhileIdle (RTC_WAKEUP).
   * Persists to AlarmStore for BOOT_COMPLETED reschedule.
   */
  scheduleExactAlarm(
    alarmId: string,
    triggerAtMillis: number,
    label: string,
    repeatDays: string[],
    missionKind: string
  ): void;
  /** Cancel a previously scheduled exact alarm and remove it from AlarmStore. */
  cancelAlarm(alarmId: string): void;
  /**
   * Whether the app currently holds SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM
   * privilege (API 31+). Always true on pre-S Android.
   */
  canScheduleExactAlarms(): boolean;
  /** Stop the mediaPlayback foreground ringing service. */
  stopRinging(): void;
  /**
   * Next stored wall-clock trigger epoch-ms for [alarmId], or -1 if none.
   * Useful for next-trigger helpers without recomputing from JS.
   */
  getStoredTriggerAtMillis(alarmId: string): number;
};

let nativeModule: AndroidAlarmNativeModule | null = null;

if (Platform.OS === "android") {
  try {
    nativeModule = requireNativeModule<AndroidAlarmNativeModule & NativeModule>("AndroidAlarm");
  } catch {
    // Expo Go / missing prebuild — callers must no-op.
    nativeModule = null;
  }
}

export default nativeModule;
