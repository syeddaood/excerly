import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultAlarm, formatAlarmLabel, PACKAGE_NAME } from "./index";

describe("@dawnlock/shared", () => {
  it("formatAlarmLabel", () => {
    assert.equal(formatAlarmLabel({ time: "06:30", label: "Wake up" }), "06:30 — Wake up");
  });

  it("createDefaultAlarm", () => {
    const alarm = createDefaultAlarm({ label: "Test" });
    assert.equal(alarm.label, "Test");
    assert.equal(alarm.mission.kind, "math");
    assert.equal(alarm.enabled, true);
  });

  it("PACKAGE_NAME", () => {
    assert.equal(PACKAGE_NAME, "@dawnlock/shared");
  });
});
