import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { SoundId } from "@dawnlock/shared";

export const BUNDLED_SOUNDS: { id: SoundId; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "classic", label: "Classic Bell" },
  { id: "digital", label: "Digital Beep" },
  { id: "gentle", label: "Gentle Rise" },
];

type SoundPickerProps = {
  value: SoundId;
  onChange: (id: SoundId) => void;
};

/**
 * Bundled sound picker with tap-to-preview stub.
 * Phase 1 uses native default alarm audio at fire time; preview is a no-op placeholder.
 */
export function SoundPicker({ value, onChange }: SoundPickerProps) {
  const preview = useCallback((_id: SoundId) => {
    // expo-av preview can be wired when sound assets are bundled.
  }, []);

  return (
    <View style={styles.container}>
      {BUNDLED_SOUNDS.map((sound) => {
        const selected = value === sound.id;
        return (
          <Pressable
            key={sound.id}
            style={[styles.row, selected && styles.rowSelected]}
            onPress={() => onChange(sound.id)}
            onLongPress={() => preview(sound.id)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {sound.label}
            </Text>
            {selected ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        );
      })}
      <Text style={styles.note}>Long-press to preview (assets in a later build)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  rowSelected: { borderColor: "#1a73e8", backgroundColor: "#e8f0fe" },
  label: { fontSize: 16, color: "#333" },
  labelSelected: { fontWeight: "600", color: "#1a73e8" },
  check: { fontSize: 18, color: "#1a73e8" },
  note: { fontSize: 12, color: "#888", marginTop: 4 },
});
