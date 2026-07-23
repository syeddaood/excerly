import type { MathDifficulty, MathMissionConfig } from "@dawnlock/shared";
import { generateMathProblem, type MathProblem } from "./generator";

/** Clamp problem count to the product range 1–5. */
export function clampProblemCount(count: number): number {
  if (!Number.isFinite(count)) return 1;
  return Math.min(5, Math.max(1, Math.floor(count)));
}

export type MathMissionProgress = {
  /** Problems solved so far (0 … total). */
  solved: number;
  /** Required correct answers to dismiss. */
  total: number;
  difficulty: MathDifficulty;
  /** Current problem shown to the user. */
  problem: MathProblem;
  /**
   * Bumps whenever a new problem is issued (correct advance or wrong regenerate).
   * Useful as a React memo/effect dependency.
   */
  issue: number;
};

export type MathAnswerResult =
  | { status: "invalid"; progress: MathMissionProgress; message: string }
  | { status: "wrong"; progress: MathMissionProgress; message: string }
  | { status: "correct"; progress: MathMissionProgress }
  | { status: "complete"; progress: MathMissionProgress };

/**
 * Start a math mission session from alarm config.
 * Alarm must keep ringing until status becomes "complete".
 */
export function startMathProgress(config: MathMissionConfig): MathMissionProgress {
  const total = clampProblemCount(config.count);
  return {
    solved: 0,
    total,
    difficulty: config.difficulty,
    problem: generateMathProblem(config.difficulty),
    issue: 0,
  };
}

/**
 * Apply a user answer. Wrong answers regenerate a fresh problem without
 * advancing `solved`. Only `status: "complete"` means the alarm may stop.
 */
export function submitMathAnswer(
  progress: MathMissionProgress,
  rawInput: string
): MathAnswerResult {
  const trimmed = rawInput.trim();
  if (trimmed.length === 0) {
    return {
      status: "invalid",
      progress,
      message: "Enter a number",
    };
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return {
      status: "invalid",
      progress,
      message: "Enter a number",
    };
  }

  // Accept integers only — reject "12.5" style half-answers.
  if (!Number.isInteger(value)) {
    return {
      status: "invalid",
      progress,
      message: "Enter a whole number",
    };
  }

  if (value !== progress.problem.answer) {
    const next: MathMissionProgress = {
      ...progress,
      problem: generateMathProblem(progress.difficulty),
      issue: progress.issue + 1,
    };
    return {
      status: "wrong",
      progress: next,
      message: "Wrong — new problem",
    };
  }

  const solved = progress.solved + 1;
  if (solved >= progress.total) {
    const done: MathMissionProgress = {
      ...progress,
      solved,
    };
    return { status: "complete", progress: done };
  }

  const advanced: MathMissionProgress = {
    ...progress,
    solved,
    problem: generateMathProblem(progress.difficulty),
    issue: progress.issue + 1,
  };
  return { status: "correct", progress: advanced };
}
