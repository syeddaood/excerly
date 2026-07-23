import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAlarmStore } from "../src/store/alarmStore";
import { useRingStore } from "../src/store/ringStore";
import { stopAndroidRinging } from "../src/alarms";
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
export default function RingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alarmId?: string }>();
  const alarms = useAlarmStore((s) => s.alarms);
  const recordWakeEvent = useAlarmStore((s) => s.recordWakeEvent);
  const wakeEvents = useAlarmStore((s) => s.wakeEvents);
  const session = useRingStore((s) => s.session);
  const clearSession = useRingStore((s) => s.clearSession);

  const [now, setNow] = useState(() => new Date());
  const [missionStarted, setMissionStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const missionRef = useRef<Mission | null>(null);
  const completingRef = useRef(false);

  const resolvedId = useMemo(() => {
    if (typeof params.alarmId === "string" && params.alarmId.length > 0) {
      return params.alarmId;
    }
    return session?.alarmId ?? null;
  }, [params.alarmId, session?.alarmId]);

  const alarm = useMemo(
    () => (resolvedId ? alarms.find((a) => a.id === resolvedId) ?? null : null),
    [alarms, resolvedId]
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // If we landed here without a live session (e.g. cold start from notification),
  // seed a minimal session so stop/clear still works.
  useEffect(() => {
    if (!session && resolvedId && alarm) {
      useRingStore.getState().startSession(alarm);
    }
  }, [session, resolvedId, alarm]);

  const timeLabel = useMemo(() => {
    const h = now.getHours();
    const m = now.getMinutes();
    const hh = ((h + 11) % 12) + 1;
    const mm = String(m).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    return `${hh}:${mm} ${ampm}`;
  }, [now]);

  const missionConfig = alarm?.mission ?? { kind: "math" as const, difficulty: "easy" as const, count: 1 };

  const MissionView = useMemo(
    () => resolveMissionComponent(missionConfig.kind),
    [missionConfig.kind]
  );

  const handleMissionComplete = useCallback(() => {
    if (!resolvedId) return;
    // Guard against double completion (UI onComplete + session onResult).
    if (completingRef.current) return;
    completingRef.current = true;

    const ts = Date.now();
    const firedAt = session?.firedAt ?? ts;
    recordWakeEvent({
      id: `wake_${ts}_${Math.random().toString(36).slice(2, 8)}`,
      alarmId: resolvedId,
      firedAt,
      completedAt: ts,
      assisted: false,
    });
    // Stop alarm audio / notification chain (R15).
    stopAndroidRinging();
    clearSession();
    setCompletedAt(ts);
    setCompleted(true);
  }, [resolvedId, session?.firedAt, recordWakeEvent, clearSession]);

  const handleResult = useCallback((success: boolean) => {
    missionRef.current?.onResult(success);
  }, []);

  const handleStartMission = useCallback(() => {
    if (!alarm) return;
    const mission = createMission(missionConfig, {
      onComplete: handleMissionComplete,
    });
    missionRef.current = mission;
    mission?.start();
    setMissionStarted(true);
  }, [alarm, missionConfig, handleMissionComplete]);

  const handleDone = useCallback(() => {
    router.replace("/");
  }, [router]);

  // Streak status after this wake (includes the event we just recorded).
  const streak = useMemo(() => {
    if (!completed) return null;
    return computeLocalStreak(wakeEvents, completedAt ?? Date.now());
  }, [completed, wakeEvents, completedAt]);

  if (!resolvedId || !alarm) {
    return (
      <View style={styles.root}>
        <Text style={styles.time}>{timeLabel}</Text>
        <Text style={styles.label}>No active alarm</Text>
        <Pressable style={styles.primaryBtn} onPress={handleDone}>
          <Text style={styles.primaryBtnText}>Back home</Text>
        </Pressable>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={styles.root}>
        <Text style={styles.successEmoji}>✓</Text>
        <Text style={styles.successTitle}>You&apos;re up</Text>
        <Text style={styles.label}>{alarm.label}</Text>
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
        <Pressable style={styles.primaryBtn} onPress={handleDone}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  if (missionStarted && MissionView) {
    return (
      <View style={styles.root}>
        <Text style={styles.missionHeader}>Mission</Text>
        <Text style={styles.label}>{alarm.label}</Text>
        <MissionView
          config={missionConfig}
          onComplete={handleMissionComplete}
          onResult={handleResult}
        />
      </View>
    );
  }

  // Default: ringing UI — NO dismiss, NO snooze (R5).
  return (
    <View style={styles.root}>
      <Text style={styles.ringingBadge}>ALARM</Text>
      <Text style={styles.time}>{timeLabel}</Text>
      <Text style={styles.label}>{alarm.label}</Text>
      <Pressable
        style={styles.primaryBtn}
        onPress={handleStartMission}
        accessibilityRole="button"
        accessibilityLabel="Start mission"
      >
        <Text style={styles.primaryBtnText}>Start mission</Text>
      </Pressable>
      <Text style={styles.hint}>Complete the mission to stop the alarm</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  ringingBadge: {
    color: "#ff4444",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 4,
    marginBottom: 12,
  },
  time: {
    fontSize: 72,
    fontWeight: "200",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: 22,
    color: "#ccc",
    marginTop: 8,
    marginBottom: 40,
    textAlign: "center",
  },
  missionHeader: {
    fontSize: 16,
    color: "#888",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  primaryBtn: {
    backgroundColor: "#ffcc00",
    paddingVertical: 22,
    paddingHorizontal: 48,
    borderRadius: 16,
    minWidth: 260,
    alignItems: "center",
    minHeight: 68,
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },
  hint: {
    marginTop: 24,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  successEmoji: {
    fontSize: 64,
    color: "#4caf50",
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 40,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  streakCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 28,
    marginBottom: 36,
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
