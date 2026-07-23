/**
 * Photo-object labeling service.
 *
 * Wraps the native ML Kit module (dawnlock-image-labeling) and builds
 * registration fingerprints stored on the alarm's mission config (local store).
 *
 * When the native module is not linked (Expo Go / web / tests), a deterministic
 * mock labeler is used so setup UI remains exercisable in development.
 */

import type { ObjectLabel } from "@dawnlock/shared";
import {
  captureAndLabel as nativeCaptureAndLabel,
  isImageLabelingLinked,
  labelImage as nativeLabelImage,
  type CaptureAndLabelResult,
} from "dawnlock-image-labeling";
import {
  applyCaptureToMission,
  buildPhotoObjectMissionConfig,
  normalizeLabels,
  type LabelCaptureResult,
} from "./fingerprint";

export type { LabelCaptureResult };
export { applyCaptureToMission, buildPhotoObjectMissionConfig, normalizeLabels };

/**
 * Development / Expo Go fallback: produce a stable synthetic fingerprint so
 * the registration flow can be exercised without a custom native build.
 * Never used when the native module is linked.
 */
function mockCaptureAndLabel(): LabelCaptureResult {
  const now = Date.now();
  const labels: ObjectLabel[] = [
    { text: "Object", confidence: 0.92 },
    { text: "Household goods", confidence: 0.78 },
    { text: "Product", confidence: 0.65 },
  ];
  return {
    uri: `mock://photo-object/${now}`,
    labels,
    usedNativeMlKit: false,
  };
}

function mockLabelImage(_uri: string): ObjectLabel[] {
  return mockCaptureAndLabel().labels;
}

/** Whether on-device ML Kit labeling is available. */
export function isMlKitAvailable(): boolean {
  return isImageLabelingLinked();
}

/**
 * Photograph a target object and run ML Kit image labeling.
 * Returns the local photo URI and the normalized label fingerprint.
 */
export async function captureTargetObject(): Promise<LabelCaptureResult> {
  if (!isImageLabelingLinked()) {
    return mockCaptureAndLabel();
  }
  const result: CaptureAndLabelResult = await nativeCaptureAndLabel();
  return {
    uri: result.uri,
    labels: normalizeLabels(result.labels),
    usedNativeMlKit: true,
  };
}

/**
 * Run ML Kit labeling on an existing local image URI.
 */
export async function labelTargetImage(uri: string): Promise<ObjectLabel[]> {
  if (!isImageLabelingLinked()) {
    return mockLabelImage(uri);
  }
  const labels = await nativeLabelImage(uri);
  return normalizeLabels(labels);
}
