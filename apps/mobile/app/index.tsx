import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAlarmStore, selectNextEnabledAlarm } from "../src/store/alarmStore";
import { formatNextAlarm } from "../src/components/AlarmList";
import { isNativeAlarmLinked } from "../modules/android-alarm/src";

export default function HomeScreen() {
  const router = useRouter();
  const next = useAlarmStore(selectNextEnabledAlarm);
  const alarmCount = useAlarmStore((s) => s.alarms.length);
  const nativeAlarms = Platform.OS === "android" && isNativeAlarmLinked();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DawnLock</Text>
      <Text style={styles.subtitle}>Wake up with accountability</Text>

      {!nativeAlarms ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Expo Go preview — alarms won't fire natively. Run{" "}
            <Text style={styles.bannerCode}>npx expo run:android</Text> for real alarms.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Next alarm</Text>
        <Text style={styles.cardValue}>{formatNextAlarm(next)}</Text>
        <Text style={styles.cardMeta}>{alarmCount} alarm{alarmCount === 1 ? "" : "s"} saved</Text>
      </View>

      <Pressable style={styles.button} onPress={() => router.push("/alarms")}>
        <Text style={styles.buttonText}>Manage alarms</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fafafa" },
  title: { fontSize: 36, fontWeight: "800", marginTop: 24 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 32 },
  banner: {
    backgroundColor: "#fff3cd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  bannerText: { fontSize: 13, color: "#664d03", lineHeight: 18 },
  bannerCode: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: { fontSize: 14, color: "#888", marginBottom: 8 },
  cardValue: { fontSize: 22, fontWeight: "700" },
  cardMeta: { fontSize: 13, color: "#aaa", marginTop: 8 },
  button: {
    backgroundColor: "#1a73e8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
