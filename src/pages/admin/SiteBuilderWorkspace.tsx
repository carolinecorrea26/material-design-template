import { useCanEdit } from '../../admin/AccountContext';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Autocomplete, Button, MenuItem, Paper, Stack, Step, StepLabel, Stepper, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { mockRequest } from '../../mock/client';
import LibraryDraftEditor from './LibraryDraftEditor';
import { createLibraryDraft, isLibraryDraft, type LibraryDraft } from '../../domain/libraryDraft';
import { createSiteBuild, newBuildKey, type SiteBuildIdentity } from '../../domain/siteBuild';
import { createPortalDataRepository } from '../../repositories/portalDataRepository';
import { persistence } from '../../persistence/client';
import type { Json } from '../../persistence/types';
import { siteEntities, clientEntities } from '../../data/registry';
import { siteBuilderService, type BuilderDraftView } from '../../services/siteBuilderService';
import { buildPreviewUrl } from '../../services/prototypeReleaseService';
import { DEMO_ACTOR } from '../../services/serviceUtils';
import { useServiceData } from '../../hooks/useServiceData';
import { StatusChip, Workspace, WorkspaceHeader } from '../../components/admin/AdminPrimitives';
import ResponsiveTableContainer from '../../components/docs/ResponsiveTableContainer';
import ThemeConfigurationPreview from '../../components/docs/ThemeConfigurationPreview';
import LibrarySiteSelector, { useLibrarySelection } from './library/LibrarySiteSelector';
import { LibraryCatalogProvider, useLibraryCatalog } from './library/LibraryCatalogContext';
import { resolvePrototypeLibrary } from '../../domain/prototypeLibrary';

