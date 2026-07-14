import type { MathDifficulty } from "@dawnlock/shared";

export type MathProblem = {
  question: string;
  answer: number;
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMathProblem(difficulty: MathDifficulty): MathProblem {
  switch (difficulty) {
    case "easy": {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      return { question: `${a} + ${b} = ?`, answer: a + b };
    }
    case "medium": {
      const a = randInt(10, 49);
      const b = randInt(10, 49);
      const op = Math.random() < 0.5 ? "+" : "-";
      if (op === "+") {
        return { question: `${a} + ${b} = ?`, answer: a + b };
      }
      const hi = Math.max(a, b);
      const lo = Math.min(a, b);
      return { question: `${hi} - ${lo} = ?`, answer: hi - lo };
    }
    case "hard": {
      const a = randInt(12, 99);
      const b = randInt(2, 12);
      return { question: `${a} × ${b} = ?`, answer: a * b };
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
