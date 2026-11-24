import navigation from '../../requirements/global/navigation.json' with { type: 'json' };
import applicationContent from '../../requirements/global/content/application.json' with { type: 'json' };

/** Group existing topology using the application's canonical progress placements.
 * Explicit node references cover entry, receipt and non-page actions only. */
export function flowStages(flow, content = applicationContent) {
  const stages = (flow.stages ?? []).map(stage => {
    const progress = stage.progressStepId && navigation.progressSteps.find(step => step.id === stage.progressStepId);
    if (stage.progressStepId && !progress) throw new Error(`Unknown flow progress stage: ${stage.progressStepId}`);
    if (stage.nodeIds?.some(id => !flow.nodes.some(node => node.id === id))) throw new Error(`Unknown flow stage node: ${stage.id}`);
    const nodes = flow.nodes.filter(node => stage.nodeIds?.includes(node.id) || progress?.pages.includes(node.pageId));
    if (!nodes.length) throw new Error(`Empty flow stage: ${stage.id}`);
    if (stage.branchDetailsNodeIds?.some(id => !nodes.some(node => node.id === id))) throw new Error(`Unknown flow branch-detail node: ${stage.id}`);
    if (stage.branchDetailsEdgeIds?.some(id => !flow.edges.some(edge => edge.id === id && nodes.some(node => node.id === edge.source)))) throw new Error(`Unknown flow branch-detail edge: ${stage.id}`);
    if (progress && stage.label !== undefined) throw new Error(`Application flow stages must use canonical wording: ${stage.id}`);
    if (stage.actor !== undefined && (typeof stage.actor !== 'string' || !stage.actor.trim()) || stage.related !== undefined && typeof stage.related !== 'boolean') throw new Error(`Invalid flow stage presentation: ${stage.id}`);
    const label = progress ? content[`navigation.progress-step-labels.${progress.id}`] : stage.label ?? nodes[0].label;
    if (typeof label !== 'string' || !label.trim()) throw new Error(`Missing flow stage wording: ${stage.id}`);
    return { id: stage.id, label, nodes, actor: stage.actor, related: stage.related ?? false, branchDetailsNodeIds: stage.branchDetailsNodeIds ?? [], branchDetailsEdgeIds: stage.branchDetailsEdgeIds ?? [] };
  });
  if (!stages.length) return stages;
  if (new Set(stages.map(stage => stage.id)).size !== stages.length) throw new Error('Duplicate flow stage');
  for (const node of flow.nodes) if (stages.filter(stage => stage.nodes.some(member => member.id === node.id)).length !== 1) throw new Error(`Flow node must belong to one stage: ${node.id}`);
  return stages;
}

/** Stage exits keep the original transition and destination identity. No branch
 * is lost and no independent overview topology is authored. */
export function flowStageDetail(flow, stageId, content = applicationContent) {
  const stages = flowStages(flow, content), stage = stages.find(stage => stage.id === stageId);
  if (!stage) throw new Error(`Unknown flow stage: ${stageId}`);
  const members = new Set(stage.nodes.map(node => node.id));
  const inDetails = edge => stage.branchDetailsNodeIds.includes(edge.source) || stage.branchDetailsEdgeIds.includes(edge.id);
  const detailEdges = flow.edges.filter(edge => members.has(edge.source) && inDetails(edge));
  const edges = flow.edges.filter(edge => members.has(edge.source) && !inDetails(edge));
  const exits = stages.flatMap(destination => destination.nodes.filter(node => !members.has(node.id) && edges.some(edge => edge.target === node.id)).map(node => ({ nodeId: node.id, stageId: destination.id, stageLabel: destination.label })));
  return {
    stage, exits, detailEdges,
    definition: { ...flow, stages: undefined, title: `${flow.title}: ${stage.label}`, nodes: [...stage.nodes, ...exits.map(exit => {
      const node = flow.nodes.find(node => node.id === exit.nodeId);
      const destination = stages.find(stage => stage.id === exit.stageId);
      return { ...node, kind: 'end', label: `Go to ${exit.stageLabel}${destination.nodes.length === 1 || node.label === exit.stageLabel ? '' : `: ${node.label}`}` };
    })], edges },
  };
}
