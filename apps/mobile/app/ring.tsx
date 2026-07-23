import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { MissionConfig } from "@dawnlock/shared";
import { useAlarmStore } from "../src/store/alarmStore";
import { useRingStore } from "../src/store/ringStore";
import { onAlarmFired, stopAndroidRinging } from "../src/alarms";
import {
  createMission,
  resolveMissionComponent,
  type Mission,
} from "../src/missions";

const FALLBACK_MISSION: MissionConfig = {
  kind: "math",
  difficulty: "easy",
  count: 3,
};

function formatClock(now: Date): string {
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function RingScreen() {
  const router = useRouter();
  const { alarmId } = useLocalSearchParams<{ alarmId?: string }>();
  const alarms = useAlarmStore((s) => s.alarms);
  const recordWakeEvent = useAlarmStore((s) => s.recordWakeEvent);
  const session = useRingStore((s) => s.session);
  const startSession = useRingStore((s) => s.startSession);
  const clearSession = useRingStore((s) => s.clearSession);
  const missionStarted = useRingStore((s) => s.missionStarted);
  const setMissionStarted = useRingStore((s) => s.setMissionStarted);
  const [clock, setClock] = useState(formatClock(new Date()));
  const [completed, setCompleted] = useState(false);
  const missionRef = useRef<Mission | null>(null);
  /** Guards against double-complete from mission session + UI both firing. */
  const completedRef = useRef(false);

  const resolvedId = alarmId ?? session?.alarmId;
  const alarm = alarms.find((a) => a.id === resolvedId);
  const missionConfig: MissionConfig = alarm?.mission ?? FALLBACK_MISSION;

  // Resolve UI via the framework registry — no hard-coded mission kinds here.
  const MissionView = useMemo(
    () => resolveMissionComponent(missionConfig.kind),
    [missionConfig.kind]
  );

  useEffect(() => {
    if (!resolvedId) return;
    onAlarmFired(resolvedId, useAlarmStore.getState().alarms);
    const found = useAlarmStore.getState().alarms.find((a) => a.id === resolvedId);
    if (found) {
      startSession(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per ring session
  }, [resolvedId]);

  useEffect(() => {
    const t = setInterval(() => setClock(formatClock(new Date())), 1000);
    return () => clearInterval(t);
  }, []);

  const handleMissionComplete = useCallback(() => {
    // Alarm stays ringing until this runs — and only once all N problems are solved.
    if (completedRef.current) return;
    if (!resolvedId) return;
    completedRef.current = true;
    stopAndroidRinging();
    recordWakeEvent({
      id: `wake_${Date.now()}`,
      alarmId: resolvedId,
      firedAt: session?.firedAt ?? Date.now(),
      completedAt: Date.now(),
      assisted: false,
    });
    clearSession();
    setCompleted(true);
  }, [resolvedId, session, recordWakeEvent, clearSession]);

  const handleStartMission = useCallback(() => {
    const mission = createMission(missionConfig, {
      onComplete: handleMissionComplete,
    });
    missionRef.current = mission;
    mission?.start();
    setMissionStarted(true);
  }, [missionConfig, handleMissionComplete, setMissionStarted]);

  const handleResult = useCallback((success: boolean) => {
    missionRef.current?.onResult(success);
  }, []);

  if (completed) {
    return (
      <View style={styles.container}>
        <Text style={styles.successTitle}>You're awake!</Text>
        <Text style={styles.successBody}>Mission complete. Have a great day.</Text>
        <Pressable style={styles.button} onPress={() => router.replace("/")}>
          <Text style={styles.buttonText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  if (missionStarted && MissionView) {
    return (
      <View style={styles.container}>
        {alarm ? (
          <Text style={styles.missionHeader}>{alarm.label}</Text>
        ) : (
          <>
            <Text style={styles.time}>{clock}</Text>
            <Text style={styles.label}>Alarm ringing</Text>
            <Text style={styles.hint}>
              Alarm data not found — complete mission anyway.
            </Text>
          </>
        )}
        <MissionView
          config={missionConfig}
          onComplete={handleMissionComplete}
          onResult={handleResult}
        />
      </View>
    );
  }

  if (missionStarted && !MissionView) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Unknown mission type</Text>
        <Text style={styles.hint}>
          No mission registered for kind &quot;{missionConfig.kind}&quot;.
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace("/")}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>DawnLock</Text>
      <Text style={styles.time}>{clock}</Text>
      <Text style={styles.label}>{alarm?.label ?? "Alarm ringing"}</Text>
      <Text style={styles.hint}>Complete your mission to dismiss</Text>
      <Pressable style={styles.button} onPress={handleStartMission}>
        <Text style={styles.buttonText}>Start mission</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  brand: { fontSize: 18, color: "#888", marginBottom: 8 },
  time: { fontSize: 72, fontWeight: "800", color: "#fff" },
  label: { fontSize: 24, color: "#ffcc00", marginTop: 8, textAlign: "center" },
  hint: { fontSize: 14, color: "#aaa", marginTop: 16, marginBottom: 32, textAlign: "center" },
  missionHeader: { fontSize: 20, color: "#ffcc00", marginBottom: 16 },
  button: {
    backgroundColor: "#ffcc00",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: { fontSize: 18, fontWeight: "700", color: "#111" },
  successTitle: { fontSize: 36, fontWeight: "800", color: "#4caf50" },
  successBody: { fontSize: 18, color: "#ccc", marginVertical: 24, textAlign: "center" },
});
