import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { confirmedRequirementBehaviors } from './requirementBehaviors';
import { freshStartSource } from './freshStartCatalog';
import { compileRequirementCatalog } from './requirementCatalog.mjs';
import { resolvePrototypeLibrary } from './prototypeLibrary';
import { projectLibraryCatalog } from '../services/libraryCatalogService';
import { libraryRequirementRows } from '../pages/admin/library/libraryRequirementRows';
import model from '../../requirements/global/rules/model.json';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const id = model.rules[0].id;

it('defines configuration resolution once and records placements separately from its identity', () => {
  const all = confirmedRequirementBehaviors();
  expect(all.filter(row => row.id === id)).toHaveLength(1);
  for (const page of ['home', 'membership', 'contact', 'payment', 'maintenance']) {
    expect(confirmedRequirementBehaviors([page]).find(row => row.id === id)).toMatchObject({ appliesTo: 'all-pages', pages: [page] });
  }
  const rows = libraryRequirementRows(projectLibraryCatalog(catalog), 'asce');
  expect(rows.filter(row => row.key === id)).toHaveLength(1);
  expect(rows.find(row => row.key === id)).toMatchObject({ site: 'Global template', hierarchy: ['requirements', 'shared rules'], pages: expect.arrayContaining(['membership', 'contact', 'payment']) });
  for (const retired of model.rules[0].replaces) expect(rows.some(row => row.key === retired)).toBe(false);
});

it('keeps active Library requirements free of project commentary without hiding service requirements', () => {
  const rows = libraryRequirementRows(projectLibraryCatalog(catalog), 'all').filter(row => row.dataset === 'rules');
  const commentary = rows.filter(row => /\b(prototype|storybook|ASCE|simulator)\b/i.test(`${row.name} ${row.behavior}`)).map(row => row.key);
  expect(commentary).toEqual([]);
  expect(rows.find(row => row.key === 'abandoned-lead-nightly-batch')?.behavior).toContain('nightly batch');
  expect(rows.find(row => row.key === 'receipt-confirmation-email')?.behavior).toContain('Successful submission triggers');
  expect(rows.find(row => row.key === 'signing-evidence-integrity')?.behavior).toContain('verified provider completion');
  expect(rows.find(row => row.key === 'external-provider-handoff')?.behavior).toContain('provider result');
});

it('adds a synthetic Site through values while retaining one shared rule and independent effective values', async () => {
  const source = structuredClone(freshStartSource());
  source.fields.sites.example = structuredClone(source.fields.sites.asce);
  source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
  source.siteProducts.example = structuredClone(source.siteProducts.asce);
  source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
  source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
  source.fields.sitePages!.example.contact = { page: 'contact', content: { 'contact.title': 'Synthetic Site contact heading' } };
  const input = structuredClone(catalog.data);
  input.sites.push({ ...input.sites.find((row: { key: string }) => row.key === 'asce'), key: 'example', id: 'example' });
  const data = compileRequirementCatalog(input, source);
  for (const scope of ['all', 'asce', 'example']) {
    // Let Vitest flush task updates between complete synchronous projections.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(libraryRequirementRows({ ...catalog, data }, scope, source).filter(row => row.key === id)).toHaveLength(1);
  }
  const base = resolvePrototypeLibrary(data, 'asce', 'model-base', source);
  const example = resolvePrototypeLibrary(data, 'example', 'model-example', source);
  expect(example.content.pages.contact.title).toBe('Synthetic Site contact heading');
  expect(base.content.pages.contact.title).not.toBe(example.content.pages.contact.title);
  const unsupported = structuredClone(source);
  (unsupported.fields.sitePages!.example.contact as { content: Record<string, string> }).content['unsupported.content'] = 'Invalid override';
  expect(() => compileRequirementCatalog(input, unsupported)).toThrow();
}, 60000);

it('retires captured copies and their assignments rather than merely filtering their displayed text', () => {
  const input = structuredClone(catalog.data), retired = model.rules[0].replaces[0];
  input.rules.push({ ...input.rules[0], id: retired, key: retired, definition: { ...input.rules[0].definition, id: retired, behavior: 'Stale page copy contract' } });
  input.ruleAssignments.push({ ...input.ruleAssignments[0], id: 'stale-copy-assignment', key: 'stale-copy-assignment', ruleKey: retired });
  const compiled = compileRequirementCatalog(input, freshStartSource());
  expect(compiled.rules.some(row => row.key === retired)).toBe(false);
  expect(compiled.ruleAssignments.some(row => row.ruleKey === retired)).toBe(false);
});
