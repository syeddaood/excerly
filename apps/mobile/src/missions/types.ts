/**
 * Shared mission UI props.
 * Concrete mission components receive these plus their typed config.
 */
export type MissionProps = {
  /** Called when the mission is fully completed. */
  onComplete: () => void;
  /** Optional per-attempt result (success / failure). */
  onResult?: (success: boolean) => void;
};

export type MissionDefinition = {
  kind: string;
  label: string;
};
