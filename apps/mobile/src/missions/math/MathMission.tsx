import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { MathMissionConfig } from "@dawnlock/shared";
import type { MissionProps } from "../types";
import { generateMathProblem } from "./generator";

type MathMissionProps = MissionProps & {
  config: MathMissionConfig;
};

export function MathMission({ config, onComplete }: MathMissionProps) {
  const total = Math.min(5, Math.max(1, config.count));
  const [solved, setSolved] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const problem = useMemo(
    () => generateMathProblem(config.difficulty),
    [config.difficulty, solved]
  );

  const handleSubmit = useCallback(() => {
    const value = Number(input.trim());
    if (!Number.isFinite(value)) {
      setFeedback("Enter a number");
      return;
    }
    if (value === problem.answer) {
      const next = solved + 1;
      if (next >= total) {
        onComplete();
        return;
      }
      setSolved(next);
      setInput("");
      setFeedback(null);
    } else {
      setFeedback("Wrong — try this one");
      setInput("");
    }
  }, [input, onComplete, problem.answer, solved, total]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.progress}>
        Problem {solved + 1} of {total}
      </Text>
      <Text style={styles.question}>{problem.question}</Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        keyboardType="number-pad"
        placeholder="Your answer"
        autoFocus
      />
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      <Button title="Submit" onPress={handleSubmit} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  progress: { fontSize: 16, color: "#aaa", marginBottom: 16, textAlign: "center" },
  question: {
    fontSize: 42,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    padding: 14,
    fontSize: 24,
    color: "#fff",
    backgroundColor: "#222",
    marginBottom: 12,
    textAlign: "center",
  },
  feedback: { color: "#ff6b6b", textAlign: "center", marginBottom: 8 },
});
