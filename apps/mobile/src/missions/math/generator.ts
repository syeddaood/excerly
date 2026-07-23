import type { MathDifficulty } from "@dawnlock/shared";

/**
 * Math problem generator (R10).
 *
 * Difficulties:
 * - easy:   single-digit add / subtract
 * - medium: two-digit × single-or-two-digit, or two-digit ÷ single-digit (exact)
 * - hard:   two-step expressions mixing + − ×
 */

export type MathProblem = {
  question: string;
  answer: number;
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEasy(): MathProblem {
  const op = Math.random() < 0.5 ? "+" : "-";
  if (op === "+") {
    const a = randInt(0, 9);
    const b = randInt(0, 9);
    return { question: `${a} + ${b}`, answer: a + b };
  }
  // Keep non-negative results for easy mode
  const a = randInt(0, 9);
  const b = randInt(0, a);
  return { question: `${a} − ${b}`, answer: a - b };
}

function generateMedium(): MathProblem {
  if (Math.random() < 0.5) {
    // Multiplication: two-digit × single-digit (or small two-digit)
    const a = randInt(10, 99);
    const b = Math.random() < 0.7 ? randInt(2, 9) : randInt(10, 12);
    return { question: `${a} × ${b}`, answer: a * b };
  }
  // Exact division: build from factors so answer is integer
  const b = randInt(2, 9);
  const answer = randInt(2, 12);
  const a = b * answer;
  return { question: `${a} ÷ ${b}`, answer };
}

function generateHard(): MathProblem {
  // Two-step: a ± b × c  or  a × b ± c
  const variant = randInt(0, 3);
  if (variant === 0) {
    const a = randInt(2, 20);
    const b = randInt(2, 12);
    const c = randInt(2, 9);
    return { question: `${a} + ${b} × ${c}`, answer: a + b * c };
  }
  if (variant === 1) {
    const b = randInt(2, 12);
    const c = randInt(2, 9);
    const product = b * c;
    const a = product + randInt(1, 20);
    return { question: `${a} − ${b} × ${c}`, answer: a - product };
  }
  if (variant === 2) {
    const a = randInt(2, 15);
    const b = randInt(2, 9);
    const c = randInt(1, 30);
    return { question: `${a} × ${b} + ${c}`, answer: a * b + c };
  }
  const a = randInt(2, 15);
  const b = randInt(2, 9);
  const product = a * b;
  const c = randInt(1, Math.max(1, product - 1));
  return { question: `${a} × ${b} − ${c}`, answer: product - c };
}

export function generateMathProblem(difficulty: MathDifficulty): MathProblem {
  switch (difficulty) {
    case "easy":
      return generateEasy();
    case "medium":
      return generateMedium();
    case "hard":
      return generateHard();
    default: {
      const _exhaustive: never = difficulty;
      return _exhaustive;
    }
  }
}

/** Clamp problem count to the product range 1–5. */
export function clampProblemCount(count: number): number {
  if (!Number.isFinite(count)) return 1;
  return Math.min(5, Math.max(1, Math.round(count)));
}

export function isValidDifficulty(value: string): value is MathDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}
