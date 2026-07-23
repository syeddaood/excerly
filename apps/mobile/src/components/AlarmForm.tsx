import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import type { Alarm, MathDifficulty, SoundId, Weekday } from "@dawnlock/shared";
import { createDefaultAlarm } from "@dawnlock/shared";
import { WeekdayPicker } from "./WeekdayPicker";
import { TimePicker } from "./TimePicker";
import { SoundPicker } from "./SoundPicker";

export type AlarmFormValues = {
  label: string;
  time: string;
  repeatDays: Weekday[];
  soundId: SoundId;
  enabled: boolean;
  difficulty: MathDifficulty;
  problemCount: number;
};

type AlarmFormProps = {
  initial?: Partial<Alarm>;
  submitLabel: string;
  onSubmit: (values: AlarmFormValues) => void;
  onCancel?: () => void;
};

const DIFFICULTIES: MathDifficulty[] = ["easy", "medium", "hard"];

export function AlarmForm({ initial, submitLabel, onSubmit, onCancel }: AlarmFormProps) {
  const defaults = createDefaultAlarm(initial);
  const [label, setLabel] = useState(defaults.label);
  const [time, setTime] = useState(defaults.time);
  const [repeatDays, setRepeatDays] = useState<Weekday[]>(defaults.repeatDays);
  const [soundId, setSoundId] = useState<SoundId>(defaults.soundId);
  const [enabled, setEnabled] = useState(defaults.enabled);
  const [difficulty, setDifficulty] = useState<MathDifficulty>(defaults.mission.difficulty);
  const [problemCount, setProblemCount] = useState(defaults.mission.count);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    onSubmit({
      label: label.trim(),
      time,
      repeatDays,
      soundId,
      enabled,
      difficulty,
      problemCount: Math.min(5, Math.max(1, problemCount)),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{submitLabel}</Text>

      <Text style={styles.label}>Label</Text>
      <TextInput style={styles.input} value={label} onChangeText={setLabel} />

      <Text style={styles.label}>Time</Text>
      <TimePicker value={time} onChange={setTime} />

      <Text style={styles.label}>Repeat</Text>
      <Text style={styles.hint}>Leave all off for every day</Text>
      <WeekdayPicker value={repeatDays} onChange={setRepeatDays} />

      <Text style={styles.label}>Sound</Text>
      <SoundPicker value={soundId} onChange={setSoundId} />

      <Text style={styles.sectionTitle}>Math mission</Text>
      <Text style={styles.hint}>
        Alarm keeps ringing until every problem is solved
      </Text>

      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.row}>
        {DIFFICULTIES.map((d) => {
          const selected = difficulty === d;
          return (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {d}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Problems to solve (1–5)</Text>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = problemCount === n;
          return (
            <Pressable
              key={n}
              onPress={() => setProblemCount(n)}
              style={[styles.chip, styles.countChip, selected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Enabled</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={submitLabel} onPress={handleSubmit} />
      {onCancel ? <Button title="Cancel" onPress={onCancel} color="#888" /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 4,
  },
  label: { fontSize: 14, fontWeight: "600", marginTop: 12, marginBottom: 4 },
  hint: { fontSize: 12, color: "#888" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f5f5f5",
  },
  countChip: {
    minWidth: 48,
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },
  chipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    textTransform: "capitalize",
  },
  chipTextSelected: {
    color: "#ffcc00",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  error: { color: "#c00", marginVertical: 8 },
});
