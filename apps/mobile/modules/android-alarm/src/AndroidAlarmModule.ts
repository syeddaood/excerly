import { requireNativeModule, NativeModule } from "expo-modules-core";
import { Platform } from "react-native";

export type AndroidAlarmNativeModule = {
  scheduleExactAlarm(
    alarmId: string,
    triggerAtMillis: number,
    label: string,
    repeatDays: string[],
    missionKind: string
  ): void;
  cancelAlarm(alarmId: string): void;
  canScheduleExactAlarms(): boolean;
  stopRinging(): void;
};

/**
 * Lazily resolve the native module. Returns null on iOS / when unlinked
 * (e.g. Expo Go) so JS callers can degrade gracefully.
 */
function loadModule(): AndroidAlarmNativeModule | null {
  if (Platform.OS !== "android") {
    return null;
  }
  try {
    return requireNativeModule<AndroidAlarmNativeModule>("AndroidAlarm");
  } catch {
    return null;
  }
}

const AndroidAlarmModule: AndroidAlarmNativeModule | null = loadModule();

export default AndroidAlarmModule;

// Re-export NativeModule type for consumers that need it.
export type { NativeModule };
