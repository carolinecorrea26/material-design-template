import { beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "../../../migration/fixtures";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { storedFlowRows } from "./storedFlows";

let catalog: LibraryCatalog;
beforeAll(() => { catalog = { data: createReviewedMigrationDatabase(), revision: "test", analyticsTags: [] }; }, 120000);

it("reads saved diagrams, preserves every node and edge, and resolves Site health pages", () => {
  const original = JSON.stringify(catalog);
  const flows = storedFlowRows(catalog, "abe");
  expect(flows.map(row => row.definition.id)).toEqual(["consumer", "advisor", "resume", "autosave", "quote", "tpaVerification"]);
  for (const flow of flows) {
    const nodes = catalog.data.flowSteps.filter(row => row.flowKey === flow.key).sort((a, b) => a.position - b.position);
    const edges = catalog.data.flowTransitions.filter(row => row.flowKey === flow.key).sort((a, b) => a.position - b.position);
    expect(flow.definition.nodes.map(node => node.id)).toEqual(nodes.map(row => row.definition.id));
    expect(flow.definition.edges).toEqual(edges.map(row => row.definition));
  }
  const summary = flows.find(row => row.definition.id === "advisor")!.definition.nodes.find(node => node.pageGroupId === "health")!;
  expect(summary.label).toBe("Health Routing");
  expect(summary.description).toContain("Health LI, Health QD, Health DI, Health CI");
  expect(summary.description).not.toContain("Health CIR");
  expect(summary.description).not.toContain("Health SI");
  expect(storedFlowRows(catalog, "all").find(row => row.definition.id === "advisor")!.definition.nodes.find(node => node.pageGroupId === "health")!.description).toContain("Health SI");
  expect(JSON.stringify(catalog)).toBe(original);
});

it("follows saved copy, branch labels, overrides and availability without importing authored diagrams", () => {
  const changed = structuredClone(catalog);
  const advisor = changed.data.flows.find(row => row.definition.id === "advisor")!;
  advisor.definition.title = "Saved advisor journey";
  const edge = changed.data.flowTransitions.find(row => row.flowKey === advisor.key && row.definition.condition)!;
  edge.definition.condition = "Saved branch";
  changed.data.sitePages.find(row => row.siteKey === "abe" && row.pageKey === "health-ci")!.requirement = "none";
  changed.data.sitePages.find(row => row.siteKey === "abe" && row.pageKey === "contact")!.requirement = "none";
  const flow = storedFlowRows(changed, "abe").find(row => row.key === advisor.key)!.definition;
  expect(flow.title).toBe("Saved advisor journey");
  expect(flow.edges.find(row => row.id === edge.definition.id)?.condition).toBe("Saved branch");
  expect(flow.nodes.find(row => row.pageGroupId === "health")?.description).not.toContain("Health CI,");
  expect(flow.nodes.find(row => row.pageId === "contact")?.description).toContain("Disabled on this Site");
  expect(storedFlowRows(changed, "waepa").find(row => row.definition.id === "tpaVerification")!.key).toBe("client:waepa.tpaVerification");
});
