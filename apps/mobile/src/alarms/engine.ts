import type { Alarm } from "@dawnlock/shared";
import {
  nextTriggerAfterMillis,
  pickRandomOffsetMinutes,
} from "@dawnlock/shared";
import {
  cancelAndroidAlarm,
  rescheduleAllAndroidAlarms,
  scheduleAndroidAlarm,
} from "./androidAlarmService";
import { enabledAlarms, toSchedulable } from "./engineHelpers";

/** Sync all enabled alarms to the native Android scheduler. */
export function syncNativeAlarms(alarms: Alarm[], now: Date = new Date()): void {
  rescheduleAllAndroidAlarms(enabledAlarms(alarms).map(toSchedulable), now);
}

/**
 * Called when the ring screen opens after a native fire.
 * Reschedules the next occurrence for repeating alarms.
 */
export function onAlarmFired(alarmId: string, alarms: Alarm[]): void {
  const alarm = alarms.find((a) => a.id === alarmId);
  if (!alarm || !alarm.enabled) {
    cancelAndroidAlarm(alarmId);
    return;
  }

  const randomOffset =
    alarm.randomWindowMinutes && alarm.randomWindowMinutes > 0
      ? pickRandomOffsetMinutes(alarm.id, alarm.randomWindowMinutes)
      : undefined;

  const nextAt = nextTriggerAfterMillis(
    alarm.time,
    alarm.repeatDays,
    new Date(),
    randomOffset
  );

  scheduleAndroidAlarm(
    {
      ...toSchedulable(alarm),
      enabled: true,
      randomOffsetMinutes: randomOffset,
      triggerAtMillis: nextAt,
    },
    new Date()
  );
}

export function cancelAlarm(id: string, alarms: Alarm[]): void {
  cancelAndroidAlarm(id);
  syncNativeAlarms(alarms.filter((a) => a.id !== id));
}

export function deleteAlarmEngine(id: string): void {
  cancelAndroidAlarm(id);
}

export { toSchedulable, enabledAlarms } from "./engineHelpers";
