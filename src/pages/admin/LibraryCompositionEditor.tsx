import { useState } from 'react';
import { Button, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { editDraftParticipation, editDraftPageRequirement, sitePageRequirementOptions, editDraftProfile, type LibraryDraft } from '../../domain/libraryDraft';
export default function LibraryCompositionEditor({ draft, update, area, pageKey }: {
  draft: LibraryDraft;
  update: (fn: () => LibraryDraft) => void;
  area?: 'pages' | 'products' | 'advanced';
  pageKey?: string;
}) {
  const [kind, setKind] = useState<'brandingProfiles' | 'supportProfiles'>('brandingProfiles'), [id, setId] = useState(''), [json, setJson] = useState('');
  const site = draft.data.sites.find(s => s.key === draft.siteKey)!;
  const client = draft.data.associationEntities.find(c => c.id === site.hostingAssociationId)!;
  const adjustablePages = draft.data.sitePages.filter(r => r.siteKey === draft.siteKey && (!pageKey || r.pageKey === pageKey) && sitePageRequirementOptions(r.pageKey).length);
  if (area === 'pages' && !adjustablePages.length) return null;
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack gap={1}>
    <Typography variant="h6">{area === 'pages' ? 'Page participation' : area === 'products' ? 'Product participation' : 'Site composition and branding'}</Typography>
    <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
      {(!area || area === 'pages') && <Stack gap={1}><Typography variant="caption">Page list and order are global.</Typography>{adjustablePages.map(r => <TextField select key={r.id} label={draft.data.pages.find(page => page.key === r.pageKey)?.definition.displayName ?? r.pageKey} value={r.requirement} onChange={event => update(() => editDraftPageRequirement(draft, r.pageKey, event.target.value as 'required' | 'optional' | 'none'))}>{sitePageRequirementOptions(r.pageKey).map(value => <MenuItem key={value} value={value}>{value === 'none' ? 'Disabled' : value === 'optional' ? 'Optional' : 'Required'}</MenuItem>)}</TextField>)}</Stack>}
      {(!area || area === 'products') && <Stack>{draft.data.siteProducts.filter(r => r.siteId === site.id).map(r => <FormControlLabel key={r.id} label={draft.data.products.find(product => product.key === r.productKey)?.definition.name ?? r.productKey} control={<Switch checked={r.enabled} onChange={(_, enabled) => update(() => editDraftParticipation(draft, 'product', r.productKey, enabled))} />} />)}</Stack>}
      {(!area || area === 'advanced') && <Stack><Typography variant="subtitle1">Feature inventory</Typography>{draft.data.siteFeatures.filter(r => r.siteKey === draft.siteKey).map(r => <FormControlLabel key={r.id} label={r.featureKey} control={<Switch checked={r.enabled} disabled />} />)}</Stack>}
    </Stack>
    {(!area || area === 'advanced') && <>
    <TextField select label="Profile domain" value={kind} onChange={e => { setKind(e.target.value as typeof kind); setId(''); }}><MenuItem value="brandingProfiles">Branding</MenuItem><MenuItem value="supportProfiles">Support / contact</MenuItem></TextField>
    <TextField select label="Profile" value={id} onChange={e => { setId(e.target.value); setJson(JSON.stringify(draft.data[kind].find(r => r.id === e.target.value)?.definition, null, 2)); }}>{draft.data[kind].filter(r => r.scope === 'global' || r.scope === 'association' && r.hostingAssociationKey === client.key || r.scope === 'site' && r.siteKey === draft.siteKey).map(r => <MenuItem key={r.id} value={r.id}>{r.key} · {r.scope}</MenuItem>)}</TextField>
    {id && <><TextField multiline minRows={3} maxRows={10} label="Profile values (JSON)" value={json} onChange={e => setJson(e.target.value)} /><Button onClick={() => update(() => editDraftProfile(draft, kind, id, JSON.parse(json)))}>Apply Site profile override</Button></>}
    </>}
  </Stack></Paper>;
}
