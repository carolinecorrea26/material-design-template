import { afterEach, beforeAll, expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { getPageSections } from '../config/pageSections/getPageSections';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import type { DatabaseSchema } from '../persistence/types';

let baseline: DatabaseSchema;
beforeAll(() => { baseline = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));

it('renders section membership and order from relationships rather than embedded field IDs', () => {
  const data = structuredClone(baseline);
  const section = data.pageSections.find(row => row.definition.id === 'selfCoverageWorkIncome')!;
  const placements = data.pageSectionFields.filter(row => row.sectionKey === section.key).sort((a, b) => a.position - b.position);
  const originalIds = [...section.definition.fieldIds];
  [placements[0].position, placements[1].position] = [placements[1].position, placements[0].position];
  const library = resolvePrototypeLibrary(data, 'asce', 'test');
  installPrototypeLibrary(library);
  expect(getPageSections('coverage').find(row => row.id === section.definition.id)?.fieldIds).toEqual([...originalIds].reverse());
  expect(section.definition.fieldIds).toEqual(originalIds);
  data.pageSectionFields = data.pageSectionFields.filter(row => row.key !== placements[0].key);
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'asce', 'test'));
  expect(getPageSections('coverage').find(row => row.id === section.definition.id)?.fieldIds).toEqual([placements[1].fieldKey]);
});

it('resolves a new ordinary section placement with saved field values and Site overrides', () => {
  const data = structuredClone(baseline);
  const section = data.pageSections.find(row => row.definition.id === 'selfCoverageWorkIncome')!;
  const fieldKey = 'stored-section-note';
  data.fields.push({ id: fieldKey, key: fieldKey, position: 0, definition: { id: fieldKey, label: 'Stored note', inputType: 'text' } });
  data.pageSectionFields.push({ id: fieldKey, key: fieldKey, sectionKey: section.key, fieldKey, position: 10 } as DatabaseSchema['pageSectionFields'][number]);
  data.siteFieldConfigurations.push({ id: fieldKey, key: fieldKey, pageKey: 'coverage', fieldKey, position: 0, scope: 'site', siteKey: 'asce', clientKey: null, hidden: null, include: null, values: { label: 'ASCE note', required: true } });
  const library = resolvePrototypeLibrary(data, 'asce', 'test');
  expect(library.site.configuration.pages.find(page => page.key === 'coverage')?.fields.find(field => field.key === fieldKey)?.definition).toMatchObject({ label: 'ASCE note', required: true });
  expect(resolvePrototypeLibrary(data, 'ama', 'test').site.configuration.pages.find(page => page.key === 'coverage')?.fields.find(field => field.key === fieldKey)?.definition.label).toBe('Stored note');
});
