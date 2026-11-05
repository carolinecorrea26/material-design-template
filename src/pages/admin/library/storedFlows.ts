import type { FlowDefinition } from "../../../domain/flows";
import { resolveEffectiveSite } from "../../../domain/effectiveSite";
import { resolvePageCatalog } from "../../../domain/pageCatalog";
import { getSiteDetailsPageLabel } from "../../../config/resolvers/resolveClientPages";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";

/** The saved diagrams retain their topology; page names and availability use
 * the same catalog and Site assignments as the applicant router. */
export function storedFlowRows(catalog: LibraryCatalog, siteKey: string) {
  const data = catalog.data;
  const pages = resolvePageCatalog(data, siteKey === "all" ? undefined : siteKey);
  const globalAssignments = data.siteFlows.filter(row => row.scope === "global").sort((a, b) => a.position - b.position);
  const assignments = siteKey === "all" ? globalAssignments : resolveEffectiveSite(data, siteKey).configuration.flows.map(flow => {
    const assignment = data.siteFlows.find(row => row.key === flow.provenance[0].key);
    if (!assignment) throw new Error(`Missing saved flow assignment: ${flow.key}`);
    return assignment;
  });
  return [...assignments].sort((a, b) => {
    const position = (id: string) => globalAssignments.find(row => row.flowId === id)?.position ?? data.flows.length;
    return position(a.flowId) - position(b.flowId) || a.position - b.position;
  }).map(assignment => {
    const flow = data.flows.find(row => row.key === assignment.flowKey);
    if (!flow) throw new Error(`Missing saved flow: ${assignment.flowKey}`);
    const steps = data.flowSteps.filter(row => row.flowKey === flow.key).sort((a, b) => a.position - b.position);
    const definition: FlowDefinition = {
      ...flow.definition,
      nodes: steps.map(({ definition: node }) => {
        if (node.pageGroupId) {
          const names = pages.filter(page => page.enabled && page.definition.groupId === node.pageGroupId).map(page => getSiteDetailsPageLabel(page.definition.id));
          return { ...node, description: names.length ? `Available pages: ${names.join(", ")}. Shown according to selected coverage and routing.` : "No pages in this group are enabled on this Site." };
        }
        if (!node.pageId) return node;
        const page = pages.find(page => page.key === node.pageId);
        return { ...node, label: getSiteDetailsPageLabel(page?.definition.id ?? node.pageId),
          description: [node.description, !page ? "Page is not in the saved catalog." : !page.enabled ? "Disabled on this Site." : null].filter(Boolean).join(" ") };
      }),
      edges: data.flowTransitions.filter(row => row.flowKey === flow.key).sort((a, b) => a.position - b.position).map(edge => {
        const source = steps.find(step => step.key === edge.sourceStepKey);
        const target = steps.find(step => step.key === edge.targetStepKey);
        if (!source || !target) throw new Error(`Missing saved flow endpoint: ${edge.key}`);
        return { ...edge.definition, source: source.definition.id, target: target.definition.id };
      }),
    };
    return { key: flow.key, definition, status: assignment.scope === "global" ? "inherited" : "overridden" };
  });
}
