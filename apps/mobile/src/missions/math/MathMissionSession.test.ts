import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MathMissionConfig } from "@dawnlock/shared";
import { MathMissionSession } from "./MathMissionSession";

const config = (count: number): MathMissionConfig => ({
  kind: "math",
  difficulty: "easy",
  count,
});

describe("MathMissionSession", () => {
  it("does not complete until N successful results", () => {
    let completed = 0;
    const session = new MathMissionSession(config(3), {
      onComplete: () => {
        completed += 1;
      },
    });
    session.start();

    session.onResult(true);
    assert.equal(session.solvedCount, 1);
    assert.equal(completed, 0);

    session.onResult(false);
    assert.equal(session.solvedCount, 1);
    assert.equal(completed, 0);

    session.onResult(true);
    assert.equal(session.solvedCount, 2);
    assert.equal(completed, 0);

    session.onResult(true);
    assert.equal(session.solvedCount, 3);
    assert.equal(completed, 1);
    assert.equal(session.isComplete, true);
  });

  it("clamps required count to 1–5", () => {
    const session = new MathMissionSession(config(99), {
      onComplete: () => undefined,
    });
    assert.equal(session.requiredCount, 5);
  });

  it("ignores extra successes after complete", () => {
    let completed = 0;
    const session = new MathMissionSession(config(1), {
      onComplete: () => {
        completed += 1;
      },
    });
    session.onResult(true);
    session.onResult(true);
    assert.equal(completed, 1);
    assert.equal(session.solvedCount, 1);
  });
});
