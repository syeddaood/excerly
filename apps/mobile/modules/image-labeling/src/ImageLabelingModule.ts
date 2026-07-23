import { requireNativeModule, NativeModule } from "expo-modules-core";
import { Platform } from "react-native";

export type NativeObjectLabel = {
  text: string;
  confidence: number;
};

export type CaptureAndLabelResult = {
  uri: string;
  labels: NativeObjectLabel[];
};

export type ImageLabelingNativeModule = {
  /** Run ML Kit on an existing image URI. */
  labelImage(uri: string): Promise<NativeObjectLabel[]>;
  /** Open camera, capture a photo, run ML Kit, return uri + labels. */
  captureAndLabel(): Promise<CaptureAndLabelResult>;
  /** True when the native module is linked. */
  isAvailable(): boolean;
};

let nativeModule: ImageLabelingNativeModule | null = null;

if (Platform.OS === "android") {
  try {
    nativeModule = requireNativeModule<ImageLabelingNativeModule & NativeModule>(
      "ImageLabeling"
    );
  } catch {
    // Expo Go / missing prebuild — callers must fall back.
    nativeModule = null;
  }
}

export default nativeModule;
