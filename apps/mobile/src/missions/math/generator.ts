import type { MathDifficulty } from "@dawnlock/shared";

/**
 * Math problem generator (R10).
 *
 * Difficulties:
 * - easy:   single-digit add / subtract
 * - medium: two-digit × single-or-two-digit multiply
 * - hard:   mixed three-operand expressions
 */

export type MathProblem = {
  question: string;
  answer: number;
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Single-digit add or subtract (non-negative result). */
function generateEasy(): MathProblem {
  if (Math.random() < 0.5) {
    const a = randInt(1, 9);
    const b = randInt(1, 9);
    return { question: `${a} + ${b} = ?`, answer: a + b };
  }
  const a = randInt(1, 9);
  const b = randInt(0, a); // keep non-negative
  return { question: `${a} − ${b} = ?`, answer: a - b };
}

/** Two-digit multiply (first factor 10–99, second 2–12 for mental math). */
function generateMedium(): MathProblem {
  const a = randInt(10, 99);
  const b = randInt(2, 12);
  return { question: `${a} × ${b} = ?`, answer: a * b };
}

/**
 * Mixed three-operand: combinations of +, −, × with left-to-right evaluation
 * except × binds tighter when mixed with +/− (standard school order).
 */
function generateHard(): MathProblem {
  const pattern = randInt(0, 3);
  switch (pattern) {
    case 0: {
      // a + b × c  (multiply first)
      const a = randInt(2, 20);
      const b = randInt(2, 12);
      const c = randInt(2, 9);
      return {
        question: `${a} + ${b} × ${c} = ?`,
        answer: a + b * c,
      };
    }
    case 1: {
      // a × b − c
      const a = randInt(3, 15);
      const b = randInt(2, 9);
      const c = randInt(1, Math.min(20, a * b - 1));
      return {
        question: `${a} × ${b} − ${c} = ?`,
        answer: a * b - c,
      };
    }
    case 2: {
      // a − b + c
      const b = randInt(1, 20);
      const a = randInt(b, b + 30);
      const c = randInt(1, 20);
      return {
        question: `${a} − ${b} + ${c} = ?`,
        answer: a - b + c,
      };
    }
    default: {
      // a × b + c
      const a = randInt(2, 12);
      const b = randInt(2, 12);
      const c = randInt(1, 30);
      return {
        question: `${a} × ${b} + ${c} = ?`,
        answer: a * b + c,
      };
    }
  }
}

export function generateMathProblem(difficulty: MathDifficulty): MathProblem {
  switch (difficulty) {
    case "easy":
      return generateEasy();
    case "medium":
      return generateMedium();
    case "hard":
      return generateHard();
    default:
      return generateEasy();
  }
}

export function isValidDifficulty(value: string): value is MathDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

/** Clamp problem count to the product range 1–5. */
export function clampProblemCount(count: number): number {
  if (!Number.isFinite(count)) return 1;
  return Math.min(5, Math.max(1, Math.floor(count)));
}
