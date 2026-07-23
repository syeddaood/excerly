/**
 * Registers built-in mission types with the framework.
 * Import this module once (from missions/index) so the registry is populated
 * before the ring screen resolves components.
 *
 * Adding a new mission type = register here + implement Mission + Component.
 */

import type { MathMissionConfig } from "@dawnlock/shared";
import { registerMissionType } from "./missionFramework";
import { MathMission } from "./math/MathMission";
import { MathMissionSession } from "./math/MathMissionSession";

let registered = false;

export function registerBuiltinMissions(): void {
  if (registered) return;
  registered = true;

  registerMissionType({
    kind: "math",
    label: "Math problems",
    create: (config, context) =>
      new MathMissionSession(config as MathMissionConfig, context),
    Component: MathMission,
  });
}

// Auto-register on import so app entry only needs to import the missions barrel.
registerBuiltinMissions();