function SavedThemePreview({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const client = siteKey === 'all' ? undefined : resolvePrototypeLibrary(catalog.data, siteKey, catalog.revision).client;
  return <ThemeConfigurationPreview key={siteKey} client={client} />;
}

const steps = ['TPA', 'Client', 'Site and template', 'Library configuration', 'Site review', 'Scheduled launch'];
const initial: SiteBuildIdentity = { siteKey: '', siteName: '', template: 'multi', organizationKey: '', organizationName: '', clientKey: '', clientName: '', newOrganization: false, newClient: false };
const required = (value?: string) => !!value?.trim();
const emailValid = (value?: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? '');
const editable = (row: BuilderDraftView) => row.canEdit ?? row.ownerId === DEMO_ACTOR;
const sources = [...siteEntities].sort((a, b) => (clientEntities.find(c => c.id === a.clientId)?.acronym ?? a.clientId).localeCompare(clientEntities.find(c => c.id === b.clientId)?.acronym ?? b.clientId) || a.id.localeCompare(b.id));
export default function SiteBuilderWorkspace() {
  const [search] = useSearchParams();
  const [previewSite, setPreviewSite] = useLibrarySelection();
  const canEdit = useCanEdit();
  const { data, error, loading, refresh } = useServiceData(() => siteBuilderService.getDrafts({ includeArchived: true }));
  const [tab, setTab] = useState(search.get('view') === 'theme' ? 'theme' : 'new'), [step, setStep] = useState(0), [identity, setIdentity] = useState(initial);
  const [editing, setEditing] = useState<{ id: string; draft: LibraryDraft } | null>(null);
  const [draftSite, setDraftSite] = useState('demo'), [draftError, setDraftError] = useState(''), [busy, setBusy] = useState(false);
  const [activeBuildStep, setActiveBuildStep] = useState(3);
  const [source, setSource] = useState<LibraryDraft | null>(null);
  const loadLibrary = async () => {
    if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) {
      const saved = await mockRequest<{ payload: LibraryDraft; draft: LibraryDraft['mockTransport'] }>('/prototype/library', { siteKey: draftSite });
      if (!isLibraryDraft(saved.payload)) throw new Error('Invalid persisted prototype Library');
      const catalog = await mockRequest<{ data: Pick<LibraryDraft['data'], 'organizations' | 'organizationProfiles' | 'clients'> }>('/library/catalog', { siteKey: 'all', tables: ['organizations', 'organizationProfiles', 'clients'] });
      const added = await mockRequest<Pick<LibraryDraft['data'], 'configurationValues' | 'brandingProfiles' | 'supportProfiles'>>('/builder/catalog', {});
      const data = { ...structuredClone(saved.payload.data), ...catalog.data };
      for (const key of ['configurationValues', 'brandingProfiles', 'supportProfiles'] as const) {
        const current = data[key] as { id: string }[];
        const ids = new Set(current.map(r => r.id));
        current.push(...(added[key] ?? []).filter(r => !ids.has(r.id)));
      }
      return { ...saved.payload, data, ...(saved.draft ? { mockTransport: saved.draft } : {}) };
    }
    const draft = createLibraryDraft(await createPortalDataRepository(persistence).open(), draftSite);
    draft.data.organizations = await persistence.list('organizations');
    draft.data.organizationProfiles = await persistence.list('organizationProfiles');
    return draft;
  };
  const run = async (fn: () => Promise<void>) => { setBusy(true); setDraftError(''); try { await fn(); } catch(e) { setDraftError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } };
  const patch = (value: Partial<SiteBuildIdentity>) => setIdentity(current => ({ ...current, ...value }));
  const organizations = [...(source?.data.organizations ?? [])].filter(o => !/Compatibility TPA|not recorded in MCR/.test(o.name)).sort((a, b) => a.name.localeCompare(b.name));
  const clients = source?.data.clients.filter(c => c.organizationId === organizations.find(o => o.key === identity.organizationKey)?.id).sort((a, b) => a.acronym.localeCompare(b.acronym)) ?? [];
  const valid = step === 0 ? required(identity.organizationKey) && required(identity.organizationName) && (!identity.newOrganization || [identity.organizationAcronym, identity.organizationContact, identity.organizationPhone].every(required) && emailValid(identity.organizationEmail)) : step === 1 ? required(identity.clientKey) && required(identity.clientName) && (!identity.newClient || [identity.clientAcronym, identity.clientContact, identity.clientPhone].every(required) && emailValid(identity.clientEmail)) : required(identity.siteName);
  const details = (kind: 'organization' | 'client') => <>
    <TextField required label={kind === 'organization' ? 'TPA name' : 'Client name'} value={identity[`${kind}Name`]} onChange={e => patch({ [`${kind}Name`]: e.target.value })} />
    <TextField required label="Acronym" helperText="The short name people use for this organization." value={identity[`${kind}Acronym`] ?? ''} onChange={e => patch({ [`${kind}Acronym`]: e.target.value })} />
    <TextField required label="Contact name" value={identity[`${kind}Contact`] ?? ''} onChange={e => patch({ [`${kind}Contact`]: e.target.value })} />
    <TextField required type="email" label="Contact email" value={identity[`${kind}Email`] ?? ''} onChange={e => patch({ [`${kind}Email`]: e.target.value })} />
    <TextField required type="tel" label="Contact phone" value={identity[`${kind}Phone`] ?? ''} onChange={e => patch({ [`${kind}Phone`]: e.target.value })} />
    {kind === 'client' && <TextField label="Logo image URL (optional)" helperText="Use the client's approved image. Branding can also be completed during Library configuration." value={identity.clientLogo ?? ''} onChange={e => patch({ clientLogo: e.target.value })} />}
  </>;
  return <Workspace><WorkspaceHeader title="Site Builder" description="Build a Site, review its complete journey, then schedule its prototype release." />
    <Tabs value={tab} onChange={(_, value) => { setTab(value); setDraftError(''); }} aria-label="Site Builder views" variant="scrollable" scrollButtons="auto"><Tab value="new" label="Build new site" /><Tab value="progress" label="Sites in progress" /><Tab value="theme" label="Application theme preview" /></Tabs>
    {tab === 'theme' && <><LibrarySiteSelector siteId={previewSite} onChange={setPreviewSite} /><LibraryCatalogProvider siteKey={previewSite}><SavedThemePreview siteKey={previewSite} /></LibraryCatalogProvider></>}
    {draftError && <Alert severity="error">{draftError}</Alert>}
    {tab === 'new' && <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={3}>
      <Stepper activeStep={source ? step : 0} alternativeLabel sx={{ overflowX: 'auto' }}>{steps.slice(0, 3).map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
      {!source ? <Stack spacing={2} sx={{ maxWidth: 640 }}><Typography>Choose the Library configuration to use as a starting point.</Typography><Autocomplete disableClearable options={sources} value={sources.find(s => s.id === draftSite)!} getOptionLabel={s => `${clientEntities.find(c => c.id === s.clientId)?.acronym ?? s.clientId} · ${s.id}`} onChange={(_, site) => setDraftSite(site.id)} renderInput={params => <TextField {...params} required label="Starting Library site" />} /><Button variant="contained" disabled={!canEdit || busy} onClick={() => void run(async () => { setSource(await loadLibrary()); setIdentity({ ...initial, siteKey: newBuildKey('site') }); setStep(0); })}>Start site build</Button></Stack> : <Stack component="form" onSubmit={event => { event.preventDefault(); if (!valid || busy) return; if (step < 2) { setStep(step + 1); return; } void run(async () => {
        const draft = createSiteBuild(source, identity);
        const site = draft.data.sites.find(s => s.key === draft.siteKey)!;
        const row = await siteBuilderService.createDraft({ clientId: site.clientId, siteKey: site.key, siteName: site.name, status: 'Draft', currentStep: 'Library configuration', draftDataJson: draft as unknown as Json });
        setEditing({ id: row.id, draft: isLibraryDraft(row.draftDataJson) ? row.draftDataJson : draft }); setActiveBuildStep(3); setTab('progress'); setSource(null); await refresh();
      }); }} spacing={2} sx={{ maxWidth: 640 }}>
        {step === 0 && <><TextField required select label="TPA selection" value={identity.newOrganization ? 'new' : 'existing'} onChange={e => { const isNew = e.target.value === 'new'; patch({ newOrganization: isNew, newClient: isNew, organizationKey: isNew ? newBuildKey('tpa') : '', organizationName: '', clientKey: isNew ? newBuildKey('client') : '', clientName: '' }); }}><MenuItem value="existing">Existing TPA</MenuItem><MenuItem value="new">Add new TPA</MenuItem></TextField>{identity.newOrganization ? details('organization') : <Autocomplete options={organizations} value={organizations.find(o => o.key === identity.organizationKey) ?? null} getOptionLabel={o => o.name} onChange={(_, o) => patch({ organizationKey: o?.key ?? '', organizationName: o?.name ?? '', clientKey: '', clientName: '' })} renderInput={params => <TextField {...params} required label="TPA" />} />}</>}
        {step === 1 && <><TextField required select label="Client selection" value={identity.newClient ? 'new' : 'existing'} disabled={identity.newOrganization} onChange={e => patch({ newClient: e.target.value === 'new', clientKey: e.target.value === 'new' ? newBuildKey('client') : '', clientName: '' })}><MenuItem value="existing">Existing client under this TPA</MenuItem><MenuItem value="new">Add new client</MenuItem></TextField>{identity.newClient ? details('client') : <Autocomplete options={clients} value={clients.find(c => c.key === identity.clientKey) ?? null} getOptionLabel={c => `${c.acronym} · ${c.name}`} onChange={(_, c) => patch({ clientKey: c?.key ?? '', clientName: c?.name ?? '' })} renderInput={params => <TextField {...params} required label="Client" />} />}</>}
        {step === 2 && <><TextField required label="Site name" value={identity.siteName} onChange={e => patch({ siteName: e.target.value })} /><TextField required select label="Template type" value={identity.template} onChange={e => patch({ template: e.target.value as 'single' | 'multi' })}><MenuItem value="multi">Multi-page journey</MenuItem><MenuItem value="single">Single-page journey</MenuItem></TextField><Alert severity="info">Starts with {draftSite}'s Library configuration. Review copied product rules and branding before launch.</Alert></>}
        <Stack direction="row" spacing={1}><Button disabled={!canEdit || busy} onClick={() => setSource(null)}>Cancel</Button>{step > 0 && <Button disabled={!canEdit || busy} onClick={() => setStep(step - 1)}>Back</Button>}<Button type="submit" variant="contained" disabled={!canEdit || !valid || busy}>{step < 2 ? 'Continue' : 'Create and configure site'}</Button></Stack>
      </Stack>}
    </Stack></Paper>}
    {tab === 'progress' && <>
      <Typography color="text.secondary">See all builds. Caroline can edit, resume, or archive the Sites she started.</Typography>
      {error && <Alert severity="error">{error.message}</Alert>}{loading && <Typography>Loading builds…</Typography>}
      <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Site</TableCell><TableCell>Started by</TableCell><TableCell>Progress</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{data?.map(draft => <TableRow key={draft.id}><TableCell>{draft.siteName}</TableCell><TableCell>{draft.ownerId ?? 'Unassigned'}</TableCell><TableCell>{draft.currentStep}</TableCell><TableCell><StatusChip label={draft.deletedAt ? 'Archived' : draft.status} /></TableCell><TableCell><Stack direction="row" flexWrap="wrap">{isLibraryDraft(draft.draftDataJson) && <Button component="a" href={buildPreviewUrl(draft.draftDataJson)} target="_blank" rel="noopener noreferrer">View site</Button>}{canEdit && editable(draft) ? <><Button disabled={!!draft.deletedAt || !isLibraryDraft(draft.draftDataJson)} onClick={() => { if (isLibraryDraft(draft.draftDataJson)) { setEditing({ id: draft.id, draft: draft.draftDataJson }); setActiveBuildStep(3); } }}>Resume build / review</Button><Button disabled={!canEdit || busy} onClick={() => void run(async () => { await (draft.deletedAt ? siteBuilderService.restoreDraft(draft.id) : siteBuilderService.archiveDraft(draft.id)); if (editing?.id === draft.id) setEditing(null); await refresh(); })}>{draft.deletedAt ? 'Restore' : 'Archive'}</Button></> : <Typography variant="caption" sx={{ p: 1 }}>View only</Typography>}</Stack></TableCell></TableRow>)}{!loading && !data?.length && <TableRow><TableCell colSpan={5}>No builds started yet.</TableCell></TableRow>}</TableBody></Table></ResponsiveTableContainer>
      {editing && <><Stepper activeStep={activeBuildStep} alternativeLabel sx={{ overflowX: 'auto' }}>{steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper><LibraryDraftEditor key={editing.id} draft={editing.draft} onViewChange={view => setActiveBuildStep(view === 'configure' ? 3 : 4)} onSave={async draft => {
        let savedDraft = draft;
        if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) {
          const { mockTransport, ...payload } = draft;
          const saved = await mockRequest<{ id: string; version: number; baseReleaseId: string | null }>('/library/save', { id: mockTransport?.id, expectedVersion: mockTransport?.version ?? 0, payload });
          savedDraft = { ...payload, mockTransport: { id: saved.id, version: saved.version, baseReleaseId: saved.baseReleaseId } };
        }
        await siteBuilderService.updateDraft(editing.id, { draftDataJson: savedDraft as unknown as Json, currentStep: 'Site review', status: 'In Progress' }); setEditing({ id: editing.id, draft: savedDraft }); await refresh(); return savedDraft;
      }} /></>}
    </>}
  </Workspace>;
}
