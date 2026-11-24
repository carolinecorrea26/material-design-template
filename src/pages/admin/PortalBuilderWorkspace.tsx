import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useCanEdit } from '../../admin/AccountContext';
import { Workspace, WorkspaceHeader } from '../../components/admin/AdminPrimitives';
import { getSitePrototypeUrl } from '../../config/sitePrototype';
import { useServiceData } from '../../hooks/useServiceData';
import { readSharedCatalog } from '../../persistence/sharedCatalog';
import { readPortalSites } from '../../services/portalClient';
import { createPortalDraft, listPortalDrafts, openPortalDraft, savePortalDraft, type PortalDraft } from '../../services/portalDrafts';

async function loadBuilder() {
  const [sites, drafts, catalog] = await Promise.all([readPortalSites(), listPortalDrafts(), readSharedCatalog()]);
  return { sites, drafts, revision: catalog.revision };
}

function previewUrl(draft: PortalDraft) {
  const url = new URL(getSitePrototypeUrl(draft.siteKey));
  url.searchParams.set('portalDraft', draft.id);
  return url.href;
}

export default function PortalBuilderWorkspace() {
  const canEdit = useCanEdit();
  const { data, error, loading, refresh } = useServiceData(loadBuilder);
  const [siteKey, setSiteKey] = useState('');
  const [draft, setDraft] = useState<PortalDraft | null>(null);
  const [layout, setLayout] = useState<PortalDraft['formTemplate']>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const site = data?.sites.find(candidate => candidate.key === siteKey);
  const available = data?.drafts.find(candidate => candidate.siteKey === siteKey);
  const hasUnsavedChanges = draft !== null && draft.formTemplate !== layout;

  async function update(task: () => Promise<PortalDraft>) {
    setBusy(true);
    setActionError('');
    try {
      const saved = await task();
      setDraft(saved);
      setLayout(saved.formTemplate);
      await refresh();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }

  return <Workspace>
    <WorkspaceHeader title="Site Builder" description="Save and preview a draft layout for an enrolled Site." />
    {loading && <Typography role="status">Loading Sites and drafts…</Typography>}
    {error && <Alert severity="error" action={<Button onClick={() => void refresh()}>Retry</Button>}>{error.message}</Alert>}
    {actionError && <Alert severity="error">{actionError}</Alert>}
    {data && <Paper variant="outlined" sx={{ p: 2.5, maxWidth: 680 }}>
      <Stack spacing={2}>
        <TextField select label="Site" value={siteKey} disabled={busy} onChange={event => {
          setSiteKey(event.target.value); setDraft(null); setLayout(null); setActionError('');
        }} sx={{ maxWidth: 420 }}>
          <MenuItem value="" disabled>Choose a Site</MenuItem>
          {data.sites.map(item => <MenuItem key={item.key} value={item.key}>{item.name}</MenuItem>)}
        </TextField>
        {site && <Stack direction="row" gap={1} flexWrap="wrap">
          {available ? <Button disabled={busy || draft?.id === available.id && !hasUnsavedChanges && !actionError} onClick={() => void update(() => openPortalDraft(available.id))}>Reopen draft</Button>
            : <Button disabled={busy || !canEdit} variant="contained" onClick={() => void update(() => createPortalDraft(site.key, data.revision))}>Start draft</Button>}
        </Stack>}
        {draft && <>
          <TextField select label="Application layout" value={layout ?? ''} disabled={!canEdit || busy} onChange={event => setLayout(event.target.value === 'single' || event.target.value === 'multi' ? event.target.value : null)} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }} sx={{ maxWidth: 420 }}>
            <MenuItem value="">Use published Site layout</MenuItem>
            <MenuItem value="multi">Multi-page</MenuItem>
            <MenuItem value="single">Single-page</MenuItem>
          </TextField>
          <Typography variant="body2" color="text.secondary">Saved version {draft.version} · {new Date(draft.updatedAt).toLocaleString()}</Typography>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button variant="contained" disabled={!canEdit || busy || !hasUnsavedChanges} onClick={() => void update(() => savePortalDraft(draft, layout))}>Save draft</Button>
            <Button href={previewUrl(draft)} target="_blank" rel="noopener noreferrer">Open saved preview</Button>
          </Stack>
        </>}
      </Stack>
    </Paper>}
  </Workspace>;
}
