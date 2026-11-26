import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import { usePortalUser } from '../../admin/AccountContext';
import { Workspace, WorkspaceHeader } from '../../components/admin/AdminPrimitives';
import ResponsiveTableContainer from '../../components/docs/ResponsiveTableContainer';
import { getSitePagePrototypeUrl } from '../../config/sitePrototype';
import { getPageDefinitions } from '../../config/pages';
import { templateAssignmentPath, templateProperties, templateProperty, type TemplateEdit } from '../../domain/templateEdits.mjs';
import { useServiceData } from '../../hooks/useServiceData';
import { openTemplateEditor, templateEditorRequest, type TemplateDraft, type TemplateEditorData } from '../../services/templateEditor';
import TemplateEditorChat from './TemplateEditorChat';

const views = ['Shared template', 'Pages & flows', 'Site overrides', 'Drafts & releases'] as const;
type View = typeof views[number];
const statusLabels = { draft: 'Staged', discarded: 'Discarded', queued: 'Queued', publishing: 'Publishing', failed: 'Failed', published: 'Published' };

function previewUrl(draft: TemplateDraft, site: string, page: Parameters<typeof getSitePagePrototypeUrl>[1]) {
  const path = getPageDefinitions(site).find(definition => definition.id === page)?.path;
  const url = new URL(getSitePagePrototypeUrl(site, page, path));
  url.searchParams.set('templateDraft', draft.id);
  url.searchParams.set('draftVersion', String(draft.version));
  return url.href;
}

function DraftDetails({ data, draft, onEdit }: { data: TemplateEditorData; draft: TemplateDraft; onEdit?: (edit: TemplateEdit) => void }) {
  const [previewSite, setPreviewSite] = useState('');
  const affected = [...new Set(draft.impact.map(item => item.site))];
  const site = affected.includes(previewSite) ? previewSite : affected[0];
  const affectedPages = [...new Set(draft.impact.filter(item => item.site === site).flatMap(item => templateProperty(item.property)?.pages ?? []))];

  return <Stack gap={2}>
    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
      <Chip size="small" label={statusLabels[draft.status]} />
      <Typography>{draft.reason}</Typography>
    </Stack>
    {draft.conflict && <Alert severity="warning">A published value changed. Start a new draft with the current value.</Alert>}
    {draft.releaseError && <Alert severity="error">{draft.releaseError}</Alert>}
    {draft.status === 'queued' && <Alert severity="info">Queued for the release runner.</Alert>}
    <ResponsiveTableContainer>
      <Table size="small" aria-label="Draft assignments">
        <TableHead><TableRow><TableCell>Property</TableCell><TableCell>Scope</TableCell><TableCell>Previous assignment</TableCell><TableCell>Proposed assignment</TableCell>{onEdit && <TableCell />}</TableRow></TableHead>
        <TableBody>{draft.changes.map(edit => <TableRow key={`${edit.property}/${edit.site}`}>
          <TableCell>{templateProperty(edit.property)?.label}</TableCell><TableCell>{data.sites.find(site => site.key === edit.site)?.name ?? edit.site ?? 'Global template'}</TableCell>
          <TableCell>{edit.previous ?? 'Use global default'}</TableCell><TableCell>{edit.value ?? 'Use global default'}</TableCell>
          {onEdit && <TableCell><Button onClick={() => onEdit(edit)}>Edit</Button></TableCell>}
        </TableRow>)}</TableBody>
      </Table>
    </ResponsiveTableContainer>
    {draft.impact.length > 0 && <>
      <Typography component="h3" variant="subtitle1" fontWeight={700}>Site impact</Typography>
      <ResponsiveTableContainer>
        <Table size="small" aria-label="Effective Site impact">
          <TableHead><TableRow><TableCell>Property</TableCell><TableCell>Site</TableCell><TableCell>Published</TableCell><TableCell>Preview</TableCell><TableCell>Source in preview</TableCell></TableRow></TableHead>
          <TableBody>{draft.impact.map(item => <TableRow key={`${item.property}/${item.site}`}>
            <TableCell>{templateProperty(item.property)?.label}</TableCell><TableCell>{data.sites.find(site => site.key === item.site)?.name ?? item.site}</TableCell>
            <TableCell>{item.before}</TableCell><TableCell>{item.after}</TableCell><TableCell>{item.inherited ? 'Global template' : 'Site override'}</TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </ResponsiveTableContainer>
      {site && <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ sm: 'center' }}>
        <TextField select size="small" label="Preview Site" value={site} onChange={event => setPreviewSite(event.target.value)}>
          {affected.map(key => <MenuItem key={key} value={key}>{data.sites.find(candidate => candidate.key === key)?.name ?? key}</MenuItem>)}
        </TextField>
        {affectedPages.map(page => <Button key={page} href={previewUrl(draft, site, page)} target="_blank" rel="noopener noreferrer">Preview {getPageDefinitions(site).find(entry => entry.id === page)?.displayName ?? page}</Button>)}
      </Stack>}
    </>}
  </Stack>;
}

