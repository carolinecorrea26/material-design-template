import { describe, expect, it } from 'vitest';
import { allFlows, advisorFlow, resumeFlow, tpaVerificationFlow, healthRoutingRows } from './index';
import { freshStartSource } from '../../../domain/freshStartCatalog';
import { flowDefinition, validateFlowDefinitions } from '../../../domain/flowDefinitions.mjs';
const source = freshStartSource();

describe.each(allFlows)('$id authored flow', flow => {
  it('uses the canonical JSON and has valid, uniquely identified branches', () => {
    expect(flow).toEqual(flowDefinition(source.application.records, `global:*.${flow.id}`));
    const nodes = new Set(flow.nodes.map(node => node.id));
    expect(nodes.size).toBe(flow.nodes.length);
    expect(new Set(flow.edges.map(edge => edge.id)).size).toBe(flow.edges.length);
    for (const edge of flow.edges) { expect(nodes.has(edge.source)).toBe(true); expect(nodes.has(edge.target)).toBe(true); }
    for (const node of flow.nodes) {
      if (node.pageId) expect(Object.values(source.pages).some(page => (page.consumerKey ?? page.page) === node.pageId), node.pageId).toBe(true);
      if (node.kind === 'decision') {
        const edges = flow.edges.filter(edge => edge.source === node.id);
        expect(edges.length).toBeGreaterThan(1); expect(edges.every(edge => edge.condition)).toBe(true);
      }
    }
  });
});

it('preserves reviewed Advisor cancellation and Resume security branches', () => {
  expect(advisorFlow.edges.find(edge => edge.source === 'advisor-send-dialog' && edge.condition === 'Cancel')?.target).toBe('advisor-profile');
  expect(advisorFlow.edges.find(edge => edge.source === 'advisor-edit-dialog' && edge.condition === 'Cancel')?.target).toBe('advisor-review');
  expect(advisorFlow.edges.find(edge => edge.source === 'advisor-login' && edge.condition?.startsWith('Continue'))?.target).toBe('advisor-saved-resume');
  expect(resumeFlow.edges.find(edge => edge.condition === 'Incorrect code; attempts remain')?.target).toBe('resume-code');
  expect(resumeFlow.edges.filter(edge => edge.source === 'resume-method' && edge.target === 'resume-code').map(edge => edge.condition).sort()).toEqual(['Call', 'Text']);
  expect(resumeFlow.edges.some(edge => edge.target === 'resume-session-expired')).toBe(true);
});

it('defines optional consumer steps, shared subflows, and distinct save outcomes', () => {
  const consumer = allFlows.find(flow => flow.id === 'consumer')!;
  expect(consumer.edges.some(edge => edge.source === 'consumer-coverage' && edge.target === 'consumer-contact')).toBe(true);
  expect(consumer.edges.some(edge => edge.source === 'consumer-health-summary' && edge.target === 'consumer-esign')).toBe(true);
  expect(consumer.nodes.find(node => node.id === 'consumer-eligibility')?.flowIds).toContain('tpaVerification');
  const save = allFlows.find(flow => flow.id === 'autosave')!;
  expect(save.nodes.find(node => node.id === 'autosave-failure-summary')?.pageId).toBe('technical-error');
  expect(save.nodes.find(node => node.id === 'autosave-expired')?.pageId).toBe('session-expired');
  expect(save.nodes.find(node => node.id === 'autosave-local-failure')?.description).toContain('retains the current form');
  expect(save.edges.some(edge => edge.source === 'autosave-local-failure' && edge.target === 'autosave-validate')).toBe(true);
  expect(JSON.stringify(save)).not.toContain('Recovery Scenarios (10)');
  expect(allFlows.find(flow => flow.id === 'quote')?.nodes.find(node => node.id === 'quote-entry')?.description).toContain('Membership has no quote helper');
});

it('defines all shared TPA modes, address gating and verification outcomes without Site-specific graphs', () => {
  expect(JSON.stringify(tpaVerificationFlow)).not.toMatch(/ASCE|AMA|WAEPA/);
  expect(tpaVerificationFlow.edges.filter(edge => edge.source === 'tpa-method-decision').map(edge => edge.condition).sort()).toEqual(['Proceed without verification', 'Security questions', 'Text code', 'Voice code'].sort());
  expect(tpaVerificationFlow.edges.some(edge => edge.source === 'tpa-mode' && edge.target === 'tpa-none')).toBe(true);
  expect(tpaVerificationFlow.edges.some(edge => edge.source === 'tpa-member-status' && edge.target === 'tpa-new-member')).toBe(true);
  expect(tpaVerificationFlow.edges.some(edge => edge.source === 'tpa-member-status' && edge.target === 'tpa-existing-member')).toBe(true);
  expect(tpaVerificationFlow.edges.some(edge => edge.source === 'tpa-address-required' && edge.target === 'tpa-address')).toBe(true);
  expect(tpaVerificationFlow.edges.some(edge => edge.source === 'tpa-result-decision' && edge.target === 'tpa-unverified-outcome')).toBe(true);
  expect(healthRoutingRows.map(row => row.pageId).sort()).toEqual(Object.values(source.pages).filter(page => page.definition.groupId === 'health').map(page => page.consumerKey ?? page.page).sort());
});

it('rejects malformed endpoints, missing branches and dangling shared references', () => {
  expect(() => validateFlowDefinitions(source.application.records, source)).not.toThrow();
  const changed = structuredClone(source);
  const edge = changed.application.records.flowTransitions[0];
  edge.targetStepKey = 'missing';
  expect(() => validateFlowDefinitions(changed.application.records, changed)).toThrow('Invalid flow endpoint');
  const decision = structuredClone(source);
  decision.application.records.flowTransitions = decision.application.records.flowTransitions.filter(row => (row.definition as { source: string }).source !== 'tpa-mode');
  expect(() => validateFlowDefinitions(decision.application.records, decision)).toThrow('Incomplete flow decision');
  const related = structuredClone(source);
  (related.application.records.flowSteps[0].definition as { flowIds: string[] }).flowIds = ['missing'];
  expect(() => validateFlowDefinitions(related.application.records, related)).toThrow('Unknown related flow');
});
