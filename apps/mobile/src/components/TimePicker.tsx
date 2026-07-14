import React, { useState } from "react";
import { View, Text, Pressable, Platform, StyleSheet } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { parseWallClockTime } from "@dawnlock/shared";

type TimePickerProps = {
  value: string;
  onChange: (time: string) => void;
};

function toDate(time: string): Date {
  const { hours, minutes } = parseWallClockTime(time);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [show, setShow] = useState(Platform.OS === "ios");
  const date = toDate(value);

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selected) {
      onChange(formatTime(selected));
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={() => setShow(true)}
        accessibilityRole="button"
      >
        <Text style={styles.timeText}>{value}</Text>
        <Text style={styles.hint}>Tap to change</Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  button: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
  },
  timeText: { fontSize: 48, fontWeight: "700", color: "#1a1a1a" },
  hint: { fontSize: 14, color: "#666", marginTop: 4 },
});
