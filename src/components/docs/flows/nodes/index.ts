import type { NodeTypes } from "@xyflow/react";
import PageFlowNode from "./PageFlowNode";
import DecisionFlowNode from "./DecisionFlowNode";
import ActionFlowNode from "./ActionFlowNode";
import StartEndFlowNode from "./StartEndFlowNode";
import SummaryFlowNode from "./SummaryFlowNode";
import ExternalFlowNode from "./ExternalFlowNode";
import type { FlowNodeKind } from "../../../../content/docs/flows/types";

// Keys must exactly match FlowNodeKind — this is what maps a FlowNodeDef's
// `kind` (set as the React Flow node's `type`) to the component that renders it.
export const flowNodeTypes: NodeTypes = {
  page: PageFlowNode,
  decision: DecisionFlowNode,
  action: ActionFlowNode,
  start: StartEndFlowNode,
  end: StartEndFlowNode,
  summary: SummaryFlowNode,
  external: ExternalFlowNode,
} satisfies Record<FlowNodeKind, NodeTypes[string]>;
