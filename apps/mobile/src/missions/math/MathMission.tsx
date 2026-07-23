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
import { clampProblemCount, generateMathProblem, type MathProblem } from "./generator";

type MathMissionProps = MissionProps & {
  config: MathMissionConfig;
};

/**
 * Math mission UI (R10).
 * Users solve N problems at the configured difficulty. Wrong answers regenerate
 * a fresh problem; the alarm keeps ringing until all N are solved.
 */
export function MathMission({ config, onComplete, onResult }: MathMissionProps) {
  const total = clampProblemCount(config.count);
  const [solved, setSolved] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  /** Bump to force a new problem (wrong answer or advance). */
  const [problemKey, setProblemKey] = useState(0);
  const [problem, setProblem] = useState<MathProblem>(() =>
    generateMathProblem(config.difficulty)
  );

  const nextProblem = useCallback(() => {
    setProblem(generateMathProblem(config.difficulty));
    setProblemKey((k) => k + 1);
    setInput("");
  }, [config.difficulty]);

  const handleSubmit = useCallback(() => {
    const raw = input.trim();
    if (raw === "" || raw === "-" || raw === "+") {
      setFeedback("Enter a number");
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      setFeedback("Enter a number");
      return;
    }

    if (value === problem.answer) {
      onResult?.(true);
      const next = solved + 1;
      if (next >= total) {
        onComplete();
        return;
      }
      setSolved(next);
      setFeedback(null);
      nextProblem();
    } else {
      // Wrong answer regenerates a new problem (R10).
      onResult?.(false);
      setFeedback("Wrong — new problem");
      nextProblem();
    }
  }, [input, nextProblem, onComplete, onResult, problem.answer, solved, total]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.progress}>
        Problem {Math.min(solved + 1, total)} of {total}
      </Text>
      <Text style={styles.difficulty}>{config.difficulty.toUpperCase()}</Text>
      <Text style={styles.question} key={problemKey}>
        {problem.question}
      </Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        keyboardType="numbers-and-punctuation"
        placeholder="Your answer"
        placeholderTextColor="#666"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        accessibilityLabel="Answer input"
      />
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      <Pressable
        style={({ pressed }) => [styles.submit, pressed && styles.submitPressed]}
        onPress={handleSubmit}
        accessibilityRole="button"
        accessibilityLabel="Submit answer"
      >
        <Text style={styles.submitText}>Submit</Text>
      </Pressable>
      <Text style={styles.hint}>Alarm keeps ringing until all problems are solved</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  progress: {
    fontSize: 18,
    color: "#aaa",
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "600",
  },
  difficulty: {
    fontSize: 13,
    color: "#666",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 20,
  },
  question: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 28,
  },
  input: {
    borderWidth: 2,
    borderColor: "#ffcc00",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "#1a1a1a",
    marginBottom: 16,
    textAlign: "center",
  },
  feedback: {
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  submit: {
    backgroundColor: "#ffcc00",
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 64,
    justifyContent: "center",
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },
  hint: {
    marginTop: 20,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
});
