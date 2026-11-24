import { confirmedRequirementBehaviors } from '../../../domain/requirementBehaviors';
import { useState } from 'react';
import FlowDiagram from '../../../components/docs/flows/FlowDiagram';
import StagedFlowDiagram from '../../../components/docs/flows/StagedFlowDiagram';
import FlowEmailPreviews from '../../../components/docs/flows/FlowEmailPreviews';
import { flowStages } from '../../../domain/flowStages.mjs';
import AppDrawer from '../../../components/layout/AppDrawer';
import ComponentExamplePreview from '../../../components/docs/ComponentExamplePreview';
import { flowComponentExample } from './flowPresentation';
import { emailTemplateRows } from '../../../components/docs/emailTemplateRows';
import CommunicationsLibrary from './CommunicationsLibrary';
import { Alert, Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import BrowseTable from "../../../components/docs/BrowseTable";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import LibraryLink from "./LibraryLink";
import { storedFlowRows } from "./storedFlows";
import { humanize, readableValue } from './libraryRecordColumns';

export default function StoredFlowsLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const [inspected, setInspected] = useState<string>();
  const [search, setSearch] = useSearchParams();
  const flows = storedFlowRows(catalog, siteKey);
  const requirementNames = new Map(confirmedRequirementBehaviors().map(record => [record.id, record.name]));
  const flowOrder = ['consumer', 'advisor', 'autosave', 'resume'];
  const ordered = [...flows].sort((a, b) => (flowOrder.indexOf(a.definition.id) < 0 ? 99 : flowOrder.indexOf(a.definition.id)) - (flowOrder.indexOf(b.definition.id) < 0 ? 99 : flowOrder.indexOf(b.definition.id)));
  const selectedId = search.get('flow') === 'save' ? 'autosave' : search.get('flow');
  const selected = ordered.find(flow => flow.definition.id === selectedId) ?? ordered[0];
  const definition = selectedId === 'emails' ? null : selected?.definition;
  const tabId = selectedId === 'emails' ? selectedId : definition?.id ?? 'emails';
  const rows = definition?.nodes.map((node, index) => ({
    id: node.id, step: String(index + 1), node,
    preview: flowComponentExample(node, catalog.data.components),
    outgoing: definition.edges.filter(edge => edge.source === node.id).map(edge => ({ ...edge, targetIndex: definition.nodes.findIndex(node => node.id === edge.target) + 1, targetLabel: definition.nodes.find(node => node.id === edge.target)!.label })),
    emails: (node.emailTemplateKeys ?? []).filter(key => siteKey === 'all' || catalog.data.siteEmailTemplates.some(assignment => assignment.siteKey === siteKey && assignment.emailTemplateKey === key && assignment.enabled)).map(key => {
      const template = emailTemplateRows.find(template => template.type === key)!;
      return { ...template, key, label: template.title, recipient: node.emailRecipient ?? template.recipient };
    }),
  })) ?? [];
  const display = search.get('view') === 'steps' ? 'steps' : 'diagram';
  const detail = rows.find(row => `${definition?.id}:${row.id}` === inspected);
  const stage = definition && flowStages(definition, selected?.stageContent).find(stage => stage.id === search.get('stage'));
  const stageEmails = [...new Map(rows.filter(row => stage?.nodes.some(node => node.id === row.id)).flatMap(row => row.emails).map(email => [`${email.key}:${email.recipient}`, email])).values()];
  const emailSiteId = siteKey === 'all' ? 'demo' : siteKey;
  const inspectNode = (id: string) => {
    const stage = definition && flowStages(definition, selected?.stageContent).find(stage => stage.nodes.some(node => node.id === id));
    if (stage && search.get('stage') && search.get('stage') !== stage.id) setSearch(previous => { const next = new URLSearchParams(previous); next.set('stage', stage.id); return next; });
    setInspected(`${definition?.id}:${id}`);
  };
  return <Box>
    <Tabs aria-label="Flow views" value={tabId} onChange={(_, id: string) => setSearch(previous => {
      const next = new URLSearchParams(previous); next.set("flow", id); return next;
    }, { replace: true })} variant="scrollable" scrollButtons="auto" sx={{ my: 2 }}>
      {ordered.map(({ definition: flow }) => <Tab key={flow.id} value={flow.id} label={flow.id === 'autosave' ? 'Save' : flow.title} id={`flow-tab-${flow.id}`} aria-controls={`flow-panel-${flow.id}`} />)}
      <Tab value="emails" label="Emails" id="flow-tab-emails" aria-controls="flow-panel-emails" />
    </Tabs>
    <Stack role="tabpanel" id={`flow-panel-${tabId}`} aria-labelledby={`flow-tab-${tabId}`} spacing={2}>
      {selectedId === 'emails' ? <CommunicationsLibrary siteKey={siteKey} /> : !definition ? <Alert severity="info">No flows are configured.</Alert> : <>
        <Typography variant="body2">{definition.intro}</Typography>
        <Tabs aria-label="Flow presentation" value={display} onChange={(_, value: string) => setSearch(previous => { const next = new URLSearchParams(previous); next.set('view', value); return next; }, { replace: true })}>
          <Tab label="Diagram" value="diagram" /><Tab label="Steps" value="steps" />
        </Tabs>
        {(!definition.stages || display === 'steps') && <Typography variant="body2" color="text.secondary">{display === 'diagram' ? 'Follow the labelled branches. Select a step for its description, rules, settings and existing component example. Dashed arrows indicate a return or hand-back.' : 'Each step appears once; its alternatives are listed under Next / branches.'}</Typography>}
        {siteKey !== 'all' && <Typography variant="caption" color="text.secondary">Resolution: {selected?.status}</Typography>}
        {display === 'diagram' ? definition.stages ? <StagedFlowDiagram definition={definition} stageContent={selected?.stageContent} stageId={search.get('stage')} onStageChange={id => {
          setInspected(undefined);
          setSearch(previous => { const next = new URLSearchParams(previous); if (id) next.set('stage', id); else next.delete('stage'); return next; });
        }} onSelectNode={node => setInspected(`${definition.id}:${node.id}`)} /> : <FlowDiagram key={definition.id} definition={definition} onSelectNode={node => setInspected(`${definition.id}:${node.id}`)} /> : <BrowseTable label="Flow decisions" tableName="flow-decisions" hiddenColumns={['displayId']} rows={rows} rowKey={row => row.id} acceptUrlFilters={false} columns={[
          { id: 'step', label: '#', width: 90, value: row => row.step },
          { id: 'node', label: 'Step', width: 240, value: row => row.node.label },
          { id: 'screen', label: 'Component preview', width: 460, value: row => row.preview?.example?.label ?? row.preview?.component.definition.displayName ?? (row.node.pageGroupId ? 'Applicable page examples' : row.node.pageId ? 'Page example not registered' : row.node.emailTemplateKeys?.length && row.node.kind === 'external' ? 'Email' : 'System step'),
            render: row => row.preview ? <ComponentExamplePreview component={row.preview.component} example={row.preview.example} /> : row.node.pageGroupId ? <Stack spacing={1}>{catalog.data.pages.filter(page => page.definition.groupId === row.node.pageGroupId).map(page => {
              const preview = flowComponentExample({ ...row.node, pageId: page.definition.id }, catalog.data.components);
              return preview ? <ComponentExamplePreview key={page.key} component={preview.component} example={preview.example} /> : null;
            })}</Stack> : row.node.emailTemplateKeys?.length && row.node.kind === 'external' ? 'Email — open the configured message' : row.node.pageId ? 'Page example not registered' : 'System step' },
          { id: 'emails', label: 'Email', width: 420, value: row => row.emails.map(email => `${email.recipient}: ${email.label}`).join('; ') || '—', render: row => row.emails.length ? <FlowEmailPreviews emails={row.emails} siteId={emailSiteId} /> : row.node.emailTemplateKeys?.length ? 'Not enabled for this Site' : '—' },
          { id: 'outcome', label: 'What happens', width: 420, value: row => [row.node.description ?? '—', ...(row.node.flowIds ?? []).map(id => flows.find(flow => flow.definition.id === id)?.definition.title ?? id)].join('\n'), render: row => <Stack spacing={0.75}><Typography variant="body2">{row.node.description ?? '—'}</Typography>{row.node.flowIds?.map(id => <LibraryLink key={id} domain="flows" filters={{ flow: id }}>{flows.find(flow => flow.definition.id === id)?.definition.title ?? id}</LibraryLink>)}</Stack> },
          { id: 'settings', label: siteKey === 'all' ? 'Global settings' : 'Effective Site settings', width: 260, value: row => (row.node.configurationPaths ?? []).map(key => `${humanize(key.split('.').at(-1)!)}: ${readableValue(selected?.settings.find(setting => setting.key === key)?.value)}`).join('\n') || '—', render: row => row.node.configurationPaths?.length ? <Stack spacing={1}>{row.node.configurationPaths.map(key => <Stack key={key}><LibraryLink domain="configurations" filters={{ q: key }}>{humanize(key.split('.').at(-1)!)}</LibraryLink><Typography variant="body2">{readableValue(selected?.settings.find(setting => setting.key === key)?.value)}</Typography></Stack>)}</Stack> : '—' },
          { id: 'next', label: 'Next / branches', width: 300, value: row => row.outgoing.map(edge => `${edge.condition ? `${edge.condition}: ` : ''}${edge.targetIndex}. ${edge.targetLabel}`).join('\n') || 'End', render: row => row.outgoing.length ? <Stack spacing={1}>{row.outgoing.map(edge => <Typography key={edge.id} variant="body2">{edge.condition && <strong>{edge.condition}: </strong>}{edge.targetIndex}. {edge.targetLabel}</Typography>)}</Stack> : 'End' },
        ]} />}
        {display === 'diagram' && !!stageEmails.length && <Stack spacing={1} component="section" aria-label="Emails in this stage"><Typography variant="subtitle1">Emails in this stage</Typography><FlowEmailPreviews emails={stageEmails} siteId={emailSiteId} /></Stack>}
        <AppDrawer open={!!detail} onClose={() => setInspected(undefined)} title={detail?.node.label}>
          {detail && <Stack spacing={2}>
            <Typography variant="body2">{detail.node.description}</Typography>
            <Typography variant="subtitle2">Next / branches</Typography>
            {detail.outgoing.length ? detail.outgoing.map(edge => <Box key={edge.id}><Typography variant="body2">{edge.condition}</Typography><Button variant="text" onClick={() => inspectNode(edge.target)}>{edge.targetLabel}</Button></Box>) : <Typography variant="body2">End</Typography>}
            {detail.preview && <ComponentExamplePreview component={detail.preview.component} example={detail.preview.example} />}
            {detail.node.pageId && <LibraryLink domain="pages" filters={{ q: detail.node.pageId }}>Page definition</LibraryLink>}
            {detail.node.pageGroupId && catalog.data.pages.filter(page => page.definition.groupId === detail.node.pageGroupId).map(page => <LibraryLink key={page.key} domain="pages" filters={{ q: page.key }}>{page.definition.displayName}</LibraryLink>)}
            {detail.node.flowIds?.map(id => <LibraryLink key={id} domain="flows" filters={{ flow: id }}>Related flow: {flows.find(flow => flow.definition.id === id)?.definition.title ?? id}</LibraryLink>)}
            {!!detail.emails.length && <FlowEmailPreviews emails={detail.emails} siteId={emailSiteId} initiallyExpanded={detail.node.kind === 'external'} />}
            {detail.node.ruleKeys?.map(key => <LibraryLink key={key} domain="rules" filters={{ q: key }}>{requirementNames.get(key) ?? catalog.data.rules.find(rule => rule.key === key)?.definition.rule ?? key}</LibraryLink>)}
            {detail.node.workflowKeys?.map(key => <LibraryLink key={key} domain="rules" filters={{ q: key }}>{requirementNames.get(key) ?? key}</LibraryLink>)}
            {detail.node.configurationPaths?.map(key => <Box key={key}><LibraryLink domain="configurations" filters={{ q: key }}>{humanize(key.split('.').at(-1)!)}</LibraryLink><Typography variant="body2">{readableValue(selected?.settings.find(setting => setting.key === key)?.value)}</Typography></Box>)}
          </Stack>}
        </AppDrawer>
      </>}
    </Stack>
  </Box>;
}
