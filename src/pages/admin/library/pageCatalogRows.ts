import { getPhoneTypeFieldId } from "../../../domain/phoneFields";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { resolvePageCatalog } from "../../../domain/pageCatalog";
import { fieldSurfaceRows, type FieldSurfaceRow } from "./fieldSurfaceRows";
import { fieldDisplayName } from "./fieldCatalogRows";
import { resolveEffectiveSite } from "../../../domain/effectiveSite";
import { resolveStoredFieldCollections, type ResolvedFieldCollection } from "../../../domain/fieldCollections";
import { groupPageFields, pageModalFields } from "./pageFieldGroups";

/** Section placements own reading order, rather than the order in which
 * inspection discovers field definitions. Inline follow-ups stay with their
 * question and nested phone selectors stay with their phone input. */
function orderedPageFieldKeys(catalog: LibraryCatalog, pageKey: string, usages: FieldSurfaceRow[], collections: Record<string, ResolvedFieldCollection>) {
  const sections = catalog.data.pageSections.filter(section => section.pageKey === pageKey).sort((a, b) => a.position - b.position);
  const rank = new Map<string, number>();
  for (const usage of usages) {
    const key = usage.definitionKey ?? usage.field.id;
    if (!rank.has(key)) rank.set(key, usage.position ?? rank.size);
  }
  const children = new Map<string, string[]>();
  const attach = (parent: string, keys: string[]) => {
    if (!rank.has(parent)) return;
    children.set(parent, [...new Set([...(children.get(parent) ?? []), ...keys.filter(key => key !== parent && rank.has(key))])]);
  };
  for (const section of sections) {
    const placements = catalog.data.pageSectionFields.filter(field => field.sectionKey === section.key).sort((a, b) => a.position - b.position);
    for (const placement of placements) if (rank.has(placement.fieldKey)) rank.set(placement.fieldKey, section.position * 10000 + placement.position);
    const definition = section.definition;
    if (!definition.title && !definition.description && !definition.collectionName && definition.visibilityConditionId) {
      const condition = catalog.data.conditions.find(row => row.key === definition.visibilityConditionId)?.definition;
      const parents = [...new Set(condition?.conditions.map(clause => clause.fieldId))].filter(key => rank.has(key));
      if (parents.length === 1) attach(parents[0], placements.map(field => field.fieldKey));
    }
  }
  for (const usage of usages) if (usage.field.format === "phone" && usage.field.showPhoneTypeSelector !== false) {
    attach(usage.definitionKey ?? usage.field.id, [getPhoneTypeFieldId(usage.field)]);
  }
  for (const collection of Object.values(collections)) {
    const parent = collection.libraryGroup?.afterFieldKey;
    if (parent && collection.pageKey === pageKey) attach(parent, collection.mapping.fields.map(field => field.id));
  }
  const nested = new Set([...children.values()].flat());
  const ordered: string[] = [];
  const seen = new Set<string>();
  const visit = (key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(key);
    children.get(key)?.forEach(visit);
  };
  const keys = [...rank.keys()].sort((a, b) => rank.get(a)! - rank.get(b)!);
  keys.filter(key => !nested.has(key)).forEach(visit);
  keys.forEach(visit);
  return ordered;
}

/** Include configured disabled pages for inspection without enabling them. */
export function pageCatalogRows(catalog: LibraryCatalog, siteKey: string, fieldUsages?: FieldSurfaceRow[]) {
  if (siteKey !== "all" && !catalog.data.sites.some(site => site.key === siteKey)) return [];
  const usages = fieldUsages ?? fieldSurfaceRows(catalog, siteKey);
  const definitions = new Set(catalog.data.fields.map(field => field.key));
  const collections = siteKey === "all" ? {} : resolveStoredFieldCollections(catalog.data, resolveEffectiveSite(catalog.data, siteKey));
  const modals = pageModalFields(catalog, siteKey);
  return resolvePageCatalog(catalog.data, siteKey === "all" ? undefined : siteKey)
    .filter(page => page.definition.flow !== "internal" && page.assigned)
    .map(page => {
      const fields = orderedPageFieldKeys(catalog, page.key, usages.filter(usage => usage.pages.includes(page.key) && !usage.tool
        && (!page.definition.inlineFieldKeys || page.definition.inlineFieldKeys.includes(usage.field.id)))
        .filter(usage => definitions.has(usage.definitionKey ?? usage.field.id)), collections).map(key => ({ key, name: fieldDisplayName(key, catalog) }));
      return { ...page, name: page.definition.displayName ?? page.key, flow: page.definition.flow,
      requirement: page.requirement ?? "—",
      fields, fieldGroups: groupPageFields(catalog, page.key, usages, fields.map(field => field.key), modals),
    }; });
}

/** Shared fields appear once, at their first position in the Pages table.
 * Definitions used only in tools or without a page remain at the end. */
export function orderFieldsByPages<T extends { key: string }>(fields: T[], pages: Pick<ReturnType<typeof pageCatalogRows>[number], "fields">[]) {
  const order = new Map([...new Set(pages.flatMap(page => page.fields.map(field => field.key)))].map((key, index) => [key, index]));
  return [...fields].sort((a, b) => (order.get(a.key) ?? order.size) - (order.get(b.key) ?? order.size));
}
