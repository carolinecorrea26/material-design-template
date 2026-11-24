import type { FlowDefinition, FlowNodeDef, FlowEdgeDef } from './flows';
export type FlowStage = { id: string; label: string; nodes: FlowNodeDef[]; actor?: string; related: boolean; branchDetailsNodeIds: string[]; branchDetailsEdgeIds: string[] };
export function flowStages(flow: FlowDefinition, content?: Record<string, unknown>): FlowStage[];
export function flowStageDetail(flow: FlowDefinition, stageId: string, content?: Record<string, unknown>): {
  stage: FlowStage;
  detailEdges: FlowEdgeDef[];
  exits: { nodeId: string; stageId: string; stageLabel: string }[];
  definition: FlowDefinition;
};
