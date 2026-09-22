import dagre from "@dagrejs/dagre";
import type { FlowDefinition, FlowEdgeDef, FlowNodeDef } from "../../../content/docs/flows/types";

export const FLOW_NODE_WIDTH = 240;
export const FLOW_NODE_MIN_HEIGHT = 88;
const APPROX_DESCRIPTION_CHARS_PER_LINE = 30;
const APPROX_LABEL_CHARS_PER_LINE = 24;
const LABEL_LINE_HEIGHT = 18;
const DESCRIPTION_LINE_HEIGHT = 16;
const VERTICAL_PADDING = 24;

/**
 * Nodes are not fixed-height. Dagre still needs a height before React renders,
 * so estimate one from the documented content. The rendered card uses this as
 * a minimum only and may grow naturally when text wraps more than estimated.
 */
export function getFlowNodeHeight(node: FlowNodeDef): number {
  const labelLines = Math.max(1, Math.ceil(node.label.length / APPROX_LABEL_CHARS_PER_LINE));
  const descriptionLines = node.description
    ? Math.max(1, Math.ceil(node.description.length / APPROX_DESCRIPTION_CHARS_PER_LINE))
    : 0;

  return Math.max(
    FLOW_NODE_MIN_HEIGHT,
    VERTICAL_PADDING + labelLines * LABEL_LINE_HEIGHT + descriptionLines * DESCRIPTION_LINE_HEIGHT,
  );
}

export type LaidOutNode = FlowNodeDef & {
  position: { x: number; y: number };
  layoutHeight: number;
};
export type LaidOutFlow = { nodes: LaidOutNode[]; edges: FlowEdgeDef[] };

/**
 * Deterministic layered layout for a flow's node/edge graph. Pure function:
 * the same FlowDefinition always produces the same coordinates. Never lays
 * out anything the content model doesn't already describe — no node/edge is
 * added, dropped, or reordered, only annotated with a position.
 */
export function computeFlowLayout(definition: FlowDefinition): LaidOutFlow {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  // Extra separation is intentional. These diagrams are documentation first,
  // so branches and edge labels need enough room to remain readable and avoid
  // passing visually through adjacent cards.
  g.setGraph({ rankdir: "TB", nodesep: 96, ranksep: 104, edgesep: 48 });
  g.setDefaultEdgeLabel(() => ({}));

  const heights = new Map<string, number>();
  for (const node of definition.nodes) {
    const height = getFlowNodeHeight(node);
    heights.set(node.id, height);
    g.setNode(node.id, { width: FLOW_NODE_WIDTH, height });
  }

  // `name` (edge.id) keeps parallel edges between the same two nodes distinct
  // (e.g. resume flow's Text/Call edges both target Resume Code).
  for (const edge of definition.edges) {
    g.setEdge(edge.source, edge.target, {}, edge.id);
  }

  dagre.layout(g);

  const nodes: LaidOutNode[] = definition.nodes.map((node) => {
    const laidOut = g.node(node.id);
    const layoutHeight = heights.get(node.id) ?? FLOW_NODE_MIN_HEIGHT;
    return {
      ...node,
      layoutHeight,
      position: {
        x: laidOut.x - FLOW_NODE_WIDTH / 2,
        y: laidOut.y - layoutHeight / 2,
      },
    };
  });

  return { nodes, edges: definition.edges };
}
