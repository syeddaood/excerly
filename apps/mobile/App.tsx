import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { PACKAGE_NAME, formatAlarmLabel } from "@dawnlock/shared";

/**
 * Smoke root screen for the Expo app (issue #17 monorepo foundation).
 * Real navigation / alarm UI arrives in later issues.
 */
export default function App() {
  const sample = formatAlarmLabel({ label: "Wake up", time: "06:30" });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DawnLock</Text>
      <Text style={styles.meta}>Shared: {PACKAGE_NAME}</Text>
      <Text style={styles.meta}>{sample}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1020",
    padding: 24,
  },
  title: {
    color: "#f5f7ff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  meta: {
    color: "#a8b0c8",
    fontSize: 14,
    marginTop: 4,
  },
});
