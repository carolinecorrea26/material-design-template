import { withRequirementPageFields } from "../../../domain/requirementFields";
import { resolveStoredFieldSurfaces } from "../../../domain/fieldSurfaces";
import { resolveStoredFieldCollections } from "../../../domain/fieldCollections";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { resolveEffectiveSite } from "../../../domain/effectiveSite";
import { isApplicantExperience } from "../../../domain/applicantExperience";
import type { SnapshotTable } from "../../../persistence/snapshot";
import { resolvePageCatalog } from "../../../domain/pageCatalog";

export const storedDomains: Record<string, Array<[SnapshotTable, string]>> = {
  pages: [["pages", "Pages"], ["pageSections", "Sections"]],
  fields: [["fields", "Fields"]],
  validation: [["validationRules", "Validation"]],
  coverage: [["coverageCategories", "Categories"], ["products", "Products"], ["riders", "Riders"], ["productAmountRules", "Amounts"], ["underwritingBands", "Underwriting"], ["eligibilityConstraints", "Eligibility"], ["productRiders", "Rider assignments"], ["coverageAmountPatterns", "Amount patterns"], ["productIdentifiers", "Codes"], ["aggregateLimits", "Aggregate limits"], ["benefitPeriodOptions", "Benefit periods"], ["rateTables", "Rate tables"]],
  rules: [["rules", "Rules"], ["conditions", "Conditions"], ["questionSets", "Question sets"], ["questionDefinitions", "Questions"]],
  configurations: [["configurationValues", "Settings"], ["configurationDefinitions", "Definitions"]],
  flows: [["flows", "Flows"], ["flowSteps", "Steps"], ["flowTransitions", "Transitions"]],
  patterns: [["patterns", "Patterns"], ["patternAssignments", "Assignments"]],
  flags: [["flagDefinitions", "Flags"], ["flagAssignments", "Assignments"], ["flagValues", "Values"]],
  features: [["features", "Features"], ["siteFeatures", "Site settings"]],
  content: [["contentValues", "Content"], ["contentEntries", "Definitions"], ["documentDefinitions", "Documents"]],
  communications: [["emailTemplates", "Templates"], ["siteEmailTemplates", "Site settings"]],
  themes: [["brandingProfiles", "Branding"], ["supportProfiles", "Support"]],
  "url-parameters": [["urlParameters", "Parameters"], ["siteUrlParameters", "Site settings"]],
  templates: [["sites", "Site templates"]],
};
export type StoredRow = Record<string, unknown> & { id: string; key?: string };
function orderedPages(catalog: LibraryCatalog, siteKey: string) {
  return resolvePageCatalog(catalog.data, siteKey === "all" ? undefined : siteKey).map((row, index) => ({ ...row, sequence: index + 1 }));
}
/** All Sites shows the catalog; a selected Site shows only its enabled pages. */
export function storedApplicationPageRows(catalog: LibraryCatalog, siteKey: string) {
  if (siteKey !== "all" && !catalog.data.sites.some(site => site.key === siteKey)) return [];
  const labels = { application: "Application", resume: "Resume", advisor: "Advisor", utility: "Utility", internal: "Internal" };
  return resolvePageCatalog(catalog.data, siteKey === "all" ? undefined : siteKey).filter(row => row.definition.flow !== "internal" && (siteKey === "all" || row.enabled)).map(row => ({
    ...row, flow: labels[row.definition.flow],
    route: row.definition.path, requirement: siteKey === "all" || row.definition.flow !== "application" && row.enabled ? "—" : row.requirement ?? "Not configured",
  }));
}
export function storedLibraryRows(catalog: LibraryCatalog, table: SnapshotTable, siteKey: string): StoredRow[] {
  const data = catalog.data;
  const site = data.sites.find(site => site.key === siteKey);
  let rows = data[table] as unknown as StoredRow[];
  if (siteKey === "all") return table === "pages" ? orderedPages(catalog, siteKey) : rows;
  if (!site) return [];
  rows = rows.filter(row => (!row.siteKey || row.siteKey === siteKey) && (!row.siteId || row.siteId === site.id) && (!row.clientKey || row.clientKey === data.clients.find(c => c.id === site.clientId)?.key) && (!row.clientId || row.clientId === site.clientId));
  const resolved = resolveEffectiveSite(data, siteKey);
  const pageKeys = new Set(resolved.configuration.pages.filter(page => page.requirement !== "none" && page.definition?.value.type !== "internal").map(page => page.key));
  const productKeys = new Set(resolved.products.map(product => product.productKey));
  rows = rows.filter(row => !row.productKey || productKeys.has(String(row.productKey)));
  if (table === "coveragePlanDefinitions" || table === "coveragePlanVariants") {
    const planKeys = new Set(data.productCoveragePlans.filter(row => productKeys.has(row.productKey)).map(row => row.planKey));
    return rows.filter(row => planKeys.has(String(table === "coveragePlanDefinitions" ? row.key : row.planKey)));
  }
  if (table === "sites") return rows.filter(row => row.id === site.id);
  if (table === "pages") return orderedPages(catalog, siteKey).filter(row => pageKeys.has(row.key));
  if (table === "pageSections") return rows.filter(row => pageKeys.has(String(row.pageKey)));
  if (table === "validationRules") {
    const fieldKeys = new Set(storedFieldRows(catalog, siteKey).map(field => field.key));
    return rows.filter(row => fieldKeys.has(String(row.fieldKey)));
  }
  const configuredRiders = new Set(resolved.configuration.products.flatMap(p => p.riders.filter(r => r.enabled).map(r => r.key)));
  if (table === "riders") return rows.filter(row => configuredRiders.has(String(row.key)));
  if (table === "productRiders") return rows.filter(row => resolved.configuration.products.some(p => p.productKey === row.productKey && p.riders.some(r => r.enabled && r.key === row.riderKey && r.provenance.some(provenance => provenance.key === row.key))));
  if (table === "coverageCategories") return rows.filter(row => data.products.some(product => product.categoryKey === row.key && productKeys.has(product.key)));
  if (table === "products") return rows.filter(row => resolved.products.some(product => product.productKey === row.key));
  if (table === "rules") return rows.filter(row => resolved.configuration.rules.some(rule => rule.key === row.key));
  if (table === "configurationValues") return rows.filter(row => resolved.configuration.configurations.some(value => value.provenance.at(-1)?.key === row.key));
  return rows;
}
export function childCollection(catalog: LibraryCatalog, siteKey: string) {
  const data = catalog.data;
  const section = data.pageSections.find(row => row.definition.collectionName === "children");
  const resolved = siteKey === "all" ? null : resolveEffectiveSite(data, siteKey);
  const setting = resolved?.configuration.configurations.filter(row => data.configurationDefinitions.find(def => def.key === row.key)?.definition.path?.join(".") === "applicantExperience").at(-1);
  const experience = setting?.value;
  const settings = isApplicantExperience(experience) ? experience.childEligibility : undefined;
  const mode = settings?.mode ?? "details";
  const collection = resolved ? resolveStoredFieldCollections(data, resolved).children : null;
  const fields = collection ? collection.mapping.fields.map(field => ({ key: field.id, definition: field })) : section ? data.pageSectionFields.filter(row => row.sectionKey === section.key).sort((a, b) => a.position - b.position).flatMap(placement => {
    const definition = data.fields.find(field => field.key === placement.fieldKey);
    if (!definition) return [];
    if (resolved && placement.fieldKey === "child-full-time-student" && !data.eligibilityConstraints.some(rule => rule.siteKey === siteKey && rule.applicantTypeKey === "child" && rule.studentMaximumAgeYears !== null)) return [];
    const effective = resolved?.configuration.pages.find(page => page.key === "eligibility")?.fields.find(field => field.key === definition.key);
    if (effective && !effective.included) return [];
    return [{ key: definition.key, definition: effective?.definition ?? definition.definition }];
  }) : [];
  return { section, mode, note: settings?.note, fields, collects: mode === "details", settingKey: setting?.key };
}
export type FieldPlacement = { page: string; section: string; order: number; collection: string };
export type StoredFieldRow = LibraryCatalog["data"]["fields"][number] & StoredRow & { placements: FieldPlacement[] };

