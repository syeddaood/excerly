/**
 * Mission framework — common contract + registry so new mission types can be
 * added without altering the alarm / ring flow.
 *
 * Product requirement (README R9):
 *   Mission { start(): void; onResult(success: boolean): void; maxAttempts?: number }
 */

import type { ComponentType } from "react";
import type { MissionConfig } from "@dawnlock/shared";

// ---------------------------------------------------------------------------
// Core interface
// ---------------------------------------------------------------------------

/**
 * Common interface every mission type must satisfy.
 * Alarm flow only talks to this contract — never to concrete mission classes.
 */
export interface Mission {
  /** Begin the mission (show UI, start sensors, etc.). */
  start(): void;
  /**
   * Report the outcome of an attempt.
   * Implementations decide when the overall mission is complete or failed.
   */
  onResult(success: boolean): void;
  /** Optional cap on failed attempts before the mission gives up. */
  maxAttempts?: number;
}

// ---------------------------------------------------------------------------
// Context passed into mission factories
// ---------------------------------------------------------------------------

export type MissionContext = {
  /** Fired when the mission is fully completed (alarm may dismiss). */
  onComplete: () => void;
  /** Fired when the mission fails (e.g. max attempts exceeded). */
  onFail?: () => void;
};

// ---------------------------------------------------------------------------
// React UI bridge (missions render as components on the ring screen)
// ---------------------------------------------------------------------------

export type MissionComponentProps<C extends MissionConfig = MissionConfig> = {
  config: C;
  onComplete: () => void;
  /** Optional per-attempt callback; maps to Mission.onResult. */
  onResult?: (success: boolean) => void;
};

export type MissionComponent<C extends MissionConfig = MissionConfig> =
  ComponentType<MissionComponentProps<C>>;

// ---------------------------------------------------------------------------
// Type registration
// ---------------------------------------------------------------------------

/**
 * Descriptor for a registered mission type.
 * `create` builds an imperative Mission; `Component` is the ring-screen UI.
 */
export type MissionTypeDescriptor<C extends MissionConfig = MissionConfig> = {
  kind: string;
  label: string;
  /** Factory that produces a Mission instance for the given config + context. */
  create: (config: C, context: MissionContext) => Mission;
  /** React component rendered while the mission is active. */
  Component: MissionComponent<C>;
};

const registry = new Map<string, MissionTypeDescriptor>();

/**
 * Register a mission type. Call once at module load for each concrete mission.
 * Adding a new type = implement Mission + Component, then registerMissionType().
 * The alarm / ring flow does not need to change.
 */
export function registerMissionType(descriptor: MissionTypeDescriptor): void {
  if (registry.has(descriptor.kind)) {
    throw new Error(`Mission type already registered: ${descriptor.kind}`);
  }
  registry.set(descriptor.kind, descriptor);
}

/** Look up a registered mission type by kind (e.g. "math"). */
export function getMissionType(kind: string): MissionTypeDescriptor | undefined {
  return registry.get(kind);
}

/** All registered mission types (useful for settings / pickers). */
export function listMissionTypes(): MissionTypeDescriptor[] {
  return Array.from(registry.values());
}

/**
 * Create a Mission instance for the given config.
 * Returns null if no type is registered for `config.kind`.
 */
export function createMission(
  config: MissionConfig,
  context: MissionContext
): Mission | null {
  const type = registry.get(config.kind);
  if (!type) return null;
  return type.create(config, context);
}

/**
 * Resolve the React component for a mission kind.
 * Ring screen uses this instead of hard-coding MathMission, etc.
 */
export function resolveMissionComponent(
  kind: string
): MissionComponent | undefined {
  return registry.get(kind)?.Component;
}

// ---------------------------------------------------------------------------
// Base helper — optional convenience for imperative mission implementations
// ---------------------------------------------------------------------------

/**
 * Tracks failed attempts and wires onResult → onComplete / onFail.
 * Concrete missions may extend this or implement Mission directly.
 */
export abstract class BaseMission implements Mission {
  abstract readonly maxAttempts?: number;
  protected attempts = 0;
  private started = false;

  constructor(protected readonly context: MissionContext) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    this.onStart();
  }

  /** Override to perform type-specific start work. */
  protected onStart(): void {
    // default: no-op
  }

  onResult(success: boolean): void {
    if (success) {
      this.context.onComplete();
      return;
    }
    this.attempts += 1;
    if (
      this.maxAttempts != null &&
      this.attempts >= this.maxAttempts
    ) {
      this.context.onFail?.();
    }
  }
}

/**
 * Lightweight Mission that delegates UI to a registered React component.
 * `start()` is a no-op (the ring screen mounts the Component); `onResult`
 * routes success/failure into the shared context.
 */
export class ComponentBackedMission extends BaseMission {
  readonly maxAttempts?: number;

  constructor(
    context: MissionContext,
    options?: { maxAttempts?: number }
  ) {
    super(context);
    this.maxAttempts = options?.maxAttempts;
  }
}
