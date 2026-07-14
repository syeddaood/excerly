import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatAlarmLabel, PACKAGE_NAME, type Alarm } from "./index";

describe("@dawnlock/shared smoke", () => {
  it("exports package identity", () => {
    assert.equal(PACKAGE_NAME, "@dawnlock/shared");
  });

  it("formats an alarm label", () => {
    const alarm: Pick<Alarm, "label" | "time"> = {
      label: "Wake up",
      time: "06:30",
    };
    assert.equal(formatAlarmLabel(alarm), "06:30 — Wake up");
  });
});
