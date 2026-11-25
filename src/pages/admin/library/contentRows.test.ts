import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { contentRows } from './contentRows';
import { freshStartSource } from '../../../domain/freshStartCatalog';
import { compileRequirementCatalog } from '../../../domain/requirementCatalog.mjs';
import { resolvePrototypeLibrary } from '../../../domain/prototypeLibrary';
import { buildGlobalTemplate } from '../../../dev/storybook/globalTemplate';
import type { LibraryCatalog } from '../../../services/libraryCatalogService';
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) as LibraryCatalog;

it.each(['all', 'asce'])('shows one content item for shared copy with every binding and documents in the same inventory (%s)', site => {
  const rows = contentRows(catalog, site);
  expect(new Set(rows.map(row => row.key)).size).toBe(rows.length);
  expect(rows.filter(row => row.key === 'people.self')).toHaveLength(1);
  expect(rows.some(row => row.key === 'coverage.applicantLabels.member')).toBe(false);
  expect(rows.find(row => row.key === 'people.self')?.uses).toContain('coverage.applicantLabels.member');
  expect(rows.find(row => row.key === 'action.cancel')?.references).toContain('beneficiary.dialog.cancel');
  expect(rows.some(row => row.key === 'beneficiary.dialog.cancel')).toBe(false);
  expect(rows.some(row => row.uses.some(use => use.startsWith('Document:')))).toBe(true);
  const note = rows.find(row => row.key === 'membership.page-note')!;
  expect(note.defaultValue).toBe('');
  expect(note.configurable).toBe(true);
  if (site === 'asce') { expect(note.value).toContain('Civil Engineering'); expect(note.status).toBe('Site override'); }
  expect(rows.find(row => row.key === 'receipt.email.subject')?.configurable).toBe(true);
  expect(rows.find(row => row.key === 'receipt.email.title')?.configurable).toBe(true);
});
it('keeps Library, prototype and Storybook on the same canonical applicant labels without captured copies', () => {
  const source = structuredClone(freshStartSource());
  source.content['people.self'] = 'Primary applicant';
  const input = structuredClone(catalog.data);
  input.contentEntries = []; input.contentValues = [];
  const data = compileRequirementCatalog(input, source);
  const library = resolvePrototypeLibrary(data, 'asce', 'shared-content', source);
  expect(library.client.applicantLabels?.member).toBe('Primary applicant');
  expect(library.content.coverage.applicantLabels.member).toBe('Primary applicant');
  expect(library.content.shared.applicantSectionTitles.self).toBe('Primary applicant');
  expect(contentRows({ ...catalog, data }, 'asce', source).find(row => row.key === 'people.self')?.value).toBe('Primary applicant');
  // Storybook consumes the same compiled catalog rather than a second copy of labels.
  expect(buildGlobalTemplate(catalog).content.coverage.applicantLabels.member).toBe(freshStartSource().content['people.self']);
});

it('keeps global document definitions visible without a captured Site document assignment', () => {
  const source = structuredClone(freshStartSource());
  source.siteApplication.asce.records.siteDocuments = [];
  const input = structuredClone(catalog);
  input.data.siteDocuments = [];
  expect(contentRows(input, 'asce', source).some(row => row.key === 'product.li-term.brochure')).toBe(true);
});

it('orders shared wording first, then application pages, and presents readable locations', () => {
  const rows = contentRows(catalog, 'asce');
  expect(rows[0].area).toBe('Shared');
  const first = (area: string) => rows.findIndex(row => row.area === area);
  expect(first('Home')).toBeLessThan(first('Membership'));
  expect(first('Membership')).toBeLessThan(first('Coverage'));
  expect(first('Coverage')).toBeLessThan(first('Review'));
  const title = rows.find(row => row.key === 'membership.title')!;
  expect(title.placements).toContainEqual({ pageKey: 'membership', label: 'Membership' });
  expect(rows.some(row => ['application.document-preview.prepared-on', 'application.document-preview.no', 'application.document-preview.yes'].includes(row.key))).toBe(false);
});

it.each(['all', 'asce'])('includes displayed content with real placements and excludes metadata or captured orphans (%s)', site => {
  const source = structuredClone(freshStartSource());
  source.content['audit.orphan'] = 'Unplaced wording';
  source.contentBindings['audit.orphan'] = 'audit.orphan';
  const input = structuredClone(catalog);
  input.data.contentEntries.push({ ...input.data.contentEntries[0], id: 'audit.captured', key: 'audit.captured', definition: { path: ['audit', 'captured'] } });
  const rows = contentRows(input, site, source);
  expect(rows.some(row => ['audit.orphan', 'audit.captured', 'application.ui.challenge-failed', 'status.health-cir.body'].includes(row.key))).toBe(false);
  for (const group of source.contentInventory.exclusions) for (const key of group.keys) expect(rows.some(row => row.key === key), key).toBe(false);
  expect(rows.every(row => row.usages.length && row.sourceFile)).toBe(true);
  expect(rows.find(row => row.key === 'footer.terms-of-use-content.title')).toMatchObject({
    sourceFile: 'requirements/global/content/application.json',
    usages: [expect.objectContaining({ location: 'Site footer › Terms of Use dialog', component: 'AppFooter', when: 'After opening Terms of Use' })],
  });
  if (site === 'asce') expect(rows.find(row => row.key === 'membership.page-note')?.overrideFile).toBe('requirements/parked/sites/asce/pages/membership.json');
});

it('keeps planned header copy and retired status containers out of active projections', () => {
  const source = freshStartSource();
  const planned = JSON.parse(readFileSync('requirements/global/planned/coverage-details.json', 'utf8')) as { status: string; content: Record<string, unknown> };
  expect(planned.status).toBe('planned');
  const input = structuredClone(catalog);
  input.data.contentEntries.push({ ...input.data.contentEntries[0], id: 'statusMessages', key: 'statusMessages', definition: { path: ['statusMessages'] } });
  input.data.contentValues.push({ ...input.data.contentValues[0], id: 'retired-status-container', key: 'retired-status-container', contentKey: 'statusMessages', scope: 'global', siteKey: null, hostingAssociationKey: null, value: { healthCir: { body: 'Old placeholder content' } } });
  const data = compileRequirementCatalog(input.data, source);
  expect(data.contentEntries.some(row => row.key === 'statusMessages')).toBe(false);
  expect(data.contentValues.some(row => row.contentKey === 'statusMessages')).toBe(false);
  const rows = contentRows({ ...input, data }, 'all', source);
  for (const key of Object.keys(planned.content)) {
    expect(Object.hasOwn(source.content, key), key).toBe(false);
    expect(Object.hasOwn(source.contentBindings, key), key).toBe(false);
    expect(rows.some(row => row.key === key), key).toBe(false);
  }
});