function Editor() {
  const { data, error, refresh } = useServiceData(openTemplateEditor);
  const [view, setView] = useState<View>(views[0]);
  const [propertyId, setPropertyId] = useState('');
  const [siteKeys, setSiteKeys] = useState<string[]>([]);
  const [value, setValue] = useState('');
  const [inherit, setInherit] = useState(false);
  const [reason, setReason] = useState('');
  const [draftId, setDraftId] = useState('');
  const [chatSession, setChatSession] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const draft = data?.drafts.find(entry => entry.id === draftId);
  const releasePending = draft?.status === 'queued' || draft?.status === 'publishing';
  useEffect(() => {
    if (!releasePending || busy) return;
    let timer: number;
    let cancelled = false;
    const check = async () => {
      await refresh();
      if (!cancelled) timer = window.setTimeout(() => void check(), 5000);
    };
    timer = window.setTimeout(() => void check(), 5000);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [releasePending, busy, refresh]);
  const options = templateProperties.filter(property => view === 'Site overrides' ? property.siteOverride : property.area === view);
  const property = options.find(entry => entry.id === propertyId) ?? options[0];

  const perform = async (operation: () => Promise<void>) => {
    setBusy(true);
    setErrorMessage('');
    try { await operation(); await refresh(); return true; }
    catch (failure) {
      setErrorMessage(failure instanceof Error ? failure.message : String(failure));
      return false;
    }
    finally { setBusy(false); }
  };

  if (!data) return error ? <Alert severity="error" action={<Button onClick={() => void refresh()}>Retry</Button>}>{error.message}</Alert> : <Typography role="status">Loading editor…</Typography>;
  const draftContext = draft?.status === 'draft' ? { id: draft.id, expectedVersion: draft.version } : {};
  const saveChanges = (changes: TemplateEdit[], editReason: string) => perform(async () => {
    const saved = await templateEditorRequest<TemplateDraft>({
      action: 'save', baseRevision: data.revision, ...draftContext, reason: editReason || draft?.reason, changes,
    });
    setDraftId(saved.id);
    setView('Drafts & releases');
  });
  const manualSave = () => {
    if (!property) return;
    const sites = view === 'Site overrides' ? siteKeys : [null];
    return saveChanges(sites.map(site => ({ property: property.id, site, value: inherit && site !== null ? null : value })), reason);
  };
  const editAssignment = (edit: TemplateEdit) => {
    setView(edit.site === null ? (templateProperty(edit.property)?.area as View) : 'Site overrides');
    setPropertyId(edit.property);
    setSiteKeys(edit.site ? [edit.site] : []);
    setValue(edit.value ?? '');
    setInherit(edit.value === null);
    setReason(draft?.reason ?? '');
  };
  const selectDraft = (id: string) => {
    setDraftId(id);
    setReason('');
    setChatSession(session => session + 1);
  };
  const transition = (action: string) => draft && perform(async () => {
    const updated = await templateEditorRequest<TemplateDraft>({ action, id: draft.id, expectedVersion: draft.version });
    selectDraft(updated.status === 'discarded' ? '' : updated.id);
  });

  return <Stack spacing={2}>
    {(errorMessage || error) && <Alert severity="error">{errorMessage || error?.message}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' }, gap: 2, alignItems: 'start' }}>
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Tabs value={view} onChange={(_, next: View) => { setView(next); setValue(''); setInherit(false); }} variant="scrollable" scrollButtons="auto" aria-label="Editor views">
          {views.map(label => <Tab key={label} label={label} value={label} />)}
        </Tabs>
        <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
          {view === 'Drafts & releases' ? <>
            <Stack direction="row" gap={1} alignItems="center">
              <TextField select label="Open a draft or release" value={draft?.id ?? ''} onChange={event => selectDraft(event.target.value)} fullWidth>
                <MenuItem value="">Choose a draft or release</MenuItem>
                {data.drafts.map(entry => <MenuItem key={entry.id} value={entry.id}>{statusLabels[entry.status]} · {entry.reason}</MenuItem>)}
              </TextField>
              <Button disabled={busy} onClick={() => void perform(async () => {})}>Refresh</Button>
            </Stack>
            {draft && <DraftDetails key={draft.id} data={data} draft={draft} onEdit={draftContext.id && !draft.conflict ? editAssignment : undefined} />}
            {draft && <Stack direction="row" gap={1} flexWrap="wrap">
              {draft.status === 'draft' && <Button variant="contained" disabled={busy || draft.conflict} onClick={() => setPublishing(true)}>Publish</Button>}
              {(draft.status === 'draft' || draft.status === 'queued' || draft.status === 'failed' && !draft.targetRevision) && <Button disabled={busy} onClick={() => void transition('discard')}>Discard draft</Button>}
              {draft.status === 'failed' && <Button disabled={busy} onClick={() => void transition('retry')}>Retry release</Button>}
              {draft.status === 'published' && <Button disabled={busy} onClick={() => void transition('revert')}>Revert this change</Button>}
              <Button disabled={busy} onClick={() => { selectDraft(''); setView('Shared template'); }}>New draft</Button>
            </Stack>}
          </> : property && <>
            <Typography component="h2" variant="h6">{view}</Typography>
            <TextField select label="Property" value={property.id} onChange={event => { setPropertyId(event.target.value); setValue(''); setInherit(false); }}>
              {options.map(entry => <MenuItem key={entry.id} value={entry.id}>{entry.label}</MenuItem>)}
            </TextField>
            <Typography variant="body2">Used in {property.usage}.</Typography>
            <Typography variant="caption" color="text.secondary">{property.source}</Typography>
            <Typography variant="body2" color="text.secondary">Global default · {data.values[property.id].global.effective}</Typography>
            {view === 'Site overrides' && <>
              <Typography component="h3" variant="subtitle2">Apply to Sites</Typography>
              <Stack direction="row" flexWrap="wrap">
                {data.sites.map(site => <FormControlLabel key={site.key} label={site.name} control={<Checkbox checked={siteKeys.includes(site.key)} onChange={(_, checked) => setSiteKeys(keys => checked ? [...keys, site.key] : keys.filter(key => key !== site.key))} />} />)}
              </Stack>
              {siteKeys.map(site => <Stack key={site}>
                <Typography variant="body2">{data.sites.find(entry => entry.key === site)?.name} · {data.values[property.id][site].effective} ({data.values[property.id][site].assigned === null ? 'inherited' : 'override'})</Typography>
                <Typography variant="caption" color="text.secondary">{templateAssignmentPath(site)}</Typography>
              </Stack>)}
              <FormControlLabel label="Use global default" control={<Checkbox checked={inherit} onChange={(_, checked) => setInherit(checked)} />} />
            </>}
            <TextField label="Proposed wording" value={value} disabled={inherit} onChange={event => setValue(event.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} />
            <TextField label="Reason for the edit" value={reason} placeholder={draft?.status === 'draft' ? draft.reason : undefined} onChange={event => setReason(event.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
            <Box><Button variant="contained" disabled={busy || !value.trim() && !inherit || !reason.trim() && !draftContext.id || view === 'Site overrides' && !siteKeys.length} onClick={() => void manualSave()}>{draftContext.id ? 'Save to draft' : 'Save draft'}</Button></Box>
          </>}
        </Stack>
      </Paper>
      <TemplateEditorChat key={chatSession} data={data} busy={busy}
        draftReason={draftContext.id ? draft?.reason : undefined} onSave={saveChanges} />
    </Box>
    <Dialog open={publishing} onClose={() => setPublishing(false)}>
      <DialogTitle>Publish this draft?</DialogTitle>
      <DialogContent>The draft will be queued to update the Library and its published Sites.</DialogContent>
      <DialogActions><Button onClick={() => setPublishing(false)}>Cancel</Button><Button onClick={() => { setPublishing(false); void transition('queue'); }}>Queue publication</Button></DialogActions>
    </Dialog>
  </Stack>;
}

export default function TemplateEditorWorkspace() {
  const user = usePortalUser();
  return <Workspace>
    <WorkspaceHeader title="Template & Site Editor" description="Review and stage changes to shared template wording and Site assignments." />
    {user?.roleKey === 'portal-admin' ? <Editor /> : <Alert severity="info">Portal Admin access is required.</Alert>}
  </Workspace>;
}
