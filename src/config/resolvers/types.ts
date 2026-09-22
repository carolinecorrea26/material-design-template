/**
 * Shared Global → Override → Effective resolution vocabulary.
 * See src/docs/GlobalOverrideEffectiveArchitecture.md for the model this implements.
 */
export type ResolutionStatus =
  | "inherited"
  | "overridden"
  | "disabled"
  | "client-specific";
