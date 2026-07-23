import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { WakeEvent } from "@dawnlock/shared";
import { computeLocalStreak } from "./localStreak";

function wake(completedAt: number, id = `w_${completedAt}`): WakeEvent {
  return {
    id,
    alarmId: "a1",
    firedAt: completedAt - 60_000,
    completedAt,
    assisted: false,
  };
}

describe("computeLocalStreak", () => {
  it("returns zeros for empty history", () => {
    const s = computeLocalStreak([]);
    assert.deepEqual(s, { current: 0, longest: 0, totalWins: 0 });
  });

  it("counts consecutive days ending today", () => {
    // Use fixed UTC noon stamps so day keys are stable in UTC.
    const day = (ymd: string) => Date.parse(`${ymd}T12:00:00Z`);
    const events = [
      wake(day("2024-01-01")),
      wake(day("2024-01-02")),
      wake(day("2024-01-03")),
    ];
    const s = computeLocalStreak(events, day("2024-01-03"), "UTC");
    assert.equal(s.current, 3);
    assert.equal(s.longest, 3);
    assert.equal(s.totalWins, 3);
  });

  it("keeps streak if last win was yesterday", () => {
    const day = (ymd: string) => Date.parse(`${ymd}T12:00:00Z`);
    const events = [wake(day("2024-01-01")), wake(day("2024-01-02"))];
    const s = computeLocalStreak(events, day("2024-01-03"), "UTC");
    assert.equal(s.current, 2);
  });
});
