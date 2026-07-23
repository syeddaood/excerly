import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateMathProblem, isValidDifficulty } from "./generator";

/** Evaluate a generated question string with the same operators we emit. */
function evalQuestion(question: string): number {
  const expr = question
    .replace(" = ?", "")
    .replace(/×/g, "*")
    .replace(/−/g, "-");
  // Expressions are simple a op b [op c]; use Function for test-only eval.
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expr});`)() as number;
}

describe("generateMathProblem", () => {
  it("easy problems are single-digit add or subtract", () => {
    for (let i = 0; i < 40; i++) {
      const p = generateMathProblem("easy");
      assert.match(p.question, /^\d+ [+−] \d+ = \?$/);
      const nums = p.question.match(/\d+/g)!.map(Number);
      assert.ok(nums.every((n) => n >= 0 && n <= 9));
      assert.equal(p.answer, evalQuestion(p.question));
      assert.ok(p.answer >= 0);
    }
  });

  it("medium problems are two-digit × single-digit multiply", () => {
    for (let i = 0; i < 30; i++) {
      const p = generateMathProblem("medium");
      assert.match(p.question, /^\d+ × \d+ = \?$/);
      const [a, b] = p.question.match(/\d+/g)!.map(Number);
      assert.ok(a >= 10 && a <= 99);
      assert.ok(b >= 2 && b <= 9);
      assert.equal(p.answer, a * b);
    }
  });

  it("hard problems use mixed three-operand expressions", () => {
    for (let i = 0; i < 40; i++) {
      const p = generateMathProblem("hard");
      // Three numbers and two operators.
      const nums = p.question.match(/\d+/g);
      assert.ok(nums && nums.length === 3, `expected 3 operands: ${p.question}`);
      assert.match(p.question, /[+×−]/);
      assert.equal(p.answer, evalQuestion(p.question));
      assert.ok(p.answer >= 0);
    }
  });

  it("isValidDifficulty accepts only known levels", () => {
    assert.equal(isValidDifficulty("easy"), true);
    assert.equal(isValidDifficulty("medium"), true);
    assert.equal(isValidDifficulty("hard"), true);
    assert.equal(isValidDifficulty("expert"), false);
  });
});
