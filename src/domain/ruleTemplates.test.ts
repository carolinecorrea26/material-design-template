import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
// A changed authored rule must reach every consumer despite a stale saved definition.
vi.mock('../../requirements/global/application.json', async original => {
  const module = await original<{ default: { records: { rules: Array<{ key: string; definition: Record<string, unknown> }> } } }>();
  const document = structuredClone(module.default);
  document.records.rules.find(row => row.key === 'rule-application-flow-beneficiary-routing')!.definition.templates = ['single'];
  return { default: document };
});
import { ruleAppliesToTemplate, ruleTemplateDisplay, ruleTemplateFilterValues, validateRuleTemplates } from './ruleTemplates.mjs';
import { compileRequirementCatalog } from './requirementCatalog.mjs';
import { freshStartSource } from './freshStartCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { libraryRequirementRows } from '../pages/admin/library/libraryRequirementRows';
import { getFlowGateDefinition } from '../config/flowGates';
import { confirmedRequirementBehaviors } from './requirementBehaviors';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => { installPrototypeLibrary(null); sessionStorage.removeItem('activeFormTemplate'); window.history.replaceState(null, '', '/'); });

it('defaults shared rules to both layouts and makes the Library filter include shared rules', () => {
  expect(ruleTemplateDisplay({})).toBe('All layouts');
  expect(ruleTemplateFilterValues({})).toEqual(expect.arrayContaining(['Single page', 'Multi page']));
  for (const layout of ['single', 'multi'] as const) expect(ruleAppliesToTemplate({}, layout)).toBe(true);
  expect(ruleTemplateDisplay({ templates: ['single'] })).toBe('Single page');
  expect(ruleTemplateDisplay({ templates: ['multi'] })).toBe('Multi page');
  expect(ruleTemplateFilterValues({ templates: ['single'] })).not.toContain('Multi page');
  expect(ruleAppliesToTemplate({ templates: ['multi'] }, 'single')).toBe(false);
});

it('documents the current single-page composition once while retaining shared workflow applicability', () => {
  const rows = libraryRequirementRows(catalog, 'asce');
  const layout = rows.filter(row => row.key === 'rule-form-template-single-template-forces-the-narrow-screen-layout-not-a-separate-one-page-form');
  expect(layout).toHaveLength(1);
  expect(layout[0].templates).toEqual(['single']);
  expect(ruleTemplateDisplay(layout[0])).toBe('Single page');
  const shared = confirmedRequirementBehaviors().find(row => row.id === 'effective-site-configuration-resolution')!;
  expect(shared.templates).toBeUndefined();
  expect(ruleTemplateDisplay(shared)).toBe('All layouts');
});

it('propagates authored applicability through Library, application and Storybook and evaluates the effective layout', () => {
  const stale = structuredClone(catalog);
  stale.data.rules.find((row: { key: string }) => row.key === 'rule-application-flow-beneficiary-routing').definition.templates = ['multi'];
  expect(libraryRequirementRows(stale, 'asce').find(row => row.key === 'rule-application-flow-beneficiary-routing')?.templates).toEqual(['single']);
  for (const library of [resolvePrototypeLibrary(stale.data, 'asce', 'layout-scope'), buildGlobalTemplate(stale)]) {
    installPrototypeLibrary(library);
    expect(library.site.configuration.routing?.definitions.find(gate => gate.pageId === 'beneficiary')?.templates).toEqual(['single']);
    window.history.replaceState(null, '', '/?template=single');
    expect(getFlowGateDefinition('beneficiary')).toBeDefined();
    window.history.replaceState(null, '', '/?template=multi');
    expect(getFlowGateDefinition('beneficiary')).toBeUndefined();
  }
});

it('rejects malformed rule and workflow restrictions during source compilation', () => {
  for (const value of [[], ['unknown'], ['single', 'single'], 'single', null]) {
    expect(() => validateRuleTemplates(value)).toThrow('Rule templates');
    const source = structuredClone(freshStartSource());
    source.rules![0].templates = value as never;
    expect(() => compileRequirementCatalog(catalog.data, source)).toThrow('Rule templates');
  }
  const source = structuredClone(freshStartSource());
  source.workflows![0].templates = [];
  expect(() => compileRequirementCatalog(catalog.data, source)).toThrow('Rule templates');
});
