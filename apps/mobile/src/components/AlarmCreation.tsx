import React, { useState } from "react";
import { View, Text, Button, TextInput, StyleSheet } from "react-native";
import type { Alarm } from "@dawnlock/shared";
import { scheduleAndroidAlarm } from "../alarms";

export type AlarmCreationProps = {
  onCreated?: (alarm: Alarm) => void;
};

/**
 * Minimal create form. On submit, schedules an Android exact alarm via
 * AlarmManager.setExactAndAllowWhileIdle (no-op on iOS).
 */
const AlarmCreation = ({ onCreated }: AlarmCreationProps) => {
  const [time, setTime] = useState("07:00");
  const [repeatDays, setRepeatDays] = useState("");
  const [label, setLabel] = useState("Wake up");
  const [sound, setSound] = useState("default");
  const [missionType, setMissionType] = useState("math");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    const id = `alarm_${Date.now()}`;
    const days = repeatDays
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    const alarm: Alarm = {
      id,
      time: time.trim(),
      repeatDays: days,
      label: label.trim(),
      sound: sound.trim() || "default",
      missionType: missionType.trim() || "math",
      enabled: true,
      missionId: null,
    };

    try {
      scheduleAndroidAlarm({
        id: alarm.id,
        time: alarm.time,
        repeatDays: alarm.repeatDays,
        label: alarm.label,
        enabled: true,
      });
      onCreated?.(alarm);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule alarm");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create Alarm</Text>
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
      <Button title="Create Alarm" onPress={handleCreate} />
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

export default AlarmCreation;
