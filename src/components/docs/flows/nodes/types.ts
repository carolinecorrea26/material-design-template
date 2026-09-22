import type { Node, NodeProps } from "@xyflow/react";
import type { FlowNodeDef } from "../../../../content/docs/flows/types";

export type FlowRFNodeData = FlowNodeDef & Record<string, unknown>;
export type FlowRFNode = Node<FlowRFNodeData>;
export type FlowNodeComponentProps = NodeProps<FlowRFNode>;
