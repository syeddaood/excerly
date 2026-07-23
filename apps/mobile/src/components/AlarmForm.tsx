import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
} from "react-native";
import type { Alarm, MathDifficulty, SoundId, Weekday } from "@dawnlock/shared";
import { TimePicker } from "./TimePicker";
import { WeekdayPicker } from "./WeekdayPicker";
import { SoundPicker } from "./SoundPicker";

export type AlarmFormValues = {
  time: string;
  label: string;
  enabled: boolean;
  repeatDays: Weekday[];
  soundId: SoundId;
  missionDifficulty: MathDifficulty;
  missionCount: number;
};

export type AlarmFormProps = {
  initial?: Partial<Alarm>;
  submitLabel?: string;
  onSubmit: (values: AlarmFormValues) => void;
  onCancel?: () => void;
};

const DIFFICULTIES: MathDifficulty[] = ["easy", "medium", "hard"];
const COUNTS = [1, 2, 3, 4, 5] as const;

function defaults(initial?: Partial<Alarm>): AlarmFormValues {
  const mission = initial?.mission;
  return {
    time: initial?.time ?? "07:00",
    label: initial?.label ?? "",
    enabled: initial?.enabled ?? true,
    repeatDays: initial?.repeatDays ?? [],
    soundId: initial?.soundId ?? "default",
    missionDifficulty:
      mission && mission.kind === "math" ? mission.difficulty : "easy",
    missionCount: mission && mission.kind === "math" ? mission.count : 3,
  };
}

export function AlarmForm({
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: AlarmFormProps) {
  const [values, setValues] = useState<AlarmFormValues>(() => defaults(initial));

  const set = <K extends keyof AlarmFormValues>(key: K, v: AlarmFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = () => {
    onSubmit({
      ...values,
      time: values.time.trim(),
      label: values.label.trim() || "Alarm",
      missionCount: Math.min(5, Math.max(1, Math.round(values.missionCount) || 1)),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.section}>Time</Text>
      <TimePicker value={values.time} onChange={(t) => set("time", t)} />

      <Text style={styles.section}>Label</Text>
      <TextInput
        style={styles.input}
        value={values.label}
        onChangeText={(t) => set("label", t)}
        placeholder="Alarm"
        placeholderTextColor="#666"
      />

      <View style={styles.row}>
        <Text style={styles.sectionInline}>Enabled</Text>
        <Switch value={values.enabled} onValueChange={(v) => set("enabled", v)} />
      </View>

      <Text style={styles.section}>Repeat</Text>
      <WeekdayPicker
        value={values.repeatDays}
        onChange={(days) => set("repeatDays", days)}
      />

      <Text style={styles.section}>Sound</Text>
      <SoundPicker value={values.soundId} onChange={(id) => set("soundId", id)} />

      <Text style={styles.section}>Mission — Math</Text>
      <Text style={styles.hint}>
        Solve problems to dismiss. Wrong answers give a new problem; no skip.
      </Text>

      <Text style={styles.subSection}>Difficulty</Text>
      <View style={styles.chipRow}>
        {DIFFICULTIES.map((d) => {
          const active = values.missionDifficulty === d;
          return (
            <Pressable
              key={d}
              onPress={() => set("missionDifficulty", d)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.subSection}>Problems (1–5)</Text>
      <View style={styles.chipRow}>
        {COUNTS.map((n) => {
          const active = values.missionCount === n;
          return (
            <Pressable
              key={n}
              onPress={() => set("missionCount", n)}
              style={[styles.chip, styles.countChip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button title={submitLabel} onPress={handleSubmit} />
        {onCancel ? <Button title="Cancel" onPress={onCancel} color="#888" /> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, paddingBottom: 40 },
  section: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 16,
    color: "#ccc",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionInline: { fontSize: 16, fontWeight: "600", color: "#eee" },
  subSection: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
    color: "#999",
  },
  hint: { fontSize: 13, color: "#888", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#1a1a1a",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#1a1a1a",
  },
  countChip: { minWidth: 44, alignItems: "center" },
  chipActive: {
    backgroundColor: "#ffcc00",
    borderColor: "#ffcc00",
  },
  chipText: { color: "#ccc", fontWeight: "600", fontSize: 14 },
  chipTextActive: { color: "#111" },
  actions: { marginTop: 28, gap: 12 },
});
