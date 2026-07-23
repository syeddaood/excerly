import type { MathMissionConfig } from "@dawnlock/shared";
import {
  BaseMission,
  type MissionContext,
} from "../missionFramework";
import { clampProblemCount } from "./progress";

/**
 * Imperative mission controller for math.
 * Tracks N successful answers; only then fires context.onComplete.
 * Wrong answers never fail the mission (unlimited retries) — the alarm
 * keeps ringing until every required problem is solved.
 */
export class MathMissionSession extends BaseMission {
  /** Math missions do not cap failed attempts. */
  readonly maxAttempts = undefined;

  private solved = 0;
  private readonly required: number;

  constructor(config: MathMissionConfig, context: MissionContext) {
    super(context);
    this.required = clampProblemCount(config.count);
  }

  get solvedCount(): number {
    return this.solved;
  }

  get requiredCount(): number {
    return this.required;
  }

  get isComplete(): boolean {
    return this.solved >= this.required;
  }

  onResult(success: boolean): void {
    if (!success) {
      // Wrong answer — stay active; ring screen keeps sounding.
      return;
    }
    if (this.isComplete) return;
    this.solved += 1;
    if (this.solved >= this.required) {
      this.context.onComplete();
    }
  }
}
