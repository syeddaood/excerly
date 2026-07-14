import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Alarm } from "@dawnlock/shared";
import { nextTriggerAfterMillis } from "@dawnlock/shared";
import { enabledAlarms, toSchedulable } from "./engineHelpers";

const baseAlarm: Alarm = {
  id: "alarm_test",
  label: "Wake",
  time: "07:00",
  enabled: true,
  repeatDays: ["Sat", "Sun"],
  soundId: "default",
  mission: { kind: "math", difficulty: "easy", count: 3 },
  createdAt: 0,
  updatedAt: 0,
};

describe("toSchedulable", () => {
  it("maps alarm fields for native scheduling", () => {
    const s = toSchedulable(baseAlarm);
    assert.equal(s.id, "alarm_test");
    assert.equal(s.time, "07:00");
    assert.equal(s.missionKind, "math");
    assert.deepEqual(s.repeatDaysForNative, ["Sat", "Sun"]);
  });

  it("includes random offset when window is set", () => {
    const s = toSchedulable({ ...baseAlarm, randomWindowMinutes: 15 });
    assert.ok(typeof s.randomOffsetMinutes === "number");
    assert.ok(s.randomOffsetMinutes! >= 0 && s.randomOffsetMinutes! <= 15);
  });
});

describe("onAlarmFired reschedule math", () => {
  it("computes next Sunday after Saturday fire", () => {
    const after = new Date(2024, 5, 8, 7, 5, 0, 0);
    const next = nextTriggerAfterMillis("07:00", ["Sat", "Sun"], after);
    assert.equal(next, new Date(2024, 5, 9, 7, 0, 0, 0).getTime());
  });
});

describe("syncNativeAlarms enabled filter", () => {
  it("only enabled alarms are schedulable", () => {
    const alarms = [baseAlarm, { ...baseAlarm, id: "off", enabled: false }];
    const schedulable = enabledAlarms(alarms).map(toSchedulable);
    assert.equal(schedulable.length, 1);
    assert.equal(schedulable[0].id, "alarm_test");
  });
});
