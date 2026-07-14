import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Button, FlatList, StyleSheet, Platform } from "react-native";
import type { Alarm } from "@dawnlock/shared";
import {
  cancelAndroidAlarm,
  scheduleAndroidAlarm,
  type SchedulableAlarm,
} from "../alarms";

export type AlarmListProps = {
  /** Alarms (e.g. loaded from API / local store). Kept in sync via props. */
  initialAlarms?: Alarm[];
  onEdit?: (alarm: Alarm) => void;
  onCreate?: () => void;
  onDeleted?: (alarmId: string) => void;
};

/**
 * Lists alarms and wires enable/delete to the Android exact-alarm scheduler.
 * On non-Android platforms the native calls no-op.
 */
const AlarmList = ({
  initialAlarms = [],
  onEdit,
  onCreate,
  onDeleted,
}: AlarmListProps) => {
  const [alarms, setAlarms] = useState<Alarm[]>(initialAlarms);

  useEffect(() => {
    setAlarms(initialAlarms);
  }, [initialAlarms]);

  const toSchedulable = useCallback((alarm: Alarm, enabled = true): SchedulableAlarm => {
    return {
      id: alarm.id,
      time: alarm.time,
      repeatDays: alarm.repeatDays,
      label: alarm.label,
      enabled,
    };
  }, []);

  const handleDelete = useCallback(
    (alarm: Alarm) => {
      cancelAndroidAlarm(alarm.id);
      setAlarms((prev) => prev.filter((a) => a.id !== alarm.id));
      onDeleted?.(alarm.id);
    },
    [onDeleted]
  );

  const handleEnable = useCallback(
    (alarm: Alarm) => {
      scheduleAndroidAlarm(toSchedulable(alarm, true));
    },
    [toSchedulable]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Alarm List</Text>
      {Platform.OS === "android" ? (
        <Text style={styles.hint}>Android exact alarms via AlarmManager</Text>
      ) : null}
      <FlatList
        data={alarms}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.label}>
              {item.label || "Alarm"} — {item.time}
            </Text>
            <View style={styles.actions}>
              <Button title="Enable" onPress={() => handleEnable(item)} />
              <Button title="Edit" onPress={() => onEdit?.(item)} />
              <Button title="Delete" onPress={() => handleDelete(item)} />
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No alarms yet</Text>}
      />
      {onCreate ? <Button title="Create Alarm" onPress={onCreate} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  hint: { fontSize: 12, color: "#666", marginBottom: 8 },
  row: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 16, marginBottom: 4 },
  actions: { flexDirection: "row", gap: 8 },
  empty: { color: "#888", marginVertical: 16 },
});

export default AlarmList;
