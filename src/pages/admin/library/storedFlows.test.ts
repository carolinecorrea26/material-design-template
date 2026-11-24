import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { LibraryCatalog } from '../../../services/libraryCatalogService';
import { freshStartSource } from '../../../domain/freshStartCatalog';
import { storedFlowRows } from './storedFlows';
import { allFlows } from '../../../content/docs/flows';
import { flowStages } from '../../../domain/flowStages.mjs';
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) as LibraryCatalog;

it.each(['all', 'asce'])('reconstructs all shared graphs after removing saved topology (%s)', site => {
  const input = structuredClone(catalog), before = JSON.stringify(catalog);
  input.data.flows = []; input.data.flowSteps = []; input.data.flowTransitions = []; input.data.siteFlows = [];
  const rows = storedFlowRows(input, site);
  expect(rows).toHaveLength(allFlows.length);
  for (const row of rows) {
    const authored = allFlows.find(flow => flow.id === row.definition.id)!;
    expect(row.key).toBe(`global:*.${authored.id}`);
    expect(row.status).toBe('inherited');
    expect(row.definition.edges).toEqual(authored.edges);
    expect(row.definition.stages).toEqual(authored.stages);
    expect(row.definition.nodes.map(node => ({ ...node, description: undefined }))).toEqual(authored.nodes.map(node => ({ ...node, description: undefined })));
  }
  expect(JSON.stringify(catalog)).toBe(before);
});

it.each(['consumer', 'advisor'])('uses canonical application wording for %s stages after the JSON changes', id => {
  const source = structuredClone(freshStartSource());
  source.content['navigation.progress-step-labels.coverage-options'] = 'Updated canonical coverage stage';
  for (const site of ['all', 'asce']) {
    const row = storedFlowRows(catalog, site, source).find(row => row.definition.id === id)!;
    expect(flowStages(row.definition, row.stageContent).find(stage => stage.id === 'coverage-options')?.label).toBe('Updated canonical coverage stage');
  }
});

it('resolves effective TPA values independently while keeping the same shared graph', () => {
  const source = structuredClone(freshStartSource());
  const before = storedFlowRows(catalog, 'asce', source).find(flow => flow.definition.id === 'tpaVerification')!;
  source.siteEligibility.asce.tpa.lookupFields = ['first-name', 'last-name', 'birth-date'];
  source.siteEligibility.asce.tpa.requireAddressBeforeVerification = false;
  const after = storedFlowRows(catalog, 'asce', source).find(flow => flow.definition.id === 'tpaVerification')!;
  expect(after.definition).toEqual(before.definition);
  expect(before.settings.find(setting => setting.key === 'tpaIntegration.lookupFields')?.value).toContain('member-id');
  expect(after.settings.find(setting => setting.key === 'tpaIntegration.lookupFields')?.value).not.toContain('member-id');
  expect(after.settings.find(setting => setting.key === 'tpaIntegration.requireAddressBeforeVerification')?.value).toBe(false);
  expect(storedFlowRows(catalog, 'all').find(flow => flow.definition.id === 'tpaVerification')?.settings.find(setting => setting.key === 'tpaIntegration.mode')?.value).toBe('none');
});
