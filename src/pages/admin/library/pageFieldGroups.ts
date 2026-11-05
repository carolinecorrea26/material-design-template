import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { resolveEffectiveSite } from "../../../domain/effectiveSite";
import { resolveStoredFieldSurfaces } from "../../../domain/fieldSurfaces";
import { resolveStoredFieldCollections } from "../../../domain/fieldCollections";
import { isHealthQuestionnairePolicy } from "../../../domain/configuredHealthQuestionnaire";
import { fieldDisplayName } from "./fieldCatalogRows";
import type { FieldSurfaceRow } from "./fieldSurfaceRows";

type ModalFields = { pageKey: string; label: string; keys: Set<string>; applicant?: "self" | "spouse" };
export type PageFieldGroup = { label: string; fields: { key: string; name: string; definitionKey?: string }[] };

/** The renderer's saved bindings identify modal inputs; launching a modal
 * from a page does not turn those inputs into inline page controls. */
export function pageModalFields(catalog: LibraryCatalog, siteKey: string): ModalFields[] {
  const result: ModalFields[] = [];
  const sites = siteKey === "all" ? catalog.data.sites.map(site => site.key) : [siteKey];
  for (const site of sites) {
    const effective = resolveEffectiveSite(catalog.data, site);
    const surfaces = resolveStoredFieldSurfaces(catalog.data, effective);
    for (const surface of Object.values(surfaces)) {
      const group = surface.libraryGroup;
      if (!group) continue;
      const fields = surface.mapping.fields.filter(field => !group.excludeFieldKeys?.includes(field.id));
      result.push({ pageKey: surface.pageKey, label: group.label, keys: new Set(fields.map(field => field.id)) });
    }
    for (const collection of Object.values(resolveStoredFieldCollections(catalog.data, effective))) {
      const group = collection.libraryGroup;
      if (!group) continue;
      result.push({ pageKey: collection.pageKey, label: group.label, applicant: group.applicant, keys: new Set(collection.mapping.fields.map(field => field.id)) });
    }
    for (const policy of effective.configuration.healthQuestionnairePolicies) {
      if (!isHealthQuestionnairePolicy(policy.value) || !policy.value.detailsGroupLabel) continue;
      result.push({ pageKey: policy.value.pageId, label: policy.value.detailsGroupLabel,
        keys: new Set(policy.value.variants.flatMap(variant => variant.items.filter(item => item.repeated).flatMap(item => item.fieldKeys))) });
    }
  }
  return result;
}

export function groupPageFields(catalog: LibraryCatalog, pageKey: string, usages: FieldSurfaceRow[], orderedKeys: string[], modals: ModalFields[]): PageFieldGroup[] {
  const definitions = new Set(catalog.data.fields.map(field => field.key));
  const order = new Map(orderedKeys.map((key, index) => [key, index]));
  const inlineKeys = catalog.data.pages.find(page => page.key === pageKey)?.definition.inlineFieldKeys;
  const pageUsages = usages.filter(usage => usage.pages.includes(pageKey)
    && (usage.tool || !inlineKeys || inlineKeys.includes(usage.field.id)));
  pageUsages.sort((a, b) => Number(!!a.tool) - Number(!!b.tool)
    || (order.get(a.definitionKey ?? a.field.id) ?? order.size) - (order.get(b.definitionKey ?? b.field.id) ?? order.size)
    || (a.order ?? 0) - (b.order ?? 0));
  const groups = new Map<string, PageFieldGroup>();
  for (const usage of pageUsages) {
    const key = usage.definitionKey ?? usage.field.id;
    const modal = modals.find(candidate => candidate.pageKey === pageKey && candidate.keys.has(key)
      && (!candidate.applicant || usage.field.id.startsWith(`${candidate.applicant}-`)));
    const label = usage.tool ? `${usage.container ?? usage.surface} ${usage.presentation === "drawer" ? "drawer" : "(on page)"}`
      : modal?.label ?? "On page";
    const group = groups.get(label) ?? { label, fields: [] };
    // A definition may be used both inline and in a drawer. Deduplicate only
    // inside its container so both placements remain visible.
    if (!group.fields.some(field => field.key === key)) group.fields.push({ key,
      name: definitions.has(key) ? fieldDisplayName(key, catalog) : `${usage.field.label} (${usage.surface.replace(/^.*? page · /, "")})`,
      definitionKey: definitions.has(key) ? key : undefined });
    groups.set(label, group);
  }
  return [...groups.values()].sort((a, b) => Number(a.label !== "On page") - Number(b.label !== "On page"));
}
