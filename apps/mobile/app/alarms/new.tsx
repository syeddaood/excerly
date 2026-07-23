import { useRouter } from "expo-router";
import { useAlarmStore } from "../../src/store/alarmStore";
import { AlarmForm } from "../../src/components/AlarmForm";

export default function NewAlarmScreen() {
  const router = useRouter();
  const addAlarm = useAlarmStore((s) => s.addAlarm);

  return (
    <AlarmForm
      submitLabel="Create alarm"
      onSubmit={(values) => {
        addAlarm({
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
  );
}
