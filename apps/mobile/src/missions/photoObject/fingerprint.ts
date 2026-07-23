/**
 * Pure helpers for photo-object mission fingerprints.
 * No native / React Native imports — safe for Node unit tests.
 */

import type { ObjectLabel, PhotoObjectMissionConfig } from "@dawnlock/shared";

export type LabelCaptureResult = {
  uri: string;
  labels: ObjectLabel[];
  /** True when labels came from on-device ML Kit. */
  usedNativeMlKit: boolean;
};

/**
 * Build a PhotoObjectMissionConfig fingerprint from a capture result.
 */
export function buildPhotoObjectMissionConfig(
  capture: LabelCaptureResult
): PhotoObjectMissionConfig {
  return {
    kind: "photo_object",
    labels: capture.labels,
    setupPhotoUri: capture.uri,
    registeredAt: Date.now(),
  };
}

/**
 * Merge a fresh capture into an existing photo-object mission config.
 */
export function applyCaptureToMission(
  _existing: PhotoObjectMissionConfig | undefined,
  capture: LabelCaptureResult
): PhotoObjectMissionConfig {
  return buildPhotoObjectMissionConfig(capture);
}

/**
 * Normalize raw ML Kit labels into a stable fingerprint set.
 */
export function normalizeLabels(
  raw: { text: string; confidence: number }[]
): ObjectLabel[] {
  return raw
    .filter((l) => typeof l.text === "string" && l.text.trim().length > 0)
    .map((l) => ({
      text: l.text.trim(),
      confidence: clamp01(Number(l.confidence) || 0),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
