/**
 * Missions public API.
 * Importing this module also registers built-in mission types.
 */

import "./registerBuiltins";

export { MathMission } from "./math/MathMission";
export { generateMathProblem } from "./math/generator";
export { PhotoObjectMission } from "./photoObject/PhotoObjectMission";
export { PhotoObjectRegistration } from "./photoObject/PhotoObjectRegistration";
export {
  applyCaptureToMission,
  buildPhotoObjectMissionConfig,
  captureTargetObject,
  isMlKitAvailable,
  labelTargetImage,
  normalizeLabels,
} from "./photoObject/labelService";
export type { LabelCaptureResult } from "./photoObject/fingerprint";
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
