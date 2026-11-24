import { expect, it } from 'vitest';
import { allFlows } from '../content/docs/flows';
import navigation from '../../requirements/global/navigation.json';
import content from '../../requirements/global/content/application.json';
import { flowStageDetail, flowStages } from './flowStages.mjs';
import { computeFlowLayout } from '../components/docs/flows/layout';
import { intersects, segmentCrossesRect } from '../components/docs/flows/routing';

const consumer = allFlows.find(flow => flow.id === 'consumer')!;
it('uses the application progress groups and accounts for every Consumer step once', () => {
  const stages = flowStages(consumer);
  expect(stages.map(stage => stage.label)).toEqual(['Home', 'Getting started', 'Choose your coverage', 'Your application details', 'Review your application', 'E-sign and submit', 'Receipt']);
  expect(stages.slice(1, -1).map(stage => stage.label)).toEqual(navigation.progressSteps.map(step => content[`navigation.progress-step-labels.${step.id}` as keyof typeof content]));
  expect(stages.flatMap(stage => stage.nodes.map(node => node.id)).sort()).toEqual(consumer.nodes.map(node => node.id).sort());
  for (const progress of navigation.progressSteps) {
    const stage = stages.find(stage => stage.id === progress.id)!;
    expect(stage.nodes.filter(node => node.pageId).map(node => node.pageId)).toEqual(consumer.nodes.filter(node => progress.pages.includes(node.pageId!)).map(node => node.pageId));
  }
  expect(flowStages(allFlows.find(flow => flow.id === 'autosave')!)).toEqual([]);
});

const stagedFlows = allFlows.filter(flow => flow.stages);
it.each(stagedFlows)('$id preserves every canonical branch across stage views and resolves exits to their real stage', flow => {
  const details = flowStages(flow).map(stage => flowStageDetail(flow, stage.id));
  expect(details.flatMap(detail => [...detail.definition.edges, ...detail.detailEdges]).sort((a, b) => a.id.localeCompare(b.id))).toEqual([...flow.edges].sort((a, b) => a.id.localeCompare(b.id)));
  for (const detail of details) for (const edge of detail.definition.edges) {
    expect(detail.definition.nodes.some(node => node.id === edge.target)).toBe(true);
    const exit = detail.exits.find(exit => exit.nodeId === edge.target);
    if (exit) expect(flowStages(flow).find(stage => stage.id === exit.stageId)?.nodes.some(node => node.id === edge.target)).toBe(true);
  }
});

it('rejects incomplete and ambiguous stage ownership', () => {
  expect(() => flowStages({ ...consumer, stages: consumer.stages!.filter(stage => stage.id !== 'home') })).toThrow('one stage');
  expect(() => flowStages({ ...consumer, stages: [...consumer.stages!, { id: 'duplicate', nodeIds: ['consumer-landing'] }] })).toThrow('one stage');
});

for (const flow of stagedFlows) it.each(flowStages(flow))(`${flow.id}: $label detail keeps routes clear of cards and labels`, stage => {
  const { definition } = flowStageDetail(flow, stage.id);
  const layout = computeFlowLayout(definition);
  const boxes = [...layout.nodes.map(node => ({ ...node.position, width: 240, height: node.layoutHeight })), ...Object.values(layout.edgeLabels)];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(intersects(boxes[i], boxes[j])).toBe(false);
  for (const route of Object.values(layout.edgeRoutes)) for (let i = 1; i < route.length; i++) for (const box of boxes) expect(segmentCrossesRect(route[i - 1], route[i], box)).toBe(false);
});

it('keeps Advisor application stages canonical and separates recovery, corrections and notifications', () => {
  const advisor = allFlows.find(flow => flow.id === 'advisor')!;
  const stages = flowStages(advisor);
  expect(stages.filter(stage => !stage.related).map(stage => stage.label)).toEqual(['Advisor entry', 'Getting started', 'Choose your coverage', 'Your application details', 'Send to applicant for review', 'Applicant access', 'Review your application', 'E-sign and submit', 'Receipt']);
  expect(stages.filter(stage => stage.related).map(stage => stage.label)).toEqual(['Advisor access', 'Request edit', 'Reminders and deletion']);
  expect(stages.flatMap(stage => stage.nodes.map(node => node.id)).sort()).toEqual(advisor.nodes.map(node => node.id).sort());
  expect(stages.find(stage => stage.id === 'profile')?.actor).toBe('Advisor');
  expect(stages.find(stage => stage.id === 'application-review')?.actor).toBe('Applicant');
  expect(flowStageDetail(advisor, 'application-review').detailEdges.map(edge => edge.id)).toEqual(['advisor-review-takeover', 'advisor-health-summary-takeover', 'advisor-payment-takeover']);
  expect(() => flowStages({ ...advisor, stages: advisor.stages!.map(stage => stage.id === 'profile' ? { ...stage, label: 'Wrong application label' } : stage) })).toThrow('canonical wording');
  expect(() => flowStages({ ...advisor, stages: advisor.stages!.map(stage => stage.id === 'profile' ? { ...stage, branchDetailsEdgeIds: ['advisor-1'] } : stage) })).toThrow('branch-detail edge');
});
