import React from "react";
import { View, Text, FlatList, Pressable, Switch, StyleSheet } from "react-native";
import type { Alarm } from "@dawnlock/shared";
import { formatAlarmLabel } from "@dawnlock/shared";

type AlarmListProps = {
  alarms: Alarm[];
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
  onCreate: () => void;
};

function repeatLabel(days: string[]): string {
  if (!days || days.length === 0) return "Every day";
  if (days.length === 7) return "Every day";
  return days.join(", ");
}

export function AlarmList({ alarms, onToggle, onPress, onCreate }: AlarmListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Alarms</Text>
        <Pressable onPress={onCreate} style={styles.addButton}>
          <Text style={styles.addText}>+ New</Text>
        </Pressable>
      </View>
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No alarms yet. Tap + New to create one.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => onPress(item.id)}>
            <View style={styles.info}>
              <Text style={[styles.time, !item.enabled && styles.disabled]}>
                {item.time}
              </Text>
              <Text style={[styles.label, !item.enabled && styles.disabled]}>
                {item.label}
              </Text>
              <Text style={styles.repeat}>{repeatLabel(item.repeatDays)}</Text>
            </View>
            <Switch value={item.enabled} onValueChange={() => onToggle(item.id)} />
          </Pressable>
        )}
      />
    </View>
  );
}

export function formatNextAlarm(alarm: Alarm | null): string {
  if (!alarm) return "No upcoming alarm";
  return formatAlarmLabel(alarm);
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  heading: { fontSize: 24, fontWeight: "700" },
  addButton: {
    backgroundColor: "#1a73e8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addText: { color: "#fff", fontWeight: "600" },
  empty: { color: "#888", textAlign: "center", marginTop: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  info: { flex: 1 },
  time: { fontSize: 32, fontWeight: "700" },
  label: { fontSize: 16, color: "#333" },
  repeat: { fontSize: 13, color: "#888", marginTop: 2 },
  disabled: { color: "#bbb" },
});
