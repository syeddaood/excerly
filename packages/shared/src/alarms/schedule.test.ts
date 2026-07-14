import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  effectiveWallClockTime,
  nextTriggerAfterMillis,
  nextTriggerAtMillis,
  parseWallClockTime,
  pickRandomOffsetMinutes,
} from "./schedule";

describe("parseWallClockTime", () => {
  it("parses HH:mm", () => {
    assert.deepEqual(parseWallClockTime("07:30"), { hours: 7, minutes: 30 });
    assert.deepEqual(parseWallClockTime("23:59"), { hours: 23, minutes: 59 });
    assert.deepEqual(parseWallClockTime("0:05"), { hours: 0, minutes: 5 });
  });

  it("rejects invalid input", () => {
    assert.throws(() => parseWallClockTime("25:00"));
    assert.throws(() => parseWallClockTime("12:60"));
    assert.throws(() => parseWallClockTime("noon"));
  });
});

describe("nextTriggerAtMillis", () => {
  it("returns today's time when still in the future", () => {
    const now = new Date(2024, 5, 3, 6, 0, 0, 0);
    const trigger = nextTriggerAtMillis("07:00", null, now);
    const expected = new Date(2024, 5, 3, 7, 0, 0, 0).getTime();
    assert.equal(trigger, expected);
  });

  it("rolls to tomorrow when today's time has passed", () => {
    const now = new Date(2024, 5, 3, 8, 0, 0, 0);
    const trigger = nextTriggerAtMillis("07:00", null, now);
    const expected = new Date(2024, 5, 4, 7, 0, 0, 0).getTime();
    assert.equal(trigger, expected);
  });

  it("respects repeatDays (weekday filter)", () => {
    const mondayMorning = new Date(2024, 5, 3, 6, 0, 0, 0);
    const trigger = nextTriggerAtMillis("07:00", ["Wed"], mondayMorning);
    const expected = new Date(2024, 5, 5, 7, 0, 0, 0).getTime();
    assert.equal(trigger, expected);
  });

  it("Sat+Sun only — must NOT fire on weekdays (Erly bug regression)", () => {
    const monday = new Date(2024, 5, 3, 6, 0, 0, 0);
    const tue = new Date(2024, 5, 4, 6, 0, 0, 0);
    const wed = new Date(2024, 5, 5, 6, 0, 0, 0);
    const thu = new Date(2024, 5, 6, 6, 0, 0, 0);
    const fri = new Date(2024, 5, 7, 6, 0, 0, 0);
    const sat = new Date(2024, 5, 8, 6, 0, 0, 0);

    const weekend = ["Sat", "Sun"];
    const monTrigger = nextTriggerAtMillis("07:00", weekend, monday);
    const satExpected = new Date(2024, 5, 8, 7, 0, 0, 0).getTime();
    assert.equal(monTrigger, satExpected);

    assert.equal(
      nextTriggerAtMillis("07:00", weekend, tue),
      new Date(2024, 5, 8, 7, 0, 0, 0).getTime()
    );
    assert.equal(
      nextTriggerAtMillis("07:00", weekend, wed),
      new Date(2024, 5, 8, 7, 0, 0, 0).getTime()
    );
    assert.equal(
      nextTriggerAtMillis("07:00", weekend, thu),
      new Date(2024, 5, 8, 7, 0, 0, 0).getTime()
    );
    assert.equal(
      nextTriggerAtMillis("07:00", weekend, fri),
      new Date(2024, 5, 8, 7, 0, 0, 0).getTime()
    );

    const satTrigger = nextTriggerAtMillis("07:00", weekend, sat);
    assert.equal(satTrigger, new Date(2024, 5, 8, 7, 0, 0, 0).getTime());
  });

  it("applies random window offset", () => {
    const now = new Date(2024, 5, 3, 6, 0, 0, 0);
    const trigger = nextTriggerAtMillis("07:00", null, now, 15);
    const expected = new Date(2024, 5, 3, 6, 45, 0, 0).getTime();
    assert.equal(trigger, expected);
  });
});

describe("nextTriggerAfterMillis", () => {
  it("schedules next weekday occurrence after fire", () => {
    const saturdayFire = new Date(2024, 5, 8, 7, 5, 0, 0);
    const next = nextTriggerAfterMillis("07:00", ["Sat", "Sun"], saturdayFire);
    const expected = new Date(2024, 5, 9, 7, 0, 0, 0).getTime();
    assert.equal(next, expected);
  });
});

describe("pickRandomOffsetMinutes", () => {
  it("is deterministic for same alarm id", () => {
    const a = pickRandomOffsetMinutes("alarm_1", 20);
    const b = pickRandomOffsetMinutes("alarm_1", 20);
    assert.equal(a, b);
    assert.ok(a >= 0 && a <= 20);
  });
});

describe("effectiveWallClockTime", () => {
  it("wraps across midnight", () => {
    assert.deepEqual(effectiveWallClockTime("00:30", 45), { hours: 23, minutes: 45 });
  });
});

describe("timezone and DST edges", () => {
  it("recomputes next trigger from a new 'now' after simulated timezone shift", () => {
    // User travels: same wall-clock alarm, but 'now' moved to next calendar day.
    const beforeTravel = new Date(2024, 5, 3, 22, 0, 0, 0);
    const afterTravel = new Date(2024, 5, 4, 22, 0, 0, 0);
    const before = nextTriggerAtMillis("07:00", null, beforeTravel);
    const after = nextTriggerAtMillis("07:00", null, afterTravel);
    assert.equal(before, new Date(2024, 5, 4, 7, 0, 0, 0).getTime());
    assert.equal(after, new Date(2024, 5, 5, 7, 0, 0, 0).getTime());
  });

  it("DST spring-forward day: alarm after the gap still schedules same calendar day", () => {
    // US spring forward 2024-03-10: 2:00 AM -> 3:00 AM. At 1:00 AM, 7:00 AM is still valid.
    const earlyMorning = new Date(2024, 2, 10, 1, 0, 0, 0);
    const trigger = nextTriggerAtMillis("07:00", null, earlyMorning);
    assert.equal(trigger, new Date(2024, 2, 10, 7, 0, 0, 0).getTime());
  });

  it("DST fall-back day: does not schedule a time at or before 'now'", () => {
    // US fall back 2024-11-03. At 6:30 AM, 7:00 AM today is still in the future.
    const morning = new Date(2024, 10, 3, 6, 30, 0, 0);
    const trigger = nextTriggerAtMillis("07:00", null, morning);
    assert.ok(trigger > morning.getTime());
    assert.equal(trigger, new Date(2024, 10, 3, 7, 0, 0, 0).getTime());
  });
});
