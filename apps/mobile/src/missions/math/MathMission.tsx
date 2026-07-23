import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { MathMissionConfig } from "@dawnlock/shared";
import type { MissionProps } from "../types";
import { startMathProgress, submitMathAnswer } from "./progress";

type MathMissionProps = MissionProps & {
  config: MathMissionConfig;
};

/**
 * Math mission UI — user must solve N problems at the configured difficulty.
 * Wrong answers regenerate a new problem; the parent ring screen keeps the
 * alarm sounding until `onComplete` fires after the final correct answer.
 */
export function MathMission({ config, onComplete, onResult }: MathMissionProps) {
  const [progress, setProgress] = useState(() => startMathProgress(config));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    const result = submitMathAnswer(progress, input);

    if (result.status === "invalid") {
      setFeedback(result.message);
      return;
    }

    if (result.status === "wrong") {
      onResult?.(false);
      setProgress(result.progress);
      setInput("");
      setFeedback(result.message);
      return;
    }

    if (result.status === "correct") {
      onResult?.(true);
      setProgress(result.progress);
      setInput("");
      setFeedback(null);
      return;
    }

    // complete — all N solved; only now may the alarm stop
    onResult?.(true);
    setProgress(result.progress);
    setInput("");
    setFeedback(null);
    onComplete();
  }, [input, onComplete, onResult, progress]);

  const remaining = progress.total - progress.solved;
  const problemNumber = Math.min(progress.solved + 1, progress.total);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.progress}>
        Problem {problemNumber} of {progress.total}
      </Text>
      <Text style={styles.remaining}>
        {remaining === 1
          ? "1 problem left to silence the alarm"
          : `${remaining} problems left to silence the alarm`}
      </Text>

      <Text style={styles.question}>{progress.problem.question}</Text>

      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        keyboardType="number-pad"
        placeholder="Your answer"
        placeholderTextColor="#666"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        accessibilityLabel="Math answer"
      />

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <Pressable
        style={({ pressed }) => [styles.submit, pressed && styles.submitPressed]}
        onPress={handleSubmit}
        accessibilityRole="button"
        accessibilityLabel="Submit answer"
      >
        <Text style={styles.submitText}>Submit answer</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  progress: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ccc",
    marginBottom: 6,
    textAlign: "center",
  },
  remaining: {
    fontSize: 14,
    color: "#888",
    marginBottom: 28,
    textAlign: "center",
  },
  question: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: "#ffcc00",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "#1a1a1a",
    marginBottom: 14,
    textAlign: "center",
  },
  feedback: {
    color: "#ff6b6b",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  submit: {
    backgroundColor: "#ffcc00",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    minHeight: 56,
    justifyContent: "center",
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },
});
