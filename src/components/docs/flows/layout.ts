import dagre from '@dagrejs/dagre';
import type { FlowDefinition, FlowEdgeDef, FlowNodeDef } from '../../../content/docs/flows/types';
import { createRouter, inflate, placeLabel, type Point, type Rect } from './routing';

export const FLOW_NODE_WIDTH = 240;
export const FLOW_NODE_MIN_HEIGHT = 64;
export type Size = { width: number; height: number };
export type FlowMeasurements = { nodes?: Record<string, Size>; labels?: Record<string, Size> };
export function getFlowNodeHeight(node: FlowNodeDef): number {
  return Math.max(FLOW_NODE_MIN_HEIGHT, 28 + Math.ceil(node.label.length / 23) * 19);
}
export type LaidOutNode = FlowNodeDef & { position: Point; layoutHeight: number };
export type LaidOutFlow = { nodes: LaidOutNode[]; edges: FlowEdgeDef[]; edgeRoutes: Record<string, Point[]>; edgeLabels: Record<string, Rect>; bounds: Rect };

/** Topology stays in JSON. Browser measurements replace estimates as fonts and
 * content settle; node and label rectangles are reserved before routing. */
export function computeFlowLayout(definition: FlowDefinition, measurements: FlowMeasurements = {}): LaidOutFlow {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: 'TB', nodesep: 96, ranksep: 80, edgesep: 40 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const node of definition.nodes) g.setNode(node.id, { width: FLOW_NODE_WIDTH, height: measurements.nodes?.[node.id]?.height ?? getFlowNodeHeight(node) });
  const labelSizes = new Map<string, Size>();
  for (const edge of definition.edges) {
    const size = edge.condition ? measurements.labels?.[edge.id] ?? { width: 180, height: 14 + Math.ceil(edge.condition.length / 23) * 18 } : { width: 0, height: 0 };
    labelSizes.set(edge.id, size);
    g.setEdge(edge.source, edge.target, { ...size, labelpos: 'r', labeloffset: 18 }, edge.id);
  }
  dagre.layout(g);
  const nodes = definition.nodes.map(node => {
    const placed = g.node(node.id);
    return { ...node, position: { x: placed.x - FLOW_NODE_WIDTH / 2, y: placed.y - placed.height / 2 }, layoutHeight: placed.height };
  });
  const boxes = nodes.map(node => ({ ...node.position, width: FLOW_NODE_WIDTH, height: node.layoutHeight }));
  const edgeLabels: Record<string, Rect> = {};
  const occupied = [...boxes];
  for (const edge of definition.edges) if (edge.condition) {
    const placed = g.edge({ v: edge.source, w: edge.target, name: edge.id }), size = labelSizes.get(edge.id)!;
    const label = placeLabel({ x: placed.x - size.width / 2, y: placed.y - size.height / 2, ...size }, occupied);
    edgeLabels[edge.id] = label; occupied.push(label);
  }
  const ports = Object.fromEntries(nodes.map(node => [node.id, {
    bottom: { x: node.position.x + FLOW_NODE_WIDTH / 2, y: node.position.y + node.layoutHeight },
    exit: { x: node.position.x + FLOW_NODE_WIDTH / 2, y: node.position.y + node.layoutHeight + 16 },
    entrance: { x: node.position.x + FLOW_NODE_WIDTH / 2, y: node.position.y - 16 },
    top: { x: node.position.x + FLOW_NODE_WIDTH / 2, y: node.position.y },
  }]));
  const labelPorts = Object.fromEntries(Object.entries(edgeLabels).map(([id, r]) => [id, { x: r.x - 10, y: r.y + r.height / 2 }]));
  const route = createRouter([...boxes.map(r => inflate(r, 12)), ...Object.values(edgeLabels).map(r => inflate(r, 4))], [...Object.values(ports).flatMap(p => [p.exit, p.entrance]), ...Object.values(labelPorts)]);
  const edgeRoutes = Object.fromEntries(definition.edges.map(edge => {
    const a = ports[edge.source], b = ports[edge.target], label = labelPorts[edge.id];
    const points = label ? [...route(a.exit, label), ...route(label, b.entrance).slice(1)] : route(a.exit, b.entrance);
    return [edge.id, [a.bottom, ...points, b.top]];
  }));
  const minX = Math.min(...occupied.map(r => r.x)) - 24, minY = Math.min(...occupied.map(r => r.y)) - 24;
  return { nodes, edges: definition.edges, edgeRoutes, edgeLabels, bounds: { x: minX, y: minY, width: Math.max(...occupied.map(r => r.x + r.width)) - minX + 24, height: Math.max(...occupied.map(r => r.y + r.height)) - minY + 24 } };
}
