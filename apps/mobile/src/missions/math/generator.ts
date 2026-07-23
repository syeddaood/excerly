import type { MathDifficulty } from "@dawnlock/shared";

export type MathProblem = {
  question: string;
  answer: number;
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a math problem for the given difficulty.
 *
 * Levels (product R10):
 * - easy:   single-digit add / subtract
 * - medium: two-digit × single-digit multiply
 * - hard:   mixed three-operand expressions
 */
export function generateMathProblem(difficulty: MathDifficulty): MathProblem {
  switch (difficulty) {
    case "easy": {
      // Single-digit add/subtract (non-negative results).
      if (Math.random() < 0.5) {
        const a = randInt(1, 9);
        const b = randInt(1, 9);
        return { question: `${a} + ${b} = ?`, answer: a + b };
      }
      const a = randInt(1, 9);
      const b = randInt(0, a);
      return { question: `${a} − ${b} = ?`, answer: a - b };
    }
    case "medium": {
      // Two-digit × single-digit multiply.
      const a = randInt(10, 99);
      const b = randInt(2, 9);
      return { question: `${a} × ${b} = ?`, answer: a * b };
    }
    case "hard": {
      // Mixed three-operand: a ± b × c  or  a × b ± c (left-to-right / standard precedence).
      const variant = randInt(0, 3);
      if (variant === 0) {
        // a + b × c  (precedence: multiply first)
        const a = randInt(2, 20);
        const b = randInt(2, 12);
        const c = randInt(2, 9);
        return { question: `${a} + ${b} × ${c} = ?`, answer: a + b * c };
      }
      if (variant === 1) {
        // a × b + c
        const a = randInt(3, 15);
        const b = randInt(2, 9);
        const c = randInt(1, 30);
        return { question: `${a} × ${b} + ${c} = ?`, answer: a * b + c };
      }
      if (variant === 2) {
        // a × b − c  (ensure non-negative)
        const a = randInt(4, 15);
        const b = randInt(3, 9);
        const product = a * b;
        const c = randInt(1, Math.min(30, product - 1));
        return { question: `${a} × ${b} − ${c} = ?`, answer: product - c };
      }
      // a − b + c  with a >= b so intermediate stays non-negative
      const b = randInt(1, 20);
      const a = randInt(b, b + 30);
      const c = randInt(1, 25);
      return { question: `${a} − ${b} + ${c} = ?`, answer: a - b + c };
    }
    default: {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      return { question: `${a} + ${b} = ?`, answer: a + b };
    }
  }
}

export function isValidDifficulty(value: string): value is MathDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}
