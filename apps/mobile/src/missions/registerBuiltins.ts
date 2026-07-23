/**
 * Registers built-in mission types with the framework.
 * Import this module once (from missions/index) so the registry is populated
 * before the ring screen resolves components.
 *
 * Adding a new mission type:
 *   1. Implement a React component matching MissionComponentProps
 *   2. Call registerMissionType({ kind, label, create, Component })
 *   3. Do NOT change the alarm / ring flow
 */

import type { MissionConfig } from "@dawnlock/shared";
import { MathMission } from "./math/MathMission";
import { MathMissionSession } from "./math/MathMissionSession";
import {
  registerMissionType,
  type MissionContext,
} from "./missionFramework";

registerMissionType({
  kind: "math",
  label: "Math problems",
  create: (config: MissionConfig, context: MissionContext) =>
    new MathMissionSession(config, context),
  // MathMission accepts MathMissionConfig; MissionConfig is currently only math.
  // Cast keeps the registry generic without coupling the framework to math.
  Component: MathMission as unknown as import("./missionFramework").MissionComponent,
});
