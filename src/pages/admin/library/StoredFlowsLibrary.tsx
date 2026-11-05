import { Alert, Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import BrowseTable from "../../../components/docs/BrowseTable";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import LibraryLink from "./LibraryLink";
import { storedFlowRows } from "./storedFlows";

export default function StoredFlowsLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const [search, setSearch] = useSearchParams();
  const flows = storedFlowRows(catalog, siteKey);
  const flowOrder = ['consumer', 'advisor', 'autosave', 'resume'];
  const ordered = [...flows].sort((a, b) => (flowOrder.indexOf(a.definition.id) < 0 ? 99 : flowOrder.indexOf(a.definition.id)) - (flowOrder.indexOf(b.definition.id) < 0 ? 99 : flowOrder.indexOf(b.definition.id)));
  const selectedId = search.get('flow') === 'save' ? 'autosave' : search.get('flow');
  const selected = ordered.find(flow => flow.definition.id === selectedId) ?? ordered[0];
  const pending = selectedId === 'emails' || selectedId === 'xml';
  const definition = pending ? null : selected?.definition;
  const tabId = pending ? selectedId : definition?.id ?? 'emails';
  const rows = definition?.nodes.flatMap((node, index) => {
    const outgoing = definition.edges.filter(edge => edge.source === node.id);
    return (outgoing.length ? outgoing : [null]).map(edge => ({
      id: edge?.id ?? node.id, step: String(index + 1), node,
      condition: edge?.condition ?? (edge ? 'Continue along modeled path' : 'End of modeled path'),
      next: edge ? definition.nodes.find(target => target.id === edge.target) : null,
    }));
  }) ?? [];
  return <Box>
    <Tabs aria-label="Flow views" value={tabId} onChange={(_, id: string) => setSearch(previous => {
      const next = new URLSearchParams(previous); next.set("flow", id); return next;
    }, { replace: true })} variant="scrollable" scrollButtons="auto" sx={{ my: 2 }}>
      {ordered.map(({ definition: flow }) => <Tab key={flow.id} value={flow.id} label={flow.id === 'autosave' ? 'Save' : flow.title} id={`flow-tab-${flow.id}`} aria-controls={`flow-panel-${flow.id}`} />)}
      <Tab value="emails" label="Emails (TBD)" id="flow-tab-emails" aria-controls="flow-panel-emails" /><Tab value="xml" label="XML (TBD)" id="flow-tab-xml" aria-controls="flow-panel-xml" />
    </Tabs>
    <Stack role="tabpanel" id={`flow-panel-${tabId}`} aria-labelledby={`flow-tab-${tabId}`} spacing={2}>
      {!definition ? <Alert severity="info">{pending ? `${selectedId === 'xml' ? 'XML' : 'Email'} flow decisions are TBD.` : 'No flows are configured.'}</Alert> : <>
        <Typography variant="body2">{definition.intro}</Typography>
        {siteKey !== 'all' && <Typography variant="caption" color="text.secondary">Resolution: {selected?.status}</Typography>}
        <BrowseTable label="Flow decisions" tableName="flow-decisions" hiddenColumns={['displayId']} rows={rows} rowKey={row => row.id} acceptUrlFilters={false} columns={[
          { id: 'step', label: 'Step', width: 90, value: row => row.step },
          { id: 'node', label: 'Action / decision', width: 260, value: row => row.node.label, render: row => row.node.pageId && catalog.data.pages.some(page => page.key === row.node.pageId) ? <LibraryLink domain="pages" filters={{ q: row.node.pageId }}>{row.node.label}</LibraryLink> : row.node.label },
          { id: 'condition', label: 'Condition / branch', width: 240, value: row => row.condition },
          { id: 'outcome', label: 'Behavior / outcome', width: 420, value: row => row.node.description ?? '—' },
          { id: 'next', label: 'Next step', width: 260, value: row => row.next ? `${definition.nodes.indexOf(row.next) + 1}. ${row.next.label}` : 'End' },
        ]} />
      </>}
    </Stack>
  </Box>;
}
