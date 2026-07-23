/**
 * Photo-object mission registration UI.
 *
 * Shown during alarm create/edit when the user selects the photo-object mission.
 * Lets the user photograph a target object; ML Kit labels are stored locally
 * as the object fingerprint on the mission config.
 */

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import type { ObjectLabel, PhotoObjectMissionConfig } from "@dawnlock/shared";
import { isPhotoObjectRegistered } from "@dawnlock/shared";
import {
  captureTargetObject,
  isMlKitAvailable,
  type LabelCaptureResult,
} from "./labelService";

export type PhotoObjectRegistrationProps = {
  value: PhotoObjectMissionConfig;
  onChange: (next: PhotoObjectMissionConfig) => void;
};

function formatConfidence(c: number): string {
  return `${Math.round(c * 100)}%`;
}

function LabelList({ labels }: { labels: ObjectLabel[] }) {
  if (labels.length === 0) {
    return <Text style={styles.muted}>No labels yet.</Text>;
  }
  return (
    <View style={styles.labelList}>
      {labels.map((label) => (
        <View key={`${label.text}-${label.confidence}`} style={styles.labelRow}>
          <Text style={styles.labelText}>{label.text}</Text>
          <Text style={styles.labelConfidence}>{formatConfidence(label.confidence)}</Text>
        </View>
      ))}
    </View>
  );
}

export function PhotoObjectRegistration({
  value,
  onChange,
}: PhotoObjectRegistrationProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const registered = isPhotoObjectRegistered(value);
  const mlKit = isMlKitAvailable();

  const handleCapture = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const capture: LabelCaptureResult = await captureTargetObject();
      if (capture.labels.length === 0) {
        setError(
          "No object labels were detected. Try a clearer photo with better lighting."
        );
        // Still store the photo URI so the user can retry labeling later if needed.
        onChange({
          kind: "photo_object",
          labels: [],
          setupPhotoUri: capture.uri,
          registeredAt: Date.now(),
        });
        return;
      }
      onChange({
        kind: "photo_object",
        labels: capture.labels,
        setupPhotoUri: capture.uri,
        registeredAt: Date.now(),
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not capture or label the photo.";
      // User cancellation should not look like a hard failure.
      if (/cancel/i.test(message)) {
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange({
      kind: "photo_object",
      labels: [],
      setupPhotoUri: undefined,
      registeredAt: undefined,
    });
    setError(null);
  }, [onChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Target object</Text>
      <Text style={styles.help}>
        Photograph the object you will need at wake time (for example a toothbrush
        or coffee machine). The app labels it on-device and stores the label set
        locally as your object fingerprint.
      </Text>

      {!mlKit ? (
        <Text style={styles.devNote}>
          ML Kit native module not linked — using a development labeler. Build a
          custom dev client (expo run:android) for on-device ML Kit.
        </Text>
      ) : null}

      {value.setupPhotoUri && !value.setupPhotoUri.startsWith("mock://") ? (
        <Image
          source={{ uri: value.setupPhotoUri }}
          style={styles.preview}
          resizeMode="cover"
          accessibilityLabel="Registered target object photo"
        />
      ) : registered ? (
        <View style={styles.previewPlaceholder}>
          <Text style={styles.previewPlaceholderText}>Object registered</Text>
        </View>
      ) : null}

      {registered ? (
        <>
          <Text style={styles.subheading}>Stored labels</Text>
          <LabelList labels={value.labels} />
        </>
      ) : (
        <Text style={styles.muted}>
          No target object registered yet. Take a photo to continue.
        </Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryButton, busy && styles.buttonDisabled]}
          onPress={handleCapture}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={
            registered ? "Retake target object photo" : "Photograph target object"
          }
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {registered ? "Retake photo" : "Photograph object"}
            </Text>
          )}
        </Pressable>

        {registered ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={handleClear}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Clear registered object"
          >
            <Text style={styles.secondaryButtonText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f4f6f8",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d0d7de",
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 4,
  },
  help: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    marginBottom: 8,
  },
  devNote: {
    fontSize: 12,
    color: "#8a6d3b",
    backgroundColor: "#fcf8e3",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  muted: {
    fontSize: 13,
    color: "#888",
    marginVertical: 6,
  },
  error: {
    fontSize: 13,
    color: "#c00",
    marginTop: 8,
  },
  preview: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  previewPlaceholder: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e8eef5",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  previewPlaceholderText: {
    color: "#1a73e8",
    fontWeight: "600",
  },
  labelList: {
    marginTop: 4,
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  labelText: {
    fontSize: 14,
    color: "#222",
    flex: 1,
    marginRight: 8,
  },
  labelConfidence: {
    fontSize: 13,
    color: "#666",
    fontVariant: ["tabular-nums"],
  },
  actions: {
    marginTop: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#1a73e8",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#c00",
    fontWeight: "600",
    fontSize: 14,
  },
});