/** One field row per page: scoped additions and definitions belong to that page. */
export function storedFieldRows(catalog: LibraryCatalog, siteKey: string): StoredFieldRow[] {
  const data = catalog.data;
  const collection = childCollection(catalog, siteKey);
  const resolved = siteKey === "all" ? null : resolveEffectiveSite(data, siteKey);
  const definitions = new Map(data.fields.map(field => [field.key, field]));
  const result: StoredFieldRow[] = [];
  for (const page of storedLibraryRows(catalog, "pages", siteKey)) {
    const pageKey = String(page.key);
    const savedPage = resolved?.configuration.pages.find(row => row.key === pageKey);
    const effectivePage = savedPage ? { ...savedPage, fields: withRequirementPageFields(pageKey, savedPage.fields, siteKey) } : undefined;
    const sections = data.pageSections.filter(section => section.pageKey === pageKey).sort((a, b) => a.position - b.position);
    const baseFields = data.pageFields.filter(row => row.pageKey === pageKey).sort((a, b) => a.position - b.position);
    const sectionFields = data.pageSectionFields.filter(row => sections.some(section => section.key === row.sectionKey));
    const keys = resolved ? effectivePage!.fields.filter(field => field.included).map(field => field.key) : [...new Set([
      ...baseFields.map(field => field.fieldKey),
      ...sectionFields.map(field => field.fieldKey),
      ...data.siteFieldConfigurations.filter(field => field.pageKey === pageKey && field.include === true).sort((a, b) => a.position - b.position).map(field => field.fieldKey),
    ])];
    if (collection.section?.pageKey === pageKey && collection.collects) {
      for (const field of collection.fields) if (!keys.includes(field.key)) keys.push(field.key);
    }
    for (const [index, key] of keys.entries()) {
      const field = definitions.get(key);
      if (!field) continue;
      const effective = effectivePage?.fields.find(row => row.key === key);
      if (effective && !effective.included) continue;
      const sectionPlacement = sectionFields.find(row => row.fieldKey === key);
      const section = sections.find(row => row.key === sectionPlacement?.sectionKey);
      if (section?.definition.collectionName === "children" && (!collection.collects || !collection.fields.some(field => field.key === key))) continue;
      // Membership renders fields added beyond its base personal/contact inputs
      // in its Membership Information subsection (including AMA physician fields).
      const sectionName = section?.definition.id ?? (pageKey === "membership" && !baseFields.some(row => row.fieldKey === key) ? "membershipInformation" : "Page");
      result.push({ ...field, definition: collection.fields.find(row => pageKey === "eligibility" && row.key === key)?.definition ?? effective?.definition ?? field.definition,
        placements: [{ page: pageKey, section: sectionName, order: sectionPlacement?.position ?? index, collection: section?.definition.collectionName ?? "" }],
      });
    }
  }
  if (resolved) for (const [name, surface] of Object.entries(resolveStoredFieldSurfaces(data, resolved))) {
    if (!resolved.configuration.pages.some(page => page.key === surface.pageKey && page.requirement !== 'none')) continue;
    for (const [order, definition] of surface.mapping.fields.entries()) {
      const field = definitions.get(definition.id)!;
      const existing = result.find(row => row.key === field.key && row.placements.some(placement => placement.page === surface.pageKey));
      if (existing) { existing.definition = definition; continue; }
      result.push({ ...field, definition, placements: [{ page: surface.pageKey, section: name, order, collection: surface.maxItems ? name : '' }] });
    }
  }
  if (!resolved) for (const field of data.fields) {
    if (!result.some(row => row.key === field.key)) result.push({ ...field, placements: [] });
  }
  return result;
}

