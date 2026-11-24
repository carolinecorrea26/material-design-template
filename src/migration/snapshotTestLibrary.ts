import type { DatabaseSchema } from '../persistence/types';
import { resolveSnapshotSite, type EffectiveSiteData } from '../domain/effectiveSite';
import { resolveStoredFieldSurfaces } from '../domain/fieldSurfaces';
import { projectPrototypeLibrary } from '../domain/prototypeLibrary';
import { withFreshStartCatalog } from '../domain/freshStartCatalog';
import { getPhoneTypeFieldId } from '../domain/phoneFields';

let controls: (EffectiveSiteData & Pick<DatabaseSchema, "components">) | undefined;

/** Historical migration assertions operate on their captured input, not on
 * today's authored requirements. This test-only boundary reuses the shared
 * resolver and presentation adapter; it never enrolls a Site in the app. */
export function resolveSnapshotTestLibrary(data: EffectiveSiteData & Pick<DatabaseSchema, 'components'>, siteKey: string, revision: string) {
  // The old capture predates the shared surface presentation contract. Supply
  // missing global UI definitions from the current compiler; preserve every
  // captured business rule, page, product, value and override under test.
  controls ??= withFreshStartCatalog(data);
  const surfaceDefinition = data.configurationDefinitions.find(row => row.definition.path?.join('.') === 'fieldSurfaces')!;
  const surfaceRow = data.configurationValues.find(row => row.configurationKey === surfaceDefinition.key && row.scope === 'global')!;
  const controlDefinition = controls.configurationDefinitions.find(row => row.definition.path?.join('.') === 'fieldSurfaces')!;
  const controlRow = controls.configurationValues.find(row => row.configurationKey === controlDefinition.key && row.scope === 'global')!;
  const surfaces = { ...surfaceRow.value as Record<string, import('../persistence/types').Json> };
  const fields = data.fields.map(field => field.key === 'membership' ? { ...field, definition: { ...field.definition, configurations: controls!.fields.find(row => row.key === field.key)?.definition.configurations } } : field);
  for (const name of Object.keys(controlRow.value as object)) {
    if (surfaces[name]) continue;
    const surface = (controlRow.value as Record<string, import('../persistence/types').Json>)[name];
    surfaces[name] = surface;
    for (const binding of (surface as unknown as { fields: { fieldKey: string }[] }).fields) {
      if (!fields.some(field => field.key === binding.fieldKey)) fields.push(controls.fields.find(field => field.key === binding.fieldKey)!);
    }
  }
  data = { ...data, fields,
    // Adapt the old capture to the shared UI's current presentation contract.
    // Captured fields and product values remain unchanged. Global Health page availability supersedes legacy per-Site exclusion copies.
    // Product questionnaire policies still decide whether an applicant uses a page.
    sitePages: data.sitePages.map(row => controls!.pages.some(page => page.key === row.pageKey && page.key !== 'health-cir' && page.definition.healthGate) ? { ...row, requirement: 'required' as const } : row),
    pages: data.pages.map(page => {
      const current = controls!.pages.find(row => row.key === page.key)?.definition;
      return { ...page, definition: { ...page.definition, help: current?.help ?? [], ...(current?.legalSections ? { legalSections: current.legalSections } : {}) } };
    }),
    conditions: [...data.conditions, ...controls!.conditions.filter(row => !data.conditions.some(existing => existing.key === row.key))],
    pageSections: [...controls!.pageSections.filter(row => !data.pageSections.some(existing => existing.pageKey === row.pageKey)), ...data.pageSections.filter(section => section.pageKey !== 'eligibility' || controls!.pageSections.some(row => row.key === section.key)).map(section => {
      const current = controls!.pageSections.find(row => row.key === section.key || row.pageKey === section.pageKey && row.definition.id === section.definition.id);
      return current?.definition.composition ? { ...section, definition: { ...section.definition, composition: current.definition.composition, components: current.definition.components, role: current.definition.role, presentation: current.definition.presentation, display: current.definition.display } } : section;
    })],
    configurationValues: data.configurationValues.map(row => row === surfaceRow ? { ...row, value: surfaces } : row) };
  const site = resolveSnapshotSite(data, siteKey);
  // Phone-type controls became explicit companion fields after this capture.
  // Carry the already-owned companion into the same historical page scope.
  for (const page of site.configuration.pages) for (const field of [...page.fields]) {
    if (!field.included || field.definition.format !== 'phone' || field.definition.showPhoneTypeSelector === false) continue;
    const key = getPhoneTypeFieldId(field.definition);
    if (page.fields.some(row => row.key === key)) continue;
    const companion = fields.find(row => row.key === key);
    if (companion) page.fields.push({ ...field, key, definition: companion.definition });
  }
  site.fieldSurfaces = resolveStoredFieldSurfaces(data, site);
  const library = projectPrototypeLibrary(data, site, revision);
  const child = library.client.applicantExperience?.childEligibility;
  const eligibility = library.content.pages.eligibility;
  if (eligibility && child?.mode === 'notice-only' && child.note) {
    eligibility.sectionNotes = { ...eligibility.sectionNotes, [library.fieldCollections.children.sectionId]: child.note };
  }
  return library;
}
