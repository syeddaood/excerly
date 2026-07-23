import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MathMissionSession } from "./MathMissionSession";

describe("MathMissionSession", () => {
  it("completes only after N successful results", () => {
    let completed = 0;
    const session = new MathMissionSession(
      { kind: "math", difficulty: "easy", count: 3 },
      {
        onComplete: () => {
          completed += 1;
        },
      }
    );
    session.start();
    session.onResult(true);
    session.onResult(false); // wrong — does not count
    session.onResult(true);
    assert.equal(completed, 0);
    assert.equal(session.getSolvedCount(), 2);
    session.onResult(true);
    assert.equal(completed, 1);
    assert.equal(session.getSolvedCount(), 3);
    // Further results are ignored
    session.onResult(true);
    assert.equal(completed, 1);
  });

  it("clamps count to 1–5", () => {
    const session = new MathMissionSession(
      { kind: "math", difficulty: "hard", count: 99 },
      { onComplete: () => {} }
    );
    assert.equal(session.getTargetCount(), 5);
  });

  it("never sets maxAttempts (alarm keeps ringing)", () => {
    const session = new MathMissionSession(
      { kind: "math", difficulty: "medium", count: 2 },
      { onComplete: () => {} }
    );
    assert.equal(session.maxAttempts, undefined);
  });
});
