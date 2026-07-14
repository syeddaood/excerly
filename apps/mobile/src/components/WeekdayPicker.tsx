import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { Weekday } from "@dawnlock/shared";
import { WEEKDAYS } from "@dawnlock/shared";

type WeekdayPickerProps = {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
};

const SHORT: Record<Weekday, string> = {
  Sun: "S",
  Mon: "M",
  Tue: "T",
  Wed: "W",
  Thu: "T",
  Fri: "F",
  Sat: "S",
};

export function WeekdayPicker({ value, onChange }: WeekdayPickerProps) {
  const toggle = (day: Weekday) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <View style={styles.row}>
      {WEEKDAYS.map((day) => {
        const selected = value.includes(day);
        return (
          <Pressable
            key={day}
            onPress={() => toggle(day)}
            style={[styles.chip, selected && styles.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {SHORT[day]}
            </Text>
            <Text style={styles.chipLabel}>{day}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  chip: {
    width: 44,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
  },
  chipSelected: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  chipText: { fontSize: 16, fontWeight: "700", color: "#333" },
  chipTextSelected: { color: "#fff" },
  chipLabel: { fontSize: 9, color: "#888", marginTop: 2 },
});
