import { freshStartSource } from '../../../domain/freshStartCatalog';
import { compileRequirementCatalog, type RequirementCatalogSource } from '../../../domain/requirementCatalog.mjs';
import type { FlowDefinition } from "../../../domain/flows";
import { resolveCompiledEffectiveSite } from "../../../domain/effectiveSite";
import { resolvePageCatalog } from "../../../domain/pageCatalog";
import { getSiteDetailsPageLabel } from "../../../config/resolvers/resolveClientPages";
import { compileLibraryCatalog, type LibraryCatalog } from "../../../services/libraryCatalogService";
import { flowDefinition } from '../../../domain/flowDefinitions.mjs';

/** Authored graphs replace captured topology; Site assignments supply values and availability. */
export function storedFlowRows(catalog: LibraryCatalog, siteKey: string, sourceOverride?: RequirementCatalogSource) {
  const source = sourceOverride ?? freshStartSource();
  const data = sourceOverride ? compileRequirementCatalog(catalog.data, sourceOverride, undefined, catalog.siteScope) : compileLibraryCatalog(catalog, 'all').data;
  const pages = resolvePageCatalog(data, siteKey === "all" ? undefined : siteKey);
  const globalAssignments = data.siteFlows.filter(row => row.scope === "global").sort((a, b) => a.position - b.position);
  const effective = siteKey === 'all' ? undefined : resolveCompiledEffectiveSite(data, siteKey);
  const assignments = !effective ? globalAssignments : effective.configuration.flows.map(flow => {
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
    const authored = flowDefinition(data, flow.key);
    const definition: FlowDefinition = {
      ...authored,
      nodes: authored.nodes.map(node => {
        if (node.pageGroupId) {
          const names = pages.filter(page => page.enabled && page.definition.groupId === node.pageGroupId).map(page => getSiteDetailsPageLabel(page.definition.id));
          return { ...node, description: names.length ? `${node.description ?? ""} Available pages: ${names.join(", ")}. Shown according to selected coverage and routing.` : "No pages in this group are enabled on this Site." };
        }
        if (!node.pageId) return node;
        const page = pages.find(page => page.key === node.pageId);
        return { ...node,
          description: [node.description, !page ? "Page is not in the saved catalog." : !page.enabled ? "Disabled on this Site." : null].filter(Boolean).join(" ") };
      }),
    };
    const settings = [...new Set(definition.nodes.flatMap(node => node.configurationPaths ?? []))].map(key => {
      const record = data.configurationDefinitions.find(row => row.definition.path?.join('.') === key);
      if (!record) throw new Error(`Missing flow configuration: ${key}`);
      const value = effective ? effective.configuration.configurations.find(row => row.key === record.key)?.value : data.configurationValues.find(row => row.configurationKey === record.key && row.scope === 'global')?.value;
      return { key, value };
    });
    const stageContent = { ...source.content, ...Object.fromEntries((effective?.configuration.content ?? []).map(row => [row.key, row.value])) };
    return { key: flow.key, definition, settings, stageContent, status: assignment.scope === "global" ? "inherited" : "overridden" };
  });
}
