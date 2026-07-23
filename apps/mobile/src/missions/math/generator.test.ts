import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampProblemCount,
  generateMathProblem,
  isValidDifficulty,
} from "./generator";

describe("generateMathProblem", () => {
  it("returns finite integer answers for every difficulty", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      for (let i = 0; i < 40; i++) {
        const p = generateMathProblem(difficulty);
        assert.equal(typeof p.question, "string");
        assert.ok(p.question.length > 0);
        assert.equal(typeof p.answer, "number");
        assert.ok(Number.isFinite(p.answer));
        assert.equal(p.answer, Math.trunc(p.answer));
      }
    }
  });

  it("easy problems only use single-digit add/subtract", () => {
    for (let i = 0; i < 30; i++) {
      const p = generateMathProblem("easy");
      assert.match(p.question, /^\d+ [+−] \d+$/);
      const parts = p.question.split(" ");
      const a = Number(parts[0]);
      const b = Number(parts[2]);
      assert.ok(a >= 0 && a <= 9);
      assert.ok(b >= 0 && b <= 9);
      if (parts[1] === "+") assert.equal(p.answer, a + b);
      else assert.equal(p.answer, a - b);
    }
  });

  it("medium problems are multiply or divide", () => {
    for (let i = 0; i < 30; i++) {
      const p = generateMathProblem("medium");
      assert.match(p.question, /^\d+ [×÷] \d+$/);
    }
  });

  it("hard problems are two-step expressions", () => {
    for (let i = 0; i < 30; i++) {
      const p = generateMathProblem("hard");
      // a ± b × c  or  a × b ± c
      assert.match(p.question, /^\d+ [+−×] \d+ [+−×] \d+$/);
    }
  });
});

describe("clampProblemCount", () => {
  it("clamps to 1–5", () => {
    assert.equal(clampProblemCount(0), 1);
    assert.equal(clampProblemCount(-3), 1);
    assert.equal(clampProblemCount(1), 1);
    assert.equal(clampProblemCount(3), 3);
    assert.equal(clampProblemCount(5), 5);
    assert.equal(clampProblemCount(9), 5);
    assert.equal(clampProblemCount(2.6), 3);
  });
});

describe("isValidDifficulty", () => {
  it("accepts only easy|medium|hard", () => {
    assert.equal(isValidDifficulty("easy"), true);
    assert.equal(isValidDifficulty("medium"), true);
    assert.equal(isValidDifficulty("hard"), true);
    assert.equal(isValidDifficulty("extreme"), false);
  });
});
