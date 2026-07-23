import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampProblemCount,
  generateMathProblem,
  isValidDifficulty,
} from "./generator";

describe("generateMathProblem difficulty bounds (R10)", () => {
  it("easy: single-digit add or subtract with non-negative answers", () => {
    for (let i = 0; i < 40; i++) {
      const p = generateMathProblem("easy");
      assert.match(p.question, /^\d+ [+−] \d+ = \?$/);
      const match = p.question.match(/^(\d+) ([+−]) (\d+) = \?$/);
      assert.ok(match);
      const a = Number(match![1]);
      const op = match![2];
      const b = Number(match![3]);
      assert.ok(a >= 0 && a <= 9, `operand a out of single-digit range: ${a}`);
      assert.ok(b >= 0 && b <= 9, `operand b out of single-digit range: ${b}`);
      if (op === "+") {
        assert.equal(p.answer, a + b);
      } else {
        assert.equal(p.answer, a - b);
        assert.ok(p.answer >= 0, "subtract result must be non-negative");
      }
    }
  });

  it("medium: two-digit multiply", () => {
    for (let i = 0; i < 40; i++) {
      const p = generateMathProblem("medium");
      assert.match(p.question, /^\d+ × \d+ = \?$/);
      const match = p.question.match(/^(\d+) × (\d+) = \?$/);
      assert.ok(match);
      const a = Number(match![1]);
      const b = Number(match![2]);
      assert.ok(a >= 10 && a <= 99, `first factor should be two-digit: ${a}`);
      assert.ok(b >= 2 && b <= 12, `second factor out of range: ${b}`);
      assert.equal(p.answer, a * b);
      assert.ok(p.answer >= 20 && p.answer <= 99 * 12);
    }
  });

  it("hard: mixed three-operand expressions", () => {
    for (let i = 0; i < 40; i++) {
      const p = generateMathProblem("hard");
      // Three numbers and two operators
      assert.match(
        p.question,
        /^\d+ [+−×] \d+ [+−×] \d+ = \?$/,
        `expected three-operand question, got: ${p.question}`
      );
      assert.ok(Number.isFinite(p.answer));
      // Spot-check evaluation for known patterns
      const mulAdd = p.question.match(/^(\d+) × (\d+) \+ (\d+) = \?$/);
      if (mulAdd) {
        assert.equal(
          p.answer,
          Number(mulAdd[1]) * Number(mulAdd[2]) + Number(mulAdd[3])
        );
      }
      const addMul = p.question.match(/^(\d+) \+ (\d+) × (\d+) = \?$/);
      if (addMul) {
        assert.equal(
          p.answer,
          Number(addMul[1]) + Number(addMul[2]) * Number(addMul[3])
        );
      }
      const mulSub = p.question.match(/^(\d+) × (\d+) − (\d+) = \?$/);
      if (mulSub) {
        assert.equal(
          p.answer,
          Number(mulSub[1]) * Number(mulSub[2]) - Number(mulSub[3])
        );
      }
      const subAdd = p.question.match(/^(\d+) − (\d+) \+ (\d+) = \?$/);
      if (subAdd) {
        assert.equal(
          p.answer,
          Number(subAdd[1]) - Number(subAdd[2]) + Number(subAdd[3])
        );
      }
    }
  });

  it("isValidDifficulty accepts only the three levels", () => {
    assert.equal(isValidDifficulty("easy"), true);
    assert.equal(isValidDifficulty("medium"), true);
    assert.equal(isValidDifficulty("hard"), true);
    assert.equal(isValidDifficulty("expert"), false);
  });

  it("clampProblemCount enforces 1–5", () => {
    assert.equal(clampProblemCount(0), 1);
    assert.equal(clampProblemCount(1), 1);
    assert.equal(clampProblemCount(3), 3);
    assert.equal(clampProblemCount(5), 5);
    assert.equal(clampProblemCount(9), 5);
    assert.equal(clampProblemCount(2.7), 2);
    assert.equal(clampProblemCount(Number.NaN), 1);
  });
});
