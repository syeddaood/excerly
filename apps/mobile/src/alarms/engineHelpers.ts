import type { Alarm } from "@dawnlock/shared";
import { pickRandomOffsetMinutes } from "@dawnlock/shared";
import type { SchedulableAlarm } from "./androidAlarmService";

export function toSchedulable(alarm: Alarm): SchedulableAlarm {
  const randomOffset =
    alarm.randomWindowMinutes && alarm.randomWindowMinutes > 0
      ? alarm.armedRandomOffsetMinutes ??
        pickRandomOffsetMinutes(alarm.id, alarm.randomWindowMinutes)
      : undefined;

  return {
    id: alarm.id,
    time: alarm.time,
    repeatDays: alarm.repeatDays,
    label: alarm.label,
    enabled: alarm.enabled,
    randomOffsetMinutes: randomOffset,
    missionKind: alarm.mission.kind,
    repeatDaysForNative: alarm.repeatDays,
  };
}

export function enabledAlarms(alarms: Alarm[]): Alarm[] {
  return alarms.filter((a) => a.enabled);
}
