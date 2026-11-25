import { useCanEdit } from '../../admin/AccountContext';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Autocomplete, Button, Paper, Stack, Step, StepLabel, Stepper, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { mockRequest } from '../../mock/client';
import LibraryDraftEditor from './LibraryDraftEditor';
import { createLibraryDraft, hasLibraryDraftSnapshot, isLibraryDraft, type LibraryDraft } from '../../domain/libraryDraft';
import { createSiteBuild, newBuildKey, siteBuildIdentityIssue, type SiteBuildIdentity } from '../../domain/siteBuild';
import RadioSelectionGroup from '../../components/forms/RadioSelectionGroup';
import SiteBuilderIdentityFields, { BuilderText } from './SiteBuilderIdentityFields';
import { createPortalDataRepository } from '../../repositories/portalDataRepository';
import { persistence } from '../../persistence/client';
import type { Json } from '../../persistence/types';
import { readLibraryIdentities } from '../../services/libraryCatalogService';
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

const steps = ['TPA', 'Association', 'Site and template', 'Library configuration', 'Site review', 'Scheduled launch'];
const initial: SiteBuildIdentity = { siteKey: '', siteName: '', template: 'multi', organizationKey: '', organizationName: '', hostingAssociationKey: '', associationName: '', newOrganization: true, newAssociation: true };
const required = (value?: string) => !!value?.trim();
const tpaChoices = [{ value: 'new', label: 'New TPA' }, { value: 'existing', label: 'Existing TPA' }];
const editable = (row: BuilderDraftView) => row.canEdit ?? row.ownerId === DEMO_ACTOR;
export default function SiteBuilderWorkspace() {
  const [search] = useSearchParams();
  const [previewSite, setPreviewSite] = useLibrarySelection();
  const canEdit = useCanEdit();
  const { data, error, loading, refresh } = useServiceData(() => siteBuilderService.getDrafts({ includeArchived: true }));
  const identities = useServiceData(readLibraryIdentities);
  const [tab, setTab] = useState(search.get('view') === 'theme' ? 'theme' : 'new'), [step, setStep] = useState(0), [identity, setIdentity] = useState(initial);
  const [editing, setEditing] = useState<{ id: string; draft: LibraryDraft } | null>(null);
  const [selectedSite, setSelectedSite] = useState(''), [draftError, setDraftError] = useState(''), [busy, setBusy] = useState(false);
  const [activeBuildStep, setActiveBuildStep] = useState(3);
  const [source, setSource] = useState<LibraryDraft | null>(null);
  const [attemptedStep, setAttemptedStep] = useState<number>();
  const sources = (identities.data?.sites ?? []).filter(site => site.status === 'active' && !site.deletedAt).map(site => ({
    key: site.key,
    label: `${identities.data?.associationEntities.find(row => row.id === site.hostingAssociationId)?.acronym ?? site.name} · ${site.key}`,
  })).sort((a, b) => a.label.localeCompare(b.label));
  const selection = sources.find(site => site.key === selectedSite) ?? sources[0] ?? null;
  const draftSite = selection?.key;
  const loadLibrary = async () => {
    if (!draftSite) throw new Error('Choose an enrolled Site.');
    if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) {
      const [saved, catalog, added] = await Promise.all([
        mockRequest<{ payload: LibraryDraft; draft: LibraryDraft['mockTransport'] }>('/prototype/library', { siteKey: draftSite }),
        mockRequest<{ data: Pick<LibraryDraft['data'], 'organizations' | 'organizationProfiles' | 'associationEntities'> }>('/library/catalog', { siteKey: 'all', tables: ['organizations', 'organizationProfiles', 'associationEntities'], includeAnalytics: false }),
        mockRequest<Pick<LibraryDraft['data'], 'configurationValues' | 'brandingProfiles' | 'supportProfiles'>>('/builder/catalog', {}),
      ]);
      if (!isLibraryDraft(saved.payload)) throw new Error('Invalid persisted prototype Library');
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
  const associations = source?.data.associationEntities.filter(c => c.organizationId === organizations.find(o => o.key === identity.organizationKey)?.id).sort((a, b) => a.acronym.localeCompare(b.acronym)) ?? [];
  const stepIssue = step < 2 ? siteBuildIdentityIssue(identity, step === 0 ? 'tpa' : 'association') : required(identity.siteName) ? undefined : 'Enter a Site name.';
  return <Workspace><WorkspaceHeader title="Site Builder" description="Build a Site, review its complete journey, then schedule its prototype release." />
    <Tabs value={tab} onChange={(_, value) => { setTab(value); setDraftError(''); }} aria-label="Site Builder views" variant="scrollable" scrollButtons="auto"><Tab value="new" label="Build new site" /><Tab value="progress" label="Sites in progress" /><Tab value="theme" label="Application theme preview" /></Tabs>
    {tab === 'theme' && <><LibrarySiteSelector siteId={previewSite} onChange={setPreviewSite} /><LibraryCatalogProvider siteKey={previewSite}><SavedThemePreview siteKey={previewSite} /></LibraryCatalogProvider></>}
    {draftError && <Alert severity="error">{draftError}</Alert>}
    {tab === 'new' && <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={3}>
      <Stepper activeStep={source ? step : 0} alternativeLabel sx={{ overflowX: 'auto' }}>{steps.slice(0, 3).map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
      {!source ? <Stack spacing={2} sx={{ maxWidth: 640 }}>
        <Typography>Choose the Library configuration to use as a starting point.</Typography>
        {identities.error && <Alert severity="error" action={<Button onClick={() => void identities.refresh()}>Retry</Button>}>{identities.error.message}</Alert>}
        <Autocomplete options={sources} value={selection} loading={identities.loading} disableClearable
          getOptionLabel={site => site.label} isOptionEqualToValue={(site, value) => site.key === value.key}
          onChange={(_, site) => setSelectedSite(site.key)} renderInput={params => <TextField {...params} required label="Starting Library site" />} />
        <Button variant="contained" disabled={!canEdit || busy || !draftSite} onClick={() => void run(async () => {
          setSource(await loadLibrary());
          setIdentity({ ...initial, siteKey: newBuildKey('site'), organizationKey: newBuildKey('tpa'), hostingAssociationKey: newBuildKey('association') });
          setAttemptedStep(undefined); setStep(0);
        })}>{busy ? 'Loading Library…' : 'Start site build'}</Button>
      </Stack> : <Stack component="form" noValidate onSubmit={event => { event.preventDefault(); if (!canEdit || busy) return; if (stepIssue) { setAttemptedStep(step); return; } if (step < 2) { setStep(step + 1); return; } void run(async () => {
        const draft = createSiteBuild(source, identity);
        const site = draft.data.sites.find(s => s.key === draft.siteKey)!;
        const row = await siteBuilderService.createDraft({ hostingAssociationId: site.hostingAssociationId, siteKey: site.key, siteName: site.name, status: 'Draft', currentStep: 'Library configuration', draftDataJson: draft as unknown as Json });
        setEditing({ id: row.id, draft: isLibraryDraft(row.draftDataJson) ? row.draftDataJson : draft }); setActiveBuildStep(3); setTab('progress'); setSource(null); await refresh();
      }); }} spacing={2} sx={{ maxWidth: 640 }}>
        {step === 0 && <>
          <RadioSelectionGroup name="tpa-selection" label="TPA" options={tpaChoices} value={identity.newOrganization ? 'new' : 'existing'} required
            onChange={value => { const isNew = value === 'new'; patch({
              newOrganization: isNew, newAssociation: isNew, organizationKey: isNew ? newBuildKey('tpa') : '', organizationName: '',
              organizationAcronym: undefined, hostingAssociationKey: isNew ? newBuildKey('association') : '', associationName: '',
            }); }} />
          {identity.newOrganization ? <SiteBuilderIdentityFields kind="organization" draft={source} identity={identity} patch={patch} />
            : <Autocomplete options={organizations} value={organizations.find(o => o.key === identity.organizationKey) ?? null} getOptionLabel={o => o.name}
              onChange={(_, o) => patch({ organizationKey: o?.key ?? '', organizationName: o?.name ?? '', hostingAssociationKey: '', associationName: '' })}
              renderInput={params => <TextField {...params} required label="Existing TPA" />} />}
        </>}
        {step === 1 && <>
          {!identity.newOrganization && <RadioSelectionGroup name="association-selection" label="Association" value={identity.newAssociation ? 'new' : 'existing'} required
            options={[{ value: 'existing', label: 'Existing Association under this TPA' }, { value: 'new', label: 'New Association' }]}
            onChange={value => patch({ newAssociation: value === 'new', hostingAssociationKey: value === 'new' ? newBuildKey('association') : '', associationName: '' })} />}
          {identity.newAssociation ? <SiteBuilderIdentityFields kind="association" draft={source} identity={identity} patch={patch} />
            : <Autocomplete options={associations} value={associations.find(c => c.key === identity.hostingAssociationKey) ?? null} getOptionLabel={c => `${c.acronym} · ${c.name}`}
              onChange={(_, c) => patch({ hostingAssociationKey: c?.key ?? '', associationName: c?.name ?? '' })}
              renderInput={params => <TextField {...params} required label="Existing Association" />} />}
        </>}
        {step === 2 && <>
          <BuilderText field={{ id: 'site-name', label: 'Site name', inputType: 'text', required: true }} value={identity.siteName} onChange={value => patch({ siteName: value })} />
          <RadioSelectionGroup name="site-layout" label="Application layout" required value={identity.template} options={[{ value: 'multi', label: 'Multi-page' }, { value: 'single', label: 'Single-page' }]}
            onChange={value => patch({ template: value === 'single' ? 'single' : 'multi' })} />
          <Alert severity="info">Starts with {draftSite}'s Library configuration. Review copied product rules and branding before launch.</Alert>
        </>}
        {attemptedStep === step && stepIssue && <Alert severity="error">{stepIssue}</Alert>}
        <Stack direction="row" spacing={1}><Button disabled={!canEdit || busy} onClick={() => setSource(null)}>Cancel</Button>{step > 0 && <Button disabled={!canEdit || busy} onClick={() => setStep(step - 1)}>Back</Button>}<Button type="submit" variant="contained" disabled={!canEdit || busy}>{step < 2 ? 'Continue' : busy ? 'Creating draft…' : 'Create and configure site'}</Button></Stack>
      </Stack>}
    </Stack></Paper>}
    {tab === 'progress' && <>
      <Typography color="text.secondary">See all builds. Caroline can edit, resume, or archive the Sites she started.</Typography>
      {error && <Alert severity="error">{error.message}</Alert>}{loading && <Typography>Loading builds…</Typography>}
      <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Site</TableCell><TableCell>Started by</TableCell><TableCell>Progress</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{data?.map(draft => <TableRow key={draft.id}><TableCell>{draft.siteName}</TableCell><TableCell>{draft.ownerId ?? 'Unassigned'}</TableCell><TableCell>{draft.currentStep}</TableCell><TableCell><StatusChip label={draft.deletedAt ? 'Archived' : draft.status} /></TableCell><TableCell><Stack direction="row" flexWrap="wrap">{hasLibraryDraftSnapshot(draft.draftDataJson) && <Button component="a" href={buildPreviewUrl(draft.draftDataJson)} target="_blank" rel="noopener noreferrer">View site</Button>}{canEdit && editable(draft) ? <><Button disabled={!!draft.deletedAt || !hasLibraryDraftSnapshot(draft.draftDataJson)} onClick={() => { if (hasLibraryDraftSnapshot(draft.draftDataJson)) { setEditing({ id: draft.id, draft: draft.draftDataJson }); setActiveBuildStep(3); } }}>Resume build / review</Button><Button disabled={!canEdit || busy} onClick={() => void run(async () => { await (draft.deletedAt ? siteBuilderService.restoreDraft(draft.id) : siteBuilderService.archiveDraft(draft.id)); if (editing?.id === draft.id) setEditing(null); await refresh(); })}>{draft.deletedAt ? 'Restore' : 'Archive'}</Button></> : <Typography variant="caption" sx={{ p: 1 }}>View only</Typography>}</Stack></TableCell></TableRow>)}{!loading && !data?.length && <TableRow><TableCell colSpan={5}>No builds started yet.</TableCell></TableRow>}</TableBody></Table></ResponsiveTableContainer>
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
