import React, { useState } from "react";
import { View, Text, Button, TextInput, StyleSheet } from "react-native";
import type { Alarm } from "@dawnlock/shared";
import { scheduleAndroidAlarm } from "../alarms";

export type AlarmEditProps = {
  alarm: Alarm;
  onSaved?: (alarm: Alarm) => void;
};

/**
 * Edit form. Saving re-schedules the Android exact alarm with the new time/label.
 */
const AlarmEdit = ({ alarm, onSaved }: AlarmEditProps) => {
  const [time, setTime] = useState(alarm.time);
  const [repeatDays, setRepeatDays] = useState((alarm.repeatDays ?? []).join(","));
  const [label, setLabel] = useState(alarm.label);
  const [sound, setSound] = useState(alarm.sound ?? "default");
  const [missionType, setMissionType] = useState(alarm.missionType ?? "math");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    const days = repeatDays
      .split(",")
      .map((d: string) => d.trim())
      .filter(Boolean);

    const next: Alarm = {
      ...alarm,
      time: time.trim(),
      repeatDays: days,
      label: label.trim(),
      sound: sound.trim() || "default",
      missionType: missionType.trim() || "math",
      enabled: true,
    };

    try {
      scheduleAndroidAlarm({
        id: next.id,
        time: next.time,
        repeatDays: next.repeatDays,
        label: next.label,
        enabled: true,
      });
      onSaved?.(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reschedule alarm");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Edit Alarm</Text>
      <TextInput
        style={styles.input}
        placeholder="Time (HH:mm)"
        value={time}
        onChangeText={setTime}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Repeat Days (e.g. Mon,Tue)"
        value={repeatDays}
        onChangeText={setRepeatDays}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Label"
        value={label}
        onChangeText={setLabel}
      />
      <TextInput
        style={styles.input}
        placeholder="Sound"
        value={sound}
        onChangeText={setSound}
      />
      <TextInput
        style={styles.input}
        placeholder="Mission Type"
        value={missionType}
        onChangeText={setMissionType}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Save Changes" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  error: { color: "#c00", marginBottom: 8 },
});

export default AlarmEdit;
