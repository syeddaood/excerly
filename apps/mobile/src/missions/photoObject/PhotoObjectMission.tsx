/**
 * Photo-object mission component (wake-time).
 *
 * Wake-time execution is intentionally out of scope for the registration issue.
 * This component is registered so the mission framework can resolve the kind;
 * it surfaces a clear message rather than performing capture/match.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { MissionComponentProps } from "../missionFramework";

/**
 * Placeholder wake-time UI. Registration + local fingerprint storage only.
 * Matching at dismiss time lands in a later issue.
 */
export function PhotoObjectMission(_props: MissionComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photo object mission</Text>
      <Text style={styles.body}>
        Wake-time photo verification is not available in this build. The target
        object fingerprint is stored on the alarm from setup.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffcc00",
    marginBottom: 12,
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 20,
  },
});
