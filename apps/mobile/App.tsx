import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, Text, View } from "react-native";
import { PACKAGE_NAME, formatAlarmLabel, type Alarm } from "@dawnlock/shared";
import AlarmList from "./src/components/AlarmList";
import AlarmCreation from "./src/components/AlarmCreation";
import AlarmEdit from "./src/components/AlarmEdit";
import { canScheduleExactAlarms } from "./src/alarms";

type Screen = "list" | "create" | "edit";

/**
 * Root screen. Issue #10 wires Android exact-alarm scheduling into create/edit/list.
 * Native AlarmManager path is a no-op on iOS (separate issue).
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>("list");
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [editing, setEditing] = useState<Alarm | null>(null);

  const sample = formatAlarmLabel({ label: "Wake up", time: "06:30" });
  const exactOk = Platform.OS === "android" ? canScheduleExactAlarms() : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DawnLock</Text>
      <Text style={styles.meta}>Shared: {PACKAGE_NAME}</Text>
      <Text style={styles.meta}>{sample}</Text>
      {Platform.OS === "android" ? (
        <Text style={styles.meta}>
          Exact alarms: {exactOk ? "available" : "unavailable / unlinked"}
        </Text>
      ) : (
        <Text style={styles.meta}>Platform: {Platform.OS} (Android exact path idle)</Text>
      )}

      {screen === "list" ? (
        <AlarmList
          initialAlarms={alarms}
          onCreate={() => setScreen("create")}
          onEdit={(alarm) => {
            setEditing(alarm);
            setScreen("edit");
          }}
          onDeleted={(id) => setAlarms((prev) => prev.filter((a) => a.id !== id))}
        />
      ) : null}

      {screen === "create" ? (
        <AlarmCreation
          onCreated={(alarm) => {
            setAlarms((prev) => [...prev, alarm]);
            setScreen("list");
          }}
        />
      ) : null}

      {screen === "edit" && editing ? (
        <AlarmEdit
          alarm={editing}
          onSaved={(alarm) => {
            setAlarms((prev) => prev.map((a) => (a.id === alarm.id ? alarm : a)));
            setEditing(null);
            setScreen("list");
          }}
        />
      ) : null}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1020",
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  title: {
    color: "#f5f7ff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  meta: {
    color: "#a8b0c8",
    fontSize: 13,
    marginTop: 2,
    textAlign: "center",
  },
});
