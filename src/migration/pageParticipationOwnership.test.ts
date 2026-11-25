import { afterEach, expect, it } from 'vitest';
import { createMigrationDatabase, createReviewedMigrationDatabase } from './fixtures';
import { consolidatePageParticipationOwnership } from './pageParticipationOwnership';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { getClientPageRequirement } from '../config/client/getClientPageRequirement';
import { getResolvedFormFlow, shouldSkipPage } from '../config/formFlow';
import { resolveFlowGate } from '../config/flowGates';
import { freshStartSource } from '../domain/freshStartCatalog';
import { journeyLibrary, journeySiteKeys, syntheticJourneySource } from './freshStartJourneyFixtures';
import { libraryMetadata } from '../domain/provenance';

const db = createReviewedMigrationDatabase();
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, 'page ownership regression') });
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); });

it('keeps the historical consolidation idempotent and preserves its original assignments as evidence', () => {
  const copy = structuredClone(db), assignments = structuredClone(db.sitePages);
  consolidatePageParticipationOwnership(copy);
  expect(copy).toEqual(db);
  expect(copy.sitePages).toEqual(assignments);
  expect(db.semanticRequirements.some(row => row.predicate === 'site-page-participation')).toBe(true);
});
it.each(journeySiteKeys)('%s projects effective participation into the existing client and navigation consumers', key => {
  const library = journeyLibrary(key);
  installPrototypeLibrary(library);
  expect(library.site.configuration.pageParticipation.source).toBe('sitePages');
  for (const page of library.site.configuration.pages) expect(getClientPageRequirement(page.key as Parameters<typeof getClientPageRequirement>[0], library.client)).toBe(page.requirement);
  expect(getResolvedFormFlow()).toEqual(library.pages.filter(page => page.enabled && page.definition.flow === 'application' && page.definition.type !== 'home').map(page => page.definition.id));
});
it('applies Site page participation after the independent underwriting gate', () => {
  const values = { 'beneficiary-information-opt-in': 'yes', 'birth-date': '1990-01-01', 'state-province': 'PA', coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000 } };
  installPrototypeLibrary(journeyLibrary('asce'));
  expect(resolveFlowGate('beneficiary', values)).toBe(true);
  expect(shouldSkipPage('beneficiary', values)).toBe(false);
  const source = structuredClone(freshStartSource());
  source.fields.sitePages!.asce['beneficiary'] = { page: 'beneficiary', requirement: 'none' };
  const library = journeyLibrary('asce', source); installPrototypeLibrary(library);
  expect(resolveFlowGate('beneficiary', values)).toBe(true);
  expect(shouldSkipPage('beneficiary', values)).toBe(true);
  expect(getResolvedFormFlow()).not.toContain('beneficiary');
});
it('inherits the global requirement when no Site override exists and keeps synthetic Site choices isolated', () => {
  const source = syntheticJourneySource();
  delete (source.fields.sitePages!.example.contact as { requirement?: string }).requirement;
  source.fields.sitePages!.example['beneficiary'] = { page: 'beneficiary', requirement: 'none' };
  const example = journeyLibrary('example', source);
  expect(example.site.configuration.pages.find(page => page.key === 'contact')?.requirement).toBe(source.pageDefaults.pages.contact.requirement);
  expect(example.client.pages.requirements?.['beneficiary']).toBe('none');
  expect(journeyLibrary('asce', source).client.pages.requirements?.beneficiary).toBe(journeyLibrary('asce').client.pages.requirements?.beneficiary);
});
it.each(['sometimes', ''])('rejects an unsupported authored page requirement %s', requirement => {
  const source = structuredClone(freshStartSource());
  source.fields.sitePages!.asce.contact = { page: 'contact', requirement };
  expect(() => journeyLibrary('asce', source)).toThrow();
});
it('reconstructs participation from authored requirements despite obsolete saved markers, modes and duplicate rows', () => {
  const changed = structuredClone(db);
  changed.configurationValues.find(row => row.key === 'ownership.asce.page-participation')!.value = { version: 9, source: 'legacy' };
  const page = changed.sitePages.find(row => row.siteKey === 'asce' && row.pageKey === 'contact')!;
  page.requirement = 'none'; changed.sitePages.push({ ...page, ...meta('sitePages', 'stale.duplicate') });
  const before = structuredClone(changed);
  const library = resolvePrototypeLibrary(changed, 'asce', 'reconstructed-pages');
  expect(library.client.pages.requirements?.contact).toBe(journeyLibrary('asce').client.pages.requirements?.contact);
  expect(changed).toEqual(before);
});
it.each(["value", "conflict"])("rejects an unresolved source %s before mutation", scenario => {
  const original = createMigrationDatabase();
  original.configurationValues.find(row => row.key === "client:asce.pages.requirements.beneficiary")!.value = scenario === "value" ? "sometimes" : "none";
  const before = JSON.stringify(original);
  expect(() => consolidatePageParticipationOwnership(original)).toThrow(scenario === "value" ? "Unresolved page participation copy" : "Unreconciled page participation");
  expect(JSON.stringify(original)).toBe(before);
});

it("reconciles legacy excluded/optional arrays with explicit requirement precedence", () => {
  const original = createMigrationDatabase();
  for (const [property, value] of [["excluded", ["health-cir", "contact"]], ["optional", ["health-cir", "profile", "beneficiary"]]] as const) {
    const key = `pages.${property}`;
    const existing = original.configurationDefinitions.find(row => row.definition.path?.join(".") === key);
    if (!existing) original.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: ["pages", property], metadata: null } });
    original.configurationValues = original.configurationValues.filter(row => !(row.scope === "association" && row.hostingAssociationKey === "asce" && row.configurationKey === (existing?.key ?? key)));
    original.configurationValues.push({ ...meta("configurationValues", `test.asce.${property}`), position: 0, scope: "association", siteKey: null, hostingAssociationKey: "asce", configurationKey: existing?.key ?? key, value: [...value] });
  }
  for (const row of original.sitePages.filter(row => row.siteKey === "asce")) {
    if (["health-cir", "contact"].includes(row.pageKey)) row.requirement = "none";
    if (row.pageKey === "profile") row.requirement = "optional";
  }
  const before = structuredClone(original.sitePages);
  consolidatePageParticipationOwnership(original);
  expect(original.sitePages).toEqual(before);
  expect(original.sitePages.find(row => row.siteKey === "asce" && row.pageKey === "beneficiary")?.requirement).toBe("required");
  expect(original.configurationValues.some(row => row.key === "test.asce.excluded" || row.key === "test.asce.optional")).toBe(false);
  const evidence = original.semanticRequirements.find(row => row.key === "ownership-evidence.asce.page-participation")!.value;
  expect(JSON.stringify(evidence)).toContain("test.asce.excluded");
  expect(JSON.stringify(evidence)).toContain("test.asce.optional");
});
