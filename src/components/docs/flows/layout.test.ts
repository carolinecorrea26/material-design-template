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
