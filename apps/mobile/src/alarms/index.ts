/**
 * Public surface for mobile alarm scheduling.
 * Issue #10: Android exact-alarm firing (AlarmManager + FGS + full-screen intent).
 */

export {
  scheduleAndroidAlarm,
  cancelAndroidAlarm,
  rescheduleAllAndroidAlarms,
  canScheduleExactAlarms,
  stopAndroidRinging,
  type SchedulableAlarm,
} from "./androidAlarmService";

export { nextTriggerAtMillis, parseWallClockTime } from "./schedule";
