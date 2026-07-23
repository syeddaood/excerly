import type { MathMissionConfig } from "@dawnlock/shared";
import {
  type Mission,
  type MissionContext,
} from "../missionFramework";
import { clampProblemCount } from "./generator";

/**
 * Imperative Mission controller for math (R9 / R10).
 *
 * Tracks solved count across onResult(true) calls and only fires
 * context.onComplete once all N problems are correct. Wrong answers never
 * exhaust the mission — the alarm keeps ringing until every problem is solved.
 */
export class MathMissionSession implements Mission {
  /** Math missions do not give up after failed attempts. */
  readonly maxAttempts: undefined = undefined;

  private solved = 0;
  private finished = false;
  private readonly target: number;

  constructor(
    config: MathMissionConfig,
    private readonly context: MissionContext
  ) {
    this.target = clampProblemCount(config.count);
  }

  start(): void {
    // UI is mounted by the ring screen; nothing imperative to start.
  }

  onResult(success: boolean): void {
    if (this.finished) return;
    if (!success) {
      // Wrong answer: UI regenerates a problem; keep ringing.
      return;
    }
    this.solved += 1;
    if (this.solved >= this.target) {
      this.finished = true;
      this.context.onComplete();
    }
  }

  /** Test/debug helper. */
  getSolvedCount(): number {
    return this.solved;
  }

  getTargetCount(): number {
    return this.target;
  }
}