export function storedPageFieldGroups(catalog: LibraryCatalog, siteKey: string, pageKey: string, fields = storedFieldRows(catalog, siteKey), collection = childCollection(catalog, siteKey)) {
  const sections = catalog.data.pageSections.filter(section => section.pageKey === pageKey).sort((a, b) => a.position - b.position);
  const groups = sections.map(section => ({ key: section.key, section: section.definition.id as string, label: section.definition.title ?? section.definition.description ?? (section.definition.id === "default" ? "Page fields" : section.definition.id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, letter => letter.toUpperCase())), collection: section.definition.collectionName ?? "", fields: [] as StoredFieldRow[], notice: section.definition.collectionName === "children" && !collection.collects ? collection.note ?? "Notice only" : undefined }));
  for (const field of fields) {
    const placement = field.placements.find(row => row.page === pageKey);
    if (!placement) continue;
    let group = groups.find(group => group.section === placement.section);
    if (!group) {
      group = { key: `${pageKey}.${placement.section}`, section: placement.section, label: storedSectionLabel(catalog, field), collection: placement.collection, fields: [], notice: undefined };
      if (placement.section === "Page") groups.unshift(group); else groups.push(group);
    }
    group.fields.push(field);
  }
  return groups.filter(group => group.fields.length || group.notice).map(group => ({ ...group, fields: group.fields.sort((a, b) => a.placements[0].order - b.placements[0].order) }));
}

