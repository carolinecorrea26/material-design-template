import type { Node, NodeProps } from "@xyflow/react";
import type { FlowNodeDef } from "../../../../content/docs/flows/types";

export type FlowRFNodeData = FlowNodeDef & { onInspect?: () => void; onMeasure?: (size: import("../layout").Size) => void; active?: boolean } & Record<string, unknown>;
export type FlowRFNode = Node<FlowRFNodeData>;
export type FlowNodeComponentProps = NodeProps<FlowRFNode>;
