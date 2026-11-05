import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { componentCategory, componentRoles, componentSections, componentUsages, reusableComponents, validateComponentStructure } from './componentCatalog';
import type { ComponentRow } from '../persistence/types/library';
import { componentCatalog } from '../content/docs/components';

const saved: ComponentRow[] = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data.components;
it('separates ownership from browsing category and reuse, with one identity per source owner', () => {
  expect(() => validateComponentStructure(saved)).not.toThrow();
  for (const row of saved) expect(componentRoles).toContain(row.definition.role);
  const find = (name: string) => saved.find(row => row.definition.name === name)!;
  expect(find('FormRoutePage').definition.role).toBe('application-frame');
  expect(find('MembershipStatus').definition.role).toBe('page-section');
  // These are filed beneath pages but remain reusable pieces, not page sections.
  expect(find('EligibilityFields').definition.role).toBe('shared-piece');
  expect(find('FieldGrid').definition.role).toBe('shared-piece');
  expect(find('ProductCard').definition.role).toBe('shared-piece');
  expect(find('FormRoutePage').definition.contains).toEqual(expect.arrayContaining([find('PageHeader').key, find('PageNav').key, find('FormShell').key]));
  expect(find('ProductCard').definition.contains).toContain(find('QuickDecisionIndicator').key);
  expect(find('ProgressStep').definition.parts).toContainEqual(expect.objectContaining({ kind: 'export', sourceSymbol: 'Breadcrumbs' }));
  expect(find('PageTitle').definition.parts).toContainEqual(expect.objectContaining({ name: 'Back button', kind: 'action' }));
  expect(find('FormRoutePage').definition.parts).toContainEqual(expect.objectContaining({ kind: 'native-element', sourceSymbol: 'form' }));
});

it('rejects broken composition graphs and undocumented roles instead of silently guessing', () => {
  const definition = { role: 'shared-piece' as const, contains: [] as string[], parts: [] };
  expect(() => validateComponentStructure([{ key: 'a', definition: { ...definition, contains: ['missing'] } }])).toThrow('Invalid component composition');
  expect(() => validateComponentStructure([{ key: 'a', definition: { ...definition, contains: ['a'] } }])).toThrow('Invalid component composition');
  expect(() => validateComponentStructure([
    { key: 'a', definition: { ...definition, contains: ['b'] } },
    { key: 'b', definition: { ...definition, contains: ['a'] } },
  ])).toThrow('Cyclic component composition');
  const malformed = structuredClone(saved);
  Reflect.deleteProperty(malformed[0].definition, 'role');
  expect(() => validateComponentStructure(malformed)).toThrow('Invalid component role');
});
it('uses the approved hierarchy and retains reviewed page sections in the saved source', () => {
  expect(componentSections).toEqual(['Components', 'Reference']);
  for (const row of saved) expect(componentSections).toContain(componentCategory(row.definition));
  expect(saved.find(row => row.definition.name === 'AppHeader')?.definition.section).toBe('Components / Layout');
  expect(saved.find(row => row.definition.name === 'FieldRenderer')?.definition.section).toBe('Components / Forms');
  expect(saved.find(row => row.definition.name === 'PageHeader')?.definition.section).toBe('Components / Layout / Headings and dividers');
  expect(saved.find(row => row.definition.name === 'AppDrawer')?.definition.section).toBe('Components / Feedback and overlays / Dialogs and drawers / Containers');
  const eligibility = saved.flatMap(row => row.definition.examples ?? []).filter(example => example.pageKey === 'eligibility' && example.position !== 0);
  expect(eligibility.map(example => example.label).sort()).toEqual(['Children information', 'Covered applicants', 'Spouse information', 'Your information']);
});
it('keeps generated and saved definitions identical with stable identities and canonical examples', () => {
  expect(saved.every(row => (row.definition.usages?.length ?? 0) > 0)).toBe(true);
  expect(saved.some(row => row.definition.name === 'LoadingOverlay')).toBe(false);
  expect(saved).toHaveLength(componentCatalog.length);
  for (const { id, ...definition } of componentCatalog) expect(saved.find(row => row.key === id)?.definition).toEqual({ ...definition, storybookPath: `?path=/story/${definition.storyId}` });
  expect(saved.find(row => row.definition.name === 'Button')?.definition.packageImport).toEqual({ module: '@mui/material', symbol: 'Button' });
  expect(saved.find(row => row.definition.name === 'FieldRenderer')?.definition.storyId).toBe('forms-fieldrenderer--playground');
});
it('derives reuse from distinct placements and retains the original records', () => {
  const shared = saved.find(row => row.definition.name === 'FieldRenderer')!;
  const single = saved.find(row => row.definition.name === 'HomeHero')!;
  const duplicate = { ...single, definition: { ...single.definition, usages: [...single.definition.usages!, ...single.definition.usages!] } };
  expect(componentUsages(duplicate.definition)).toHaveLength(1);
  expect(reusableComponents([shared, duplicate])).toEqual([shared]);
  expect(reusableComponents([shared])[0]).toBe(shared);
  expect(reusableComponents(saved).length).toBeGreaterThan(0);
  expect(reusableComponents(saved).some(row => row.definition.name === 'AppShell')).toBe(true);
  for (const row of saved) for (const usage of componentUsages(row.definition)) expect(usage.source).not.toMatch(/(?:\.stories\.|\.test\.|\/admin\/|\/docs\/)/);
});
