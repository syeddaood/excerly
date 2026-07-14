/**
 * Public surface for mobile alarm scheduling.
 */

export {
  scheduleAndroidAlarm,
  cancelAndroidAlarm,
  rescheduleAllAndroidAlarms,
  canScheduleExactAlarms,
  getAndroidStoredTriggerAtMillis,
  stopAndroidRinging,
  isNativeAlarmLinked,
  type SchedulableAlarm,
} from "./androidAlarmService";

export { syncNativeAlarms, onAlarmFired, cancelAlarm, deleteAlarmEngine } from "./engine";

export {
  nextTriggerAtMillis,
  nextTriggerAfterMillis,
  parseWallClockTime,
  pickRandomOffsetMinutes,
} from "@dawnlock/shared";
