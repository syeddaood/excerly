import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, Button, StyleSheet } from "react-native";
import { useAlarmStore } from "../../../src/store/alarmStore";
import { AlarmForm } from "../../../src/components/AlarmForm";

export default function EditAlarmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const alarm = useAlarmStore((s) => s.alarms.find((a) => a.id === id));
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);

  if (!alarm) {
    return (
      <View style={styles.center}>
        <Text>Alarm not found</Text>
        <Button title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <AlarmForm
        initial={alarm}
        submitLabel="Save changes"
        onSubmit={(values) => {
          updateAlarm(alarm.id, {
            label: values.label,
            time: values.time,
            repeatDays: values.repeatDays,
            soundId: values.soundId,
            enabled: values.enabled,
            mission: {
              kind: "math",
              difficulty: values.missionDifficulty,
              count: values.missionCount,
            },
          });
          router.back();
        }}
        onCancel={() => router.back()}
      />
      <View style={styles.deleteRow}>
        <Button
          title="Delete alarm"
          color="#c00"
          onPress={() => {
            deleteAlarm(alarm.id);
            router.replace("/alarms");
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  deleteRow: { padding: 16, paddingBottom: 32 },
});
