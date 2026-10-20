import type { FlowDefinition, FlowNodeDef, FlowEdgeDef } from "../../domain/flows";
import type { LibraryRow } from "./catalog";

export type FlowRow = LibraryRow<Pick<FlowDefinition, "id" | "title" | "intro">>;
export interface FlowStepRow extends LibraryRow<FlowNodeDef> { flowKey: string }
export interface FlowTransitionRow extends LibraryRow<FlowEdgeDef> { flowKey: string; sourceStepKey: string; targetStepKey: string }
