import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateMathProblem } from "./generator";

describe("generateMathProblem", () => {
  it("easy problems use small addition", () => {
    const p = generateMathProblem("easy");
    assert.match(p.question, /^\d+ \+ \d+ = \?$/);
    assert.ok(p.answer >= 2 && p.answer <= 18);
  });

  it("medium problems stay within reasonable bounds", () => {
    for (let i = 0; i < 20; i++) {
      const p = generateMathProblem("medium");
      assert.ok(p.answer >= 0 && p.answer <= 98);
    }
  });

  it("hard problems use multiplication", () => {
    const p = generateMathProblem("hard");
    assert.match(p.question, /×/);
    assert.ok(p.answer >= 24 && p.answer <= 1188);
  });
});
