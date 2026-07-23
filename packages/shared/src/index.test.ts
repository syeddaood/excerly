import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDefaultAlarm,
  createEmptyPhotoObjectMission,
  formatAlarmLabel,
  isPhotoObjectRegistered,
  PACKAGE_NAME,
} from "./index";

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

  it("photo object mission helpers", () => {
    const empty = createEmptyPhotoObjectMission();
    assert.equal(empty.kind, "photo_object");
    assert.equal(empty.labels.length, 0);
    assert.equal(isPhotoObjectRegistered(empty), false);

    const registered = {
      ...empty,
      labels: [{ text: "Mug", confidence: 0.9 }],
      setupPhotoUri: "file:///tmp/mug.jpg",
      registeredAt: Date.now(),
    };
    assert.equal(isPhotoObjectRegistered(registered), true);
  });

  it("PACKAGE_NAME", () => {
    assert.equal(PACKAGE_NAME, "@dawnlock/shared");
  });
});
