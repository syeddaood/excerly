import { Platform } from "react-native";
import nativeModule, {
  type CaptureAndLabelResult,
  type NativeObjectLabel,
} from "./ImageLabelingModule";

export type { CaptureAndLabelResult, NativeObjectLabel };

/** Whether the native ML Kit image-labeling module is linked. */
export function isImageLabelingLinked(): boolean {
  if (Platform.OS !== "android") return false;
  try {
    return nativeModule?.isAvailable() === true;
  } catch {
    return false;
  }
}

/**
 * Label an existing local image with ML Kit.
 * Throws if the native module is unavailable.
 */
export async function labelImage(uri: string): Promise<NativeObjectLabel[]> {
  if (!nativeModule) {
    throw new Error(
      "ImageLabeling native module is not available. Use a custom dev client (expo run:android)."
    );
  }
  return nativeModule.labelImage(uri);
}

/**
 * Capture a photo with the system camera and label it with ML Kit.
 * Throws if the native module is unavailable or the user cancels.
 */
export async function captureAndLabel(): Promise<CaptureAndLabelResult> {
  if (!nativeModule) {
    throw new Error(
      "ImageLabeling native module is not available. Use a custom dev client (expo run:android)."
    );
  }
  return nativeModule.captureAndLabel();
}
