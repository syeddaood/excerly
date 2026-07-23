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
import { computeLocalStreak } from "../src/streaks/localStreak";

/**
 * Ringing / mission screen (R5, R7, R10, R15).
 *
 * States:
 *  1. Ringing — huge time, label, single "Start mission" CTA (no dismiss/snooze)
 *  2. Mission — math (or other registered) mission UI; alarm keeps ringing
 *  3. Success — wake recorded, streak status, stop alarm / notification chain
 */

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
  const wakeEvents = useAlarmStore((s) => s.wakeEvents);
  const session = useRingStore((s) => s.session);
  const startSession = useRingStore((s) => s.startSession);
  const clearSession = useRingStore((s) => s.clearSession);
  const missionStartedStore = useRingStore((s) => s.missionStarted);
  const setMissionStartedStore = useRingStore((s) => s.setMissionStarted);

  const [clock, setClock] = useState(formatClock(new Date()));
  const [missionStarted, setMissionStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const missionRef = useRef<Mission | null>(null);
  const completingRef = useRef(false);

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

  // Resume mission UI if store says mission already started (process death).
  useEffect(() => {
    if (missionStartedStore && !missionStarted && !completed && alarm) {
      setMissionStarted(true);
    }
  }, [missionStartedStore, missionStarted, completed, alarm]);

  const handleMissionComplete = useCallback(() => {
    // Guard against double completion (UI onComplete + session onComplete).
    if (completingRef.current || completed) return;
    completingRef.current = true;

    if (!resolvedId) return;

    // Stop alarm / notification chain (R15).
    stopAndroidRinging();

    const doneAt = Date.now();
    recordWakeEvent({
      id: `wake_${doneAt}`,
      alarmId: resolvedId,
      firedAt: session?.firedAt ?? doneAt,
      completedAt: doneAt,
      assisted: false,
    });
    setCompletedAt(doneAt);
    clearSession();
    setMissionStartedStore(false);
    setCompleted(true);
  }, [
    completed,
    resolvedId,
    session,
    recordWakeEvent,
    clearSession,
    setMissionStartedStore,
  ]);

  const handleResult = useCallback(
    (success: boolean) => {
      missionRef.current?.onResult(success);
    },
    []
  );

  const handleStartMission = useCallback(() => {
    const mission = createMission(missionConfig, {
      onComplete: handleMissionComplete,
    });
    missionRef.current = mission;
    mission?.start();
    setMissionStarted(true);
    setMissionStartedStore(true);
  }, [missionConfig, handleMissionComplete, setMissionStartedStore]);

  const handleDone = useCallback(() => {
    router.replace("/");
  }, [router]);

  // Streak status after this wake (includes the event we just recorded).
  const streak = useMemo(() => {
    if (!completed) return null;
    return computeLocalStreak(wakeEvents, completedAt ?? Date.now());
  }, [completed, wakeEvents, completedAt]);

  if (completed) {
    return (
      <View style={styles.root} testID="ring-success">
        <Text style={styles.successEmoji}>✓</Text>
        <Text style={styles.successTitle}>You&apos;re up</Text>
        <Text style={styles.label}>{alarm?.label ?? "Alarm"}</Text>
        {streak ? (
          <View style={styles.streakCard}>
            <Text style={styles.streakHeadline}>
              {streak.current > 0
                ? `${streak.current}-day streak`
                : "Streak started"}
            </Text>
            <Text style={styles.streakMeta}>
              Best {streak.longest} · {streak.totalWins} win
              {streak.totalWins === 1 ? "" : "s"} total
            </Text>
          </View>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={handleDone}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  if (missionStarted && MissionView) {
    return (
      <View style={styles.root} testID="ring-mission">
        <Text style={styles.missionHeader}>Complete your mission</Text>
        <Text style={styles.missionSub}>{alarm?.label ?? "Alarm"}</Text>
        <MissionView
          config={missionConfig}
          onComplete={handleMissionComplete}
          onResult={handleResult}
        />
      </View>
    );
  }

  // Default: ringing — no dismiss / snooze (R7).
  return (
    <View style={styles.root} testID="ring-active">
      <Text style={styles.brand}>ALARM</Text>
      <Text style={styles.time}>{clock}</Text>
      <Text style={styles.label}>{alarm?.label ?? session?.label ?? "Alarm ringing"}</Text>
      <Text style={styles.hint}>Complete your mission to stop the alarm</Text>
      <Pressable
        style={({ pressed }) => [
          styles.primaryBtn,
          styles.startBtn,
          pressed && styles.pressed,
        ]}
        onPress={handleStartMission}
        accessibilityRole="button"
        accessibilityLabel="Start mission"
      >
        <Text style={styles.primaryBtnText}>Start mission</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  brand: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f44336",
    letterSpacing: 4,
    marginBottom: 8,
  },
  time: {
    fontSize: 80,
    fontWeight: "200",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: 22,
    color: "#ffcc00",
    marginTop: 8,
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 16,
    marginBottom: 32,
    textAlign: "center",
  },
  missionHeader: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  missionSub: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: "#ffcc00",
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 14,
    minWidth: "80%",
    alignItems: "center",
    marginTop: 16,
  },
  startBtn: {
    paddingVertical: 24,
  },
  pressed: { opacity: 0.85 },
  primaryBtnText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  successEmoji: {
    fontSize: 64,
    color: "#4caf50",
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  streakCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 28,
    marginVertical: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    minWidth: 240,
  },
  streakHeadline: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffcc00",
    marginBottom: 6,
  },
  streakMeta: {
    fontSize: 15,
    color: "#aaa",
  },
});
