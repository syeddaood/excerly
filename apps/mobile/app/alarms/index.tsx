import { useRouter } from "expo-router";
import { useAlarmStore } from "../../src/store/alarmStore";
import { AlarmList } from "../../src/components/AlarmList";

export default function AlarmsScreen() {
  const router = useRouter();
  const alarms = useAlarmStore((s) => s.alarms);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);

  return (
    <AlarmList
      alarms={alarms}
      onToggle={toggleAlarm}
      onPress={(id) => router.push(`/alarms/${id}/edit`)}
      onCreate={() => router.push("/alarms/new")}
    />
  );
}
