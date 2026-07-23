import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampProblemCount,
  startMathProgress,
  submitMathAnswer,
  type MathMissionProgress,
} from "./progress";

function withAnswer(progress: MathMissionProgress, answer: number): MathMissionProgress {
  return {
    ...progress,
    problem: { question: "test = ?", answer },
  };
}

describe("clampProblemCount", () => {
  it("clamps to 1–5", () => {
    assert.equal(clampProblemCount(0), 1);
    assert.equal(clampProblemCount(-3), 1);
    assert.equal(clampProblemCount(1), 1);
    assert.equal(clampProblemCount(3), 3);
    assert.equal(clampProblemCount(5), 5);
    assert.equal(clampProblemCount(9), 5);
    assert.equal(clampProblemCount(2.9), 2);
  });
});

describe("math mission progress", () => {
  it("starts at zero solved with configured total", () => {
    const p = startMathProgress({ kind: "math", difficulty: "easy", count: 4 });
    assert.equal(p.solved, 0);
    assert.equal(p.total, 4);
    assert.equal(typeof p.problem.answer, "number");
  });

  it("does not advance on wrong answers and regenerates the problem", () => {
    let p = startMathProgress({ kind: "math", difficulty: "easy", count: 3 });
    p = withAnswer(p, 10);
    const beforeIssue = p.issue;
    const result = submitMathAnswer(p, "99");
    assert.equal(result.status, "wrong");
    if (result.status !== "wrong") return;
    assert.equal(result.progress.solved, 0);
    assert.ok(result.progress.issue > beforeIssue);
    // Alarm must not complete on a wrong answer.
    assert.notEqual(result.status, "complete");
  });

  it("requires N correct answers before complete", () => {
    let p = startMathProgress({ kind: "math", difficulty: "easy", count: 3 });

    p = withAnswer(p, 5);
    let r = submitMathAnswer(p, "5");
    assert.equal(r.status, "correct");
    assert.equal(r.progress.solved, 1);
    p = withAnswer(r.progress, 7);

    r = submitMathAnswer(p, "7");
    assert.equal(r.status, "correct");
    assert.equal(r.progress.solved, 2);
    p = withAnswer(r.progress, 9);

    r = submitMathAnswer(p, "9");
    assert.equal(r.status, "complete");
    assert.equal(r.progress.solved, 3);
  });

  it("wrong answers between corrects do not reduce the required N", () => {
    let p = startMathProgress({ kind: "math", difficulty: "medium", count: 2 });
    p = withAnswer(p, 12);
    let r = submitMathAnswer(p, "12");
    assert.equal(r.status, "correct");
    p = withAnswer(r.progress, 20);

    r = submitMathAnswer(p, "1");
    assert.equal(r.status, "wrong");
    assert.equal(r.progress.solved, 1);
    p = withAnswer(r.progress, 8);

    r = submitMathAnswer(p, "8");
    assert.equal(r.status, "complete");
  });

  it("rejects non-numeric input without consuming a problem", () => {
    let p = startMathProgress({ kind: "math", difficulty: "easy", count: 1 });
    p = withAnswer(p, 4);
    const r = submitMathAnswer(p, "abc");
    assert.equal(r.status, "invalid");
    assert.equal(r.progress.solved, 0);
    assert.equal(r.progress.issue, p.issue);
  });
});
