import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useAlarmStore } from "../src/store/alarmStore";
import { useRingStore } from "../src/store/ringStore";
import { syncNativeAlarms } from "../src/alarms/engine";

export default function RootLayout() {
  useEffect(() => {
    void useRingStore.getState().loadSession();
    const unsub = useAlarmStore.persist.onFinishHydration(() => {
      syncNativeAlarms(useAlarmStore.getState().alarms);
    });
    if (useAlarmStore.persist.hasHydrated()) {
      syncNativeAlarms(useAlarmStore.getState().alarms);
    }
    return unsub;
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: "DawnLock" }} />
        <Stack.Screen name="alarms/index" options={{ title: "Alarms" }} />
        <Stack.Screen name="alarms/new" options={{ title: "New Alarm" }} />
        <Stack.Screen name="alarms/[id]/edit" options={{ title: "Edit Alarm" }} />
        <Stack.Screen
          name="ring"
          options={{ title: "Alarm", headerShown: false, presentation: "fullScreenModal" }}
        />
      </Stack>
    </>
  );
}
