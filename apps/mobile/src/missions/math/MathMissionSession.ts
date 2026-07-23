import type { MathMissionConfig } from "@dawnlock/shared";
import {
  type Mission,
  type MissionContext,
} from "../missionFramework";
import { clampProblemCount } from "./generator";

/**
 * Imperative Mission for math (R9 / R10).
 * Tracks N correct answers; wrong answers do not count and never cap out
 * (no maxAttempts — alarm keeps ringing until N correct).
 */
export class MathMissionSession implements Mission {
  /** Math missions never give up — undefined maxAttempts. */
  readonly maxAttempts: undefined = undefined;

  private readonly target: number;
  private solved = 0;
  private started = false;
  private finished = false;

  constructor(
    config: MathMissionConfig,
    private readonly context: MissionContext
  ) {
    this.target = clampProblemCount(config.count);
  }

  start(): void {
    if (this.started) return;
    this.started = true;
  }

  onResult(success: boolean): void {
    if (this.finished) return;
    if (!success) {
      // Wrong answer: do not increment solved; no fail path.
      return;
    }
    this.solved += 1;
    if (this.solved >= this.target) {
      this.finished = true;
      this.context.onComplete();
    }
  }

  getSolvedCount(): number {
    return this.solved;
  }

  getTargetCount(): number {
    return this.target;
  }
}
