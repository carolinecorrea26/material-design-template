import { requirementComponentKey } from './requirementComponents.mjs';
import { flowStages } from './flowStages.mjs';

/** Project one authored graph; graph topology is never independently authored in code. */
export function flowDefinition(records, key) {
  const flow = records.flows.find(row => row.key === key);
  if (!flow) throw new Error(`Missing authored flow: ${key}`);
  const steps = records.flowSteps.filter(row => row.flowKey === key).sort((a, b) => a.position - b.position);
  const transitions = records.flowTransitions.filter(row => row.flowKey === key).sort((a, b) => a.position - b.position);
  const nodes = new Map(steps.map(row => [row.key, row.definition.id]));
  const ids = new Set(steps.map(row => row.definition.id));
  if (!steps.length || ids.size !== steps.length || nodes.size !== steps.length) throw new Error(`Invalid flow nodes: ${key}`);
  if (new Set(transitions.map(row => row.definition.id)).size !== transitions.length) throw new Error(`Duplicate flow transitions: ${key}`);
  for (const row of transitions) if (nodes.get(row.sourceStepKey) !== row.definition.source || nodes.get(row.targetStepKey) !== row.definition.target || !ids.has(row.definition.source) || !ids.has(row.definition.target)) throw new Error(`Invalid flow endpoint: ${row.key}`);
  for (const { definition: node } of steps) {
    const outgoing = transitions.filter(row => row.definition.source === node.id);
    if (node.kind === 'decision' && (outgoing.length < 2 || outgoing.some(row => !row.definition.condition?.trim()))) throw new Error(`Incomplete flow decision: ${node.id}`);
    if (node.kind === 'end' && outgoing.length) throw new Error(`Flow continues past terminal outcome: ${node.id}`);
  }
  return { ...flow.definition, nodes: steps.map(row => row.definition), edges: transitions.map(row => row.definition) };
}

/** Validate the canonical references before projecting any consumer. */
export function validateFlowDefinitions(records, source) {
  const ids = new Set(records.flows.map(row => row.definition.id));
  if (ids.size !== records.flows.length) throw new Error('Duplicate global flow identity');
  const keys = new Set(records.flows.map(row => row.key));
  for (const row of [...records.flowSteps, ...records.flowTransitions]) if (!keys.has(row.flowKey)) throw new Error(`Unknown owning flow: ${row.flowKey}`);
  for (const flow of records.flows) {
    const assignments = records.siteFlows.filter(row => row.flowId === flow.definition.id);
    if (assignments.length !== 1 || assignments[0].scope !== 'global' || assignments[0].flowKey !== flow.key) throw new Error(`Invalid global flow assignment: ${flow.key}`);
  }
  const pages = new Set(Object.values(source.pages).map(page => page.consumerKey ?? page.page));
  const components = new Set(source.components.map(component => requirementComponentKey(component.name)));
  const emails = new Set(records.emailTemplates.map(row => row.key));
  const configurations = new Set([...Object.values(source.configurationBindings), ...records.configurationDefinitions.map(row => row.key)]);
  const rules = new Set([...(source.rules ?? []).map(row => row.id), ...records.rules.map(row => row.key)]);
  const workflows = new Set((source.workflows ?? []).map(row => row.id));
  for (const record of records.flows) {
    if (record.key !== `global:*.${record.definition.id}`) throw new Error(`Shared flow must be global: ${record.key}`);
    const flow = flowDefinition(records, record.key);
    flowStages(flow, source.content);
    for (const node of flow.nodes) {
      if (node.emailRecipient !== undefined && (!['Advisor', 'Applicant'].includes(node.emailRecipient) || !node.emailTemplateKeys?.length)) throw new Error(`Invalid flow email recipient: ${node.id}`);
      if (node.pageId && !pages.has(node.pageId)) throw new Error(`Unknown flow page: ${node.pageId}`);
      if (node.componentKey && !components.has(node.componentKey)) throw new Error(`Unknown flow component: ${node.componentKey}`);
      for (const id of node.flowIds ?? []) if (!ids.has(id)) throw new Error(`Unknown related flow: ${id}`);
      for (const key of node.configurationPaths ?? []) if (!configurations.has(key)) throw new Error(`Unknown flow configuration: ${key}`);
      for (const key of node.ruleKeys ?? []) if (!rules.has(key)) throw new Error(`Unknown flow rule: ${key}`);
      for (const key of node.workflowKeys ?? []) if (!workflows.has(key)) throw new Error(`Unknown flow workflow: ${key}`);
      for (const key of node.emailTemplateKeys ?? []) if (!emails.has(key)) throw new Error(`Unknown flow email: ${key}`);
    }
  }
}
