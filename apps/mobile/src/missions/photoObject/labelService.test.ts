import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyCaptureToMission,
  buildPhotoObjectMissionConfig,
  normalizeLabels,
  type LabelCaptureResult,
} from "./fingerprint";

describe("photo-object fingerprint", () => {
  const sample: LabelCaptureResult = {
    uri: "file:///tmp/toothbrush.jpg",
    labels: [
      { text: "Toothbrush", confidence: 0.94 },
      { text: "Hygiene product", confidence: 0.71 },
    ],
    usedNativeMlKit: true,
  };

  it("buildPhotoObjectMissionConfig stores labels and photo uri", () => {
    const config = buildPhotoObjectMissionConfig(sample);
    assert.equal(config.kind, "photo_object");
    assert.equal(config.setupPhotoUri, sample.uri);
    assert.equal(config.labels.length, 2);
    assert.equal(config.labels[0]?.text, "Toothbrush");
    assert.ok(typeof config.registeredAt === "number");
  });

  it("applyCaptureToMission replaces prior fingerprint", () => {
    const first = buildPhotoObjectMissionConfig(sample);
    const second = applyCaptureToMission(first, {
      uri: "file:///tmp/mug.jpg",
      labels: [{ text: "Mug", confidence: 0.88 }],
      usedNativeMlKit: true,
    });
    assert.equal(second.labels.length, 1);
    assert.equal(second.labels[0]?.text, "Mug");
    assert.equal(second.setupPhotoUri, "file:///tmp/mug.jpg");
  });

  it("normalizeLabels trims, clamps, sorts, and caps at 10", () => {
    const labels = normalizeLabels([
      { text: "  Cup ", confidence: 0.4 },
      { text: "", confidence: 0.9 },
      { text: "Table", confidence: 1.5 },
      { text: "Chair", confidence: -0.2 },
      { text: "A", confidence: 0.9 },
      { text: "B", confidence: 0.85 },
      { text: "C", confidence: 0.8 },
      { text: "D", confidence: 0.75 },
      { text: "E", confidence: 0.7 },
      { text: "F", confidence: 0.65 },
      { text: "G", confidence: 0.6 },
      { text: "H", confidence: 0.55 },
      { text: "I", confidence: 0.5 },
      { text: "J", confidence: 0.45 },
    ]);
    assert.equal(labels.length, 10);
    assert.equal(labels[0]?.text, "Table");
    assert.equal(labels[0]?.confidence, 1);
    assert.ok(labels.every((l) => l.text.length > 0));
    assert.ok(labels.every((l) => l.confidence >= 0 && l.confidence <= 1));
    // Sorted desc
    for (let i = 1; i < labels.length; i++) {
      assert.ok(labels[i - 1]!.confidence >= labels[i]!.confidence);
    }
  });
});
