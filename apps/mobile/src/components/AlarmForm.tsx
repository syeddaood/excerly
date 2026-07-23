import React, { useMemo, useState } from "react";
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
import type {
  Alarm,
  MathDifficulty,
  MissionConfig,
  PhotoObjectMissionConfig,
  SoundId,
  Weekday,
} from "@dawnlock/shared";
import {
  createDefaultAlarm,
  createEmptyPhotoObjectMission,
  isPhotoObjectRegistered,
} from "@dawnlock/shared";
import { WeekdayPicker } from "./WeekdayPicker";
import { TimePicker } from "./TimePicker";
import { SoundPicker } from "./SoundPicker";
import { PhotoObjectRegistration } from "../missions/photoObject/PhotoObjectRegistration";
import { listMissionTypes } from "../missions/missionFramework";
// Ensure builtins are registered before listing types.
import "../missions/registerBuiltins";

export type AlarmFormValues = {
  label: string;
  time: string;
  repeatDays: Weekday[];
  soundId: SoundId;
  enabled: boolean;
  /** Full mission config (math or photo_object). */
  mission: MissionConfig;
  /** @deprecated Prefer mission — kept for callers that still read difficulty. */
  difficulty: MathDifficulty;
  /** @deprecated Prefer mission — kept for callers that still read problemCount. */
  problemCount: number;
};

type AlarmFormProps = {
  initial?: Partial<Alarm>;
  submitLabel: string;
  onSubmit: (values: AlarmFormValues) => void;
  onCancel?: () => void;
};

const DIFFICULTIES: MathDifficulty[] = ["easy", "medium", "hard"];

type MissionKind = MissionConfig["kind"];

function initialMath(defaults: Alarm): {
  difficulty: MathDifficulty;
  problemCount: number;
} {
  if (defaults.mission.kind === "math") {
    return {
      difficulty: defaults.mission.difficulty,
      problemCount: defaults.mission.count,
    };
  }
  return { difficulty: "easy", problemCount: 3 };
}

function initialPhoto(defaults: Alarm): PhotoObjectMissionConfig {
  if (defaults.mission.kind === "photo_object") {
    return defaults.mission;
  }
  return createEmptyPhotoObjectMission();
}

export function AlarmForm({ initial, submitLabel, onSubmit, onCancel }: AlarmFormProps) {
  const defaults = createDefaultAlarm(initial);
  const mathDefaults = initialMath(defaults);

  const [label, setLabel] = useState(defaults.label);
  const [time, setTime] = useState(defaults.time);
  const [repeatDays, setRepeatDays] = useState<Weekday[]>(defaults.repeatDays);
  const [soundId, setSoundId] = useState<SoundId>(defaults.soundId);
  const [enabled, setEnabled] = useState(defaults.enabled);
  const [missionKind, setMissionKind] = useState<MissionKind>(defaults.mission.kind);
  const [difficulty, setDifficulty] = useState<MathDifficulty>(mathDefaults.difficulty);
  const [problemCount, setProblemCount] = useState(mathDefaults.problemCount);
  const [photoMission, setPhotoMission] = useState<PhotoObjectMissionConfig>(() =>
    initialPhoto(defaults)
  );
  const [error, setError] = useState<string | null>(null);

  const missionTypes = useMemo(() => listMissionTypes(), []);

  const buildMission = (): MissionConfig => {
    if (missionKind === "photo_object") {
      return photoMission;
    }
    return {
      kind: "math",
      difficulty,
      count: Math.min(5, Math.max(1, problemCount)),
    };
  };

  const handleSubmit = () => {
    setError(null);
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    if (missionKind === "photo_object" && !isPhotoObjectRegistered(photoMission)) {
      setError("Photograph a target object to register this mission");
      return;
    }
    const mission = buildMission();
    onSubmit({
      label: label.trim(),
      time,
      repeatDays,
      soundId,
      enabled,
      mission,
      difficulty: mission.kind === "math" ? mission.difficulty : difficulty,
      problemCount: mission.kind === "math" ? mission.count : problemCount,
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

      <Text style={styles.label}>Mission</Text>
      <View style={styles.row}>
        {missionTypes.map((t) => (
          <Pressable
            key={t.kind}
            onPress={() => setMissionKind(t.kind as MissionKind)}
            style={[
              styles.chip,
              missionKind === t.kind && styles.chipSelected,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: missionKind === t.kind }}
          >
            <Text
              style={[
                styles.chipText,
                missionKind === t.kind && styles.chipTextSelected,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {missionKind === "math" ? (
        <>
          <Text style={styles.label}>Math difficulty</Text>
          <View style={styles.row}>
            {DIFFICULTIES.map((d) => (
              <Button
                key={d}
                title={d}
                onPress={() => setDifficulty(d)}
                color={difficulty === d ? "#1a73e8" : undefined}
              />
            ))}
          </View>

          <Text style={styles.label}>Problems to solve</Text>
          <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                title={String(n)}
                onPress={() => setProblemCount(n)}
                color={problemCount === n ? "#1a73e8" : undefined}
              />
            ))}
          </View>
        </>
      ) : (
        <PhotoObjectRegistration value={photoMission} onChange={setPhotoMission} />
      )}

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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chipSelected: {
    backgroundColor: "#1a73e8",
    borderColor: "#1a73e8",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  chipTextSelected: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  error: { color: "#c00", marginVertical: 8 },
});
