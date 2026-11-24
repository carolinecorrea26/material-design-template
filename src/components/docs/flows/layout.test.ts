import { describe, expect, it } from "vitest";
import { computeFlowLayout } from "./layout";
import { allFlows } from "../../../content/docs/flows";

describe.each(allFlows)("$id flow layout", (flow) => {
  it("is deterministic across repeated calls", () => {
    const first = computeFlowLayout(flow);
    const second = computeFlowLayout(flow);
    expect(second.nodes.map((n) => ({ id: n.id, position: n.position }))).toEqual(
      first.nodes.map((n) => ({ id: n.id, position: n.position })),
    );
  });

  it("preserves every input node with a computed position, nothing dropped or added", () => {
    const { nodes } = computeFlowLayout(flow);
    expect(nodes.map((n) => n.id).sort()).toEqual(flow.nodes.map((n) => n.id).sort());
    for (const node of nodes) {
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    }
  });

  it("preserves every input edge unchanged", () => {
    const { edges } = computeFlowLayout(flow);
    expect(edges).toEqual(flow.edges);
  });

  it("does not place two nodes at the exact same coordinates", () => {
    const { nodes } = computeFlowLayout(flow);
    const seen = new Set<string>();
    for (const node of nodes) {
      const key = `${node.position.x},${node.position.y}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

it("advisor edge routes avoid unrelated cards, including cancel loops", () => {
  const flow = allFlows.find(flow => flow.id === "advisor")!;
  const { nodes, edgeRoutes } = computeFlowLayout(flow);
  for (const edge of flow.edges) {
    const points = edgeRoutes[edge.id];
    expect(points.length).toBeGreaterThan(1);
    for (const node of nodes.filter(node => node.id !== edge.source && node.id !== edge.target)) {
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        let start = 0, end = 1;
        for (const [origin, delta, min, max] of [
          [a.x, b.x - a.x, node.position.x + 1, node.position.x + 239],
          [a.y, b.y - a.y, node.position.y + 1, node.position.y + node.layoutHeight - 1],
        ]) {
          if (delta === 0) { if (origin < min || origin > max) end = -1; }
          else { const t1 = (min - origin) / delta, t2 = (max - origin) / delta; start = Math.max(start, Math.min(t1, t2)); end = Math.min(end, Math.max(t1, t2)); }
        }
        expect(start <= end, `${edge.id} crosses ${node.id}`).toBe(false);
      }
    }
  }
});

import { intersects, segmentCrossesRect } from './routing';
import { FLOW_NODE_WIDTH } from './layout';

function assertClear(flow: typeof allFlows[number], measured = false) {
  const sizes = measured ? { nodes: Object.fromEntries(flow.nodes.map((node, i) => [node.id, { width: FLOW_NODE_WIDTH, height: 70 + i % 4 * 35 }])), labels: Object.fromEntries(flow.edges.filter(edge => edge.condition).map((edge, i) => [edge.id, { width: 180, height: 45 + i % 3 * 24 }])) } : {};
  const layout = computeFlowLayout(flow, sizes);
  const boxes = layout.nodes.map(node => ({ ...node.position, width: FLOW_NODE_WIDTH, height: node.layoutHeight }));
  const labels = Object.values(layout.edgeLabels);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(intersects(boxes[i], boxes[j]), `${flow.id}: nodes overlap`).toBe(false);
  for (let i = 0; i < labels.length; i++) {
    for (const box of boxes) expect(intersects(labels[i], box), `${flow.id}: label covers node`).toBe(false);
    for (let j = i + 1; j < labels.length; j++) expect(intersects(labels[i], labels[j]), `${flow.id}: labels overlap`).toBe(false);
  }
  for (const edge of flow.edges) {
    const points = layout.edgeRoutes[edge.id];
    for (let i = 1; i < points.length; i++) for (const box of [...boxes, ...labels]) expect(segmentCrossesRect(points[i - 1], points[i], box), `${flow.id}: ${edge.id} crosses content`).toBe(false);
  }
}
for (const flow of allFlows) it(`${flow.id}: routes around every node and label before and after browser remeasurement`, () => { assertClear(flow); assertClear(flow, true); });
it('preserves branching with long labels, unbroken titles, parallel transitions and return loops', () => {
  const source = allFlows.find(flow => flow.id === 'advisor')!;
  const flow = { ...source, nodes: source.nodes.map(node => ({ ...node, label: node.label.repeat(5) })), edges: source.edges.map(edge => ({ ...edge, condition: `${edge.condition ?? 'Continue'} — a long branch explanation that must wrap without obscuring another branch` })) };
  assertClear(flow, true);
});
