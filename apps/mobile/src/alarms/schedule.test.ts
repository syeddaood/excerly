import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextTriggerAtMillis, parseWallClockTime } from "./schedule";

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
    // Local: 2024-06-03 06:00 → next 07:00 same day
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
    // 2024-06-03 is a Monday
    const mondayMorning = new Date(2024, 5, 3, 6, 0, 0, 0);
    // Only Wednesdays
    const trigger = nextTriggerAtMillis("07:00", ["Wed"], mondayMorning);
    const expected = new Date(2024, 5, 5, 7, 0, 0, 0).getTime(); // Wed Jun 5
    assert.equal(trigger, expected);
  });

  it("skips today when today is not in repeatDays", () => {
    // Monday 06:00, only Tue
    const mondayMorning = new Date(2024, 5, 3, 6, 0, 0, 0);
    const trigger = nextTriggerAtMillis("07:00", ["Tue"], mondayMorning);
    const expected = new Date(2024, 5, 4, 7, 0, 0, 0).getTime();
    assert.equal(trigger, expected);
  });
});
