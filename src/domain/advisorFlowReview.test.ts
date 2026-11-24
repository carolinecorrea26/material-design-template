import { freshStartSource } from './freshStartCatalog';
import { emailTemplateRows } from '../components/docs/emailTemplateRows';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import application from '../../requirements/global/application.json';
import tutorial from '../../requirements/global/tutorials/advisor.json';
import { advisorFlow } from '../content/docs/flows/advisorFlow';
import { storedFlowRows } from '../pages/admin/library/storedFlows';
import { withFreshStartCatalog } from './freshStartCatalog';

it('links the tutorial to defined flow nodes while keeping the canonical graph independent of the tutorial', () => {
  const nodes = advisorFlow.nodes;
  expect(tutorial.flowId).toBe(advisorFlow.id);
  for (const step of Object.values(tutorial.steps)) {
    expect(step.flowNodeIds.length).toBeGreaterThan(0);
    for (const id of step.flowNodeIds) expect(nodes.some(node => node.id === id), id).toBe(true);
  }
  expect(JSON.stringify(nodes)).not.toContain('tutorialSteps');
  expect(advisorFlow.edges.some(edge => edge.source === 'advisor-review' && edge.target === 'advisor-health-summary' && edge.condition?.startsWith('Continue'))).toBe(true);
  expect(advisorFlow.edges.some(edge => edge.source === 'advisor-review' && edge.target === 'advisor-edit-dialog' && edge.condition?.startsWith('Optional'))).toBe(true);
  const rules = new Set(freshStartSource().rules!.map(rule => rule.id));
  for (const node of nodes) for (const key of node.ruleKeys ?? []) expect(rules.has(key), key).toBe(true);
  const emails = new Set(application.records.emailTemplates.map(row => row.key));
  for (const node of nodes) for (const key of node.emailTemplateKeys ?? []) expect(emails.has(key), key).toBe(true);
  expect(advisorFlow.edges.some(edge => edge.source === 'advisor-resume-verification' && edge.target === 'advisor-review')).toBe(false);
  expect(advisorFlow.edges.some(edge => edge.source === 'advisor-applicant-method' && edge.target === 'advisor-applicant-code')).toBe(true);
  expect(advisorFlow.edges.some(edge => edge.source === 'advisor-resume-destination' && edge.target === 'advisor-esign')).toBe(true);
  expect(advisorFlow.edges.some(edge => edge.source === 'advisor-edit-email' && edge.target === 'advisor-login')).toBe(true);
});

it('reconstructs the same global/ASCE graph without saved topology or superseded MFA-bypass nodes', () => {
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const key = 'global:*.advisor';
  catalog.data.flowSteps = catalog.data.flowSteps.filter((row: { flowKey: string }) => row.flowKey !== key);
  catalog.data.flowTransitions = catalog.data.flowTransitions.filter((row: { flowKey: string }) => row.flowKey !== key);
  catalog.data.flowSteps.push({ id: 'stale', key: 'stale', flowKey: key, definition: { id: 'bypass', kind: 'action', label: 'MFA bypass' } });
  const projected = withFreshStartCatalog(catalog.data);
  expect(projected.flowSteps.some(row => row.key === 'stale')).toBe(false);
  for (const site of ['all', 'asce']) {
    const graph = storedFlowRows(catalog, site).find(row => row.definition.id === 'advisor')!.definition;
    expect(graph.nodes.map(node => node.id)).toEqual(advisorFlow.nodes.map(node => node.id));
    expect(graph.edges).toEqual(advisorFlow.edges);
    expect(graph.nodes.flatMap(node => node.ruleKeys ?? [])).toEqual(advisorFlow.nodes.flatMap(node => node.ruleKeys ?? []));
  }
});

it('projects email trigger metadata from canonical global email definitions', () => {
  expect(emailTemplateRows).toHaveLength(application.records.emailTemplates.length);
  for (const template of application.records.emailTemplates) expect(emailTemplateRows.find(row => row.type === template.key)).toMatchObject(template.definition.library);
  expect(emailTemplateRows.find(row => row.type === 'resume-magic-link')?.whenSent).toContain('advisor’s own email and phone');
  expect(emailTemplateRows.find(row => row.type === 'receipt')?.whenSent).toContain('all required signatures');
});
