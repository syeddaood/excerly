/**
 * Missions public API.
 * Importing this module also registers built-in mission types.
 */

import "./registerBuiltins";

export { MathMission } from "./math/MathMission";
export { MathMissionSession } from "./math/MathMissionSession";
export {
  generateMathProblem,
  clampProblemCount,
  isValidDifficulty,
} from "./math/generator";
export type { MathProblem } from "./math/generator";
export type { MissionProps, MissionDefinition } from "./types";

export type {
  Mission,
  MissionContext,
  MissionComponent,
  MissionComponentProps,
  MissionTypeDescriptor,
} from "./missionFramework";

export {
  BaseMission,
  ComponentBackedMission,
  createMission,
  getMissionType,
  listMissionTypes,
  registerMissionType,
  resolveMissionComponent,
} from "./missionFramework";
