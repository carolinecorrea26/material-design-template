import { Box, Breadcrumbs, Button, Chip, Link, Stack, Step, StepButton, Stepper, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { FlowDefinition, FlowNodeDef } from '../../../domain/flows';
import { flowStageDetail, flowStages } from '../../../domain/flowStages.mjs';
import FlowDiagram from './FlowDiagram';

/** A documentation overview reuses application stages; the existing measured
 * diagram and Library inspector own detailed branching and record inspection. */
export default function StagedFlowDiagram({ definition, stageContent, stageId, onStageChange, onSelectNode }: {
  definition: FlowDefinition;
  stageContent?: Record<string, unknown>;
  stageId?: string | null;
  onStageChange: (id?: string) => void;
  onSelectNode: (node: FlowNodeDef) => void;
}) {
  const stages = flowStages(definition, stageContent);
  const selected = stages.find(stage => stage.id === stageId);
  const detail = selected && flowStageDetail(definition, selected.id, stageContent);
  const related = stages.filter(stage => stage.related);
  const extraBranches = detail?.detailEdges.filter(edge => detail.stage.branchDetailsEdgeIds.includes(edge.id)) ?? [];
  return <Stack spacing={2}>
    <Breadcrumbs aria-label="Flow location">
      {selected ? <Link component="button" underline="hover" onClick={() => onStageChange()}>Overview</Link> : <Typography color="text.primary">Overview</Typography>}
      {selected && <Typography color="text.primary">{selected.label}</Typography>}
    </Breadcrumbs>
    {!detail ? <>
      <Typography variant="body2" color="text.secondary">Open a stage to follow its pages and branches.</Typography>
      <Stepper nonLinear orientation="vertical" aria-label="Application stages" sx={{ maxWidth: 760, '& .MuiStepConnector-line': { minHeight: 16 } }}>
        {stages.filter(stage => !stage.related).map(stage => <Step key={stage.id} active completed={false}>
          <StepButton onClick={() => onStageChange(stage.id)} sx={{ py: 0.75, textAlign: 'left', '& .MuiStepLabel-labelContainer': { minWidth: 0 } }}>
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"><Typography variant="subtitle1">{stage.label}</Typography>{stage.actor && <Chip size="small" variant="outlined" label={stage.actor} />}<ChevronRightIcon fontSize="small" color="action" /></Stack>
              {stage.nodes.filter(node => node.pageId || node.pageGroupId).length > 1 && <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>{stage.nodes.filter(node => node.pageId || node.pageGroupId).map(node => node.label).join(' → ')}</Typography>}
            </Stack>
          </StepButton>
        </Step>)}
      </Stepper>
      {!!related.length && <Stack spacing={1} alignItems="flex-start" aria-label="Related processes">
        <Typography variant="subtitle2">Related processes</Typography>
        {related.map(stage => <Button key={stage.id} endIcon={<ChevronRightIcon />} onClick={() => onStageChange(stage.id)}>{stage.label}</Button>)}
      </Stack>}
    </> : <>
      <Box><Button startIcon={<ArrowBackIcon />} onClick={() => onStageChange()}>All stages</Button></Box>
      {selected?.actor && <Box><Chip size="small" variant="outlined" label={selected.actor} /></Box>}
      <Typography variant="body2" color="text.secondary">Select a page for details. “Go to” steps open another application stage.</Typography>
      {!!detail.stage.branchDetailsNodeIds.length && <Typography variant="body2" color="text.secondary">{detail.stage.nodes.filter(node => detail.stage.branchDetailsNodeIds.includes(node.id)).map(node => `Select “${node.label}” for its destination choices.`).join(' ')}</Typography>}
      {!!extraBranches.length && <Stack spacing={0.5}>{[...new Set(extraBranches.map(edge => edge.condition))].map(condition => <Typography key={condition} variant="body2" color="text.secondary">{condition}: select {extraBranches.filter(edge => edge.condition === condition).map(edge => detail!.stage.nodes.find(node => node.id === edge.source)!.label).join(', ')} for details.</Typography>)}</Stack>}
      <FlowDiagram key={detail.stage.id} definition={detail.definition} initialView="fit" compact onSelectNode={node => {
        const exit = detail.exits.find(exit => exit.nodeId === node.id);
        if (exit) onStageChange(exit.stageId);
        else onSelectNode(node);
      }} />
    </>}
  </Stack>;
}
