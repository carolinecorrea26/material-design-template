import { getFieldInventory } from "../../../config/fields/inspectionInventory";
import { getApplicableSiteRules } from "../../../content/docs/siteRules";
import { resolveSiteCoverage, resolveSitePages } from "../../../data";
import { getFlowGateDefinition, coverageUnlocksPage } from "../../../config/flowGates";
import { getPageCategory } from "../../../config/resolvers/resolveClientPages";
import { getClientForSite } from "../../../data";
import type { LibraryScope } from "./LibraryScope";
import { libraryRepository } from "../../../repositories/libraryRepository";
import { getSiteDetailsPageOrder } from "../../../config/resolvers/resolveClientPages";
import { conditionDefinitions } from "../../../config/conditions";
import { getConditionVisibilityTargets } from "../../../config/conditions/conditionTargets";
import type { RuleDefinition } from "../../../domain/rules";

export const orderedLibraryPages = getSiteDetailsPageOrder().flatMap(id => {
  const page = libraryRepository.read("pages").find(p => p.id === id);
  return page ? [page] : [];
});
export type LibraryRelation = { domain: string; key: string; filter: string };
/** Only executable condition IDs and their modeled targets establish these links. */
const relationCache = new WeakMap<RuleDefinition, LibraryRelation[]>();
export function ruleRelations(rule: RuleDefinition): LibraryRelation[] {
  const cached = relationCache.get(rule);
  if (cached) return cached;
  const relations: LibraryRelation[] = [];
  for (const id of rule.conditionIds ?? []) {
    for (const clause of conditionDefinitions.find(c => c.id === id)?.conditions ?? []) relations.push({ domain: "fields", key: clause.fieldId, filter: "q" });
    for (const target of getConditionVisibilityTargets(id)) {
      relations.push({ domain: "pages", key: target.pageId, filter: "q" });
      if (target.type === "show-fields") for (const field of target.fieldIds) relations.push({ domain: "fields", key: field, filter: "q" });
    }
  }
  const result = [...new Map(relations.map(r => [`${r.domain}:${r.key}`, r])).values()];
  relationCache.set(rule, result);
  return result;
}
/** Display classification only; runtime execution is untouched. */
export function ruleDisplayType(rule: RuleDefinition) {
  if (rule.conditionIds?.length) return "Visibility / Inclusion";
  const types: Record<string, string> = { "Application flow": "Navigation / Flow", "Progress/navigation": "Navigation / Flow", Validation: "Validation", Persistence: "Persistence", Autosave: "Persistence" };
  return types[rule.area] ?? "Unclassified";
}

/** The source of rule rows is shared by tables and links into them. */
export function getLibraryRules(scope: LibraryScope, siteId: string) {
  return scope === "global"
    ? libraryRepository.read("siteRules")
    : getApplicableSiteRules({ clientId: getClientForSite(siteId)!.id, siteId });
}

/** Canonical fields may have no placement in a particular Site. Do not link to absent rows. */
export function getLibraryFieldIds(scope: LibraryScope, siteId: string): Set<string> {
  return new Set(getFieldInventory(scope,siteId).map(row => row.field.id));
}

/** A Site cannot reach a gated page when none of its enabled products unlock it. */
export function getLibraryPages(scope: LibraryScope, siteId: string) {
  if (scope === "global") return orderedLibraryPages;
  const resolutions = resolveSitePages(siteId);
  const products = resolveSiteCoverage(siteId).filter(row => row.status !== "disabled").map(row => row.effective);
  return orderedLibraryPages.filter(page => !["internal", "advisor"].includes(getPageCategory(page)) && resolutions.find(row => row.id === page.id)?.effective.included && (!getFlowGateDefinition(page.id) || products.some(product => coverageUnlocksPage(page.id, product))));
}