export function storedFieldVisibility(catalog: LibraryCatalog, field: StoredFieldRow, fields: StoredFieldRow[]): string {
  const placement = field.placements[0];
  const section = catalog.data.pageSections.find(row => row.pageKey === placement?.page && row.definition.id === placement.section);
  const keys = [...new Set([section?.definition.visibilityConditionId, field.definition.visibilityConditionId].filter((key): key is NonNullable<typeof key> => !!key))];
  const descriptions = keys.map(key => {
    const condition = catalog.data.conditions.find(row => row.key === key)?.definition;
    if (!condition) return key;
    return condition.conditions.map(clause => {
      const source = fields.find(row => row.key === clause.fieldId && row.placements.some(row => row.page === placement?.page))?.definition ?? catalog.data.fields.find(row => row.key === clause.fieldId)?.definition;
      const value = Array.isArray(clause.value) ? clause.value.map(value => source?.options?.find(option => option.value === value)?.label ?? String(value)).join(", ") : source?.options?.find(option => option.value === clause.value)?.label ?? String(clause.value);
      return `${source?.label ?? clause.fieldId} ${clause.operator === "equals" ? "is" : clause.operator === "notEquals" ? "is not" : clause.operator === "oneOf" ? "is one of" : "includes"} ${value}`;
    }).join(condition.match === "all" ? "; and " : "; or ");
  });
  if (placement?.collection) descriptions.push(`Repeated for each ${placement.collection === "children" ? "child" : placement.collection}`);
  return descriptions.join("; ") || "When this page is shown";
}

export function storedSectionLabel(catalog: LibraryCatalog, field: StoredFieldRow): string {
  const placement = field.placements[0];
  if (!placement) return "Unassigned";
  if (placement.section === "membershipInformation") return field.key.startsWith("ama-physician-") ? "Physician Information" : field.key === "member-id" ? "Additional Membership Information" : "Membership Information";
  const section = catalog.data.pageSections.find(row => row.pageKey === placement.page && row.definition.id === placement.section)?.definition;
  return section?.title ?? section?.description ?? (placement.section === "default" || placement.section === "Page" ? "Page fields" : placement.section.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, letter => letter.toUpperCase()));
}
