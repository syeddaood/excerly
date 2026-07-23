/**
 * Registers built-in mission types with the framework.
 * Import this module once (from missions/index) so the registry is populated
 * before the ring screen resolves components.
 *
 * Adding a new mission type:
 *   1. Implement a React component matching MissionComponentProps
 *   2. Call registerMissionType({ kind, label, create, Component })
 *   3. Do NOT change the alarm / ring flow
 *
 * Out of scope for this issue: photo, voice, and other non-math missions.
 */

import type { MathMissionConfig, MissionConfig } from "@dawnlock/shared";
import { MathMission } from "./math/MathMission";
import { MathMissionSession } from "./math/MathMissionSession";
import {
  registerMissionType,
  type MissionContext,
  type MissionComponent,
} from "./missionFramework";

registerMissionType({
  kind: "math",
  label: "Math problems",
  create: (config: MissionConfig, context: MissionContext) =>
    new MathMissionSession(config as MathMissionConfig, context),
  // MathMission accepts MathMissionConfig; MissionConfig is currently only math.
  Component: MathMission as unknown as MissionComponent,
});
