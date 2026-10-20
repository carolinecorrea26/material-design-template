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
