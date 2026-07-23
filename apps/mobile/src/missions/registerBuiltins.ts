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
import { PhotoObjectMission } from "./photoObject/PhotoObjectMission";
import {
  ComponentBackedMission,
  registerMissionType,
  type MissionComponent,
  type MissionContext,
} from "./missionFramework";

registerMissionType({
  kind: "math",
  label: "Math problems",
  create: (_config: MissionConfig, context: MissionContext) =>
    new ComponentBackedMission(context),
  // MathMission accepts MathMissionConfig; cast keeps the registry generic.
  Component: MathMission as unknown as MissionComponent,
});

/**
 * Photo-object mission.
 * Registration (setup photo + ML Kit labels) is fully wired.
 * Wake-time capture/match is intentionally deferred — Component is a stub.
 */
registerMissionType({
  kind: "photo_object",
  label: "Photo object",
  create: (_config: MissionConfig, context: MissionContext) =>
    new ComponentBackedMission(context),
  Component: PhotoObjectMission as unknown as MissionComponent,
});
