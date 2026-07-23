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
import type { MissionComponentProps } from "../missionFramework";
import {
  clampProblemCount,
  generateMathProblem,
  type MathProblem,
} from "./generator";

type Props = MissionComponentProps<MathMissionConfig>;

/**
 * Math mission UI (R10).
 * Wrong answers generate a fresh problem; mission completes only after N correct.
 * No max-attempt cap — the alarm keeps ringing until success.
 */
export function MathMission({ config, onComplete, onResult }: Props) {
  const target = clampProblemCount(config.count);
  const [solved, setSolved] = useState(0);
  const [problem, setProblem] = useState<MathProblem>(() =>
    generateMathProblem(config.difficulty)
  );
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const nextProblem = useCallback(() => {
    setProblem(generateMathProblem(config.difficulty));
    setInput("");
  }, [config.difficulty]);

  const submit = useCallback(() => {
    const parsed = Number(input.trim());
    if (!Number.isFinite(parsed)) {
      setFeedback("Enter a number");
      return;
    }
    if (parsed === problem.answer) {
      const next = solved + 1;
      setSolved(next);
      setFeedback("Correct!");
      onResult?.(true);
      if (next >= target) {
        onComplete();
      } else {
        nextProblem();
      }
    } else {
      setFeedback("Wrong — try a new problem");
      onResult?.(false);
      // R10: wrong answers generate a new problem
      nextProblem();
    }
  }, [input, problem.answer, solved, target, onComplete, onResult, nextProblem]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.wrap}
    >
      <Text style={styles.progress}>
        Problem {Math.min(solved + 1, target)} of {target}
      </Text>
      <Text style={styles.question}>{problem.question} = ?</Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        keyboardType="number-pad"
        placeholder="Answer"
        placeholderTextColor="#666"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      <Pressable
        style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
        onPress={submit}
        accessibilityRole="button"
        accessibilityLabel="Submit answer"
      >
        <Text style={styles.submitText}>Submit</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
  },
  progress: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  question: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "800",
    marginVertical: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: "#444",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    width: "70%",
    textAlign: "center",
    color: "#fff",
  },
  feedback: {
    color: "#f0c040",
    fontSize: 16,
    fontWeight: "600",
    minHeight: 22,
  },
  submitBtn: {
    marginTop: 8,
    backgroundColor: "#1a73e8",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    minWidth: "70%",
    alignItems: "center",
  },
  pressed: { opacity: 0.85 },
  submitText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
});
