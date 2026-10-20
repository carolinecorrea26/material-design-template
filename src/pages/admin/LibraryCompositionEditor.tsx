import { useState } from 'react';
import { Button, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { editDraftParticipation, editDraftProfile, type LibraryDraft } from '../../domain/libraryDraft';
export default function LibraryCompositionEditor({ draft, update }: { draft: LibraryDraft; update: (fn: () => LibraryDraft) => void }) {
  const [kind, setKind] = useState<'brandingProfiles' | 'supportProfiles'>('brandingProfiles'), [id, setId] = useState(''), [json, setJson] = useState('');
  const site = draft.data.sites.find(s => s.key === draft.siteKey)!;
  const client = draft.data.clients.find(c => c.id === site.clientId)!;
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack gap={1}><Typography variant="h6">Site composition and branding</Typography>
    <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
      <Stack><Typography variant="subtitle1">Pages</Typography>{draft.data.sitePages.filter(r => r.siteKey === draft.siteKey && draft.data.pages.find(p => p.key === r.pageKey)?.definition.type !== 'internal').map(r => <FormControlLabel key={r.id} label={r.pageKey} control={<Switch checked={r.requirement !== 'none'} onChange={(_, enabled) => update(() => editDraftParticipation(draft, 'page', r.pageKey, enabled))} />} />)}</Stack>
      <Stack><Typography variant="subtitle1">Products</Typography>{draft.data.siteProducts.filter(r => r.siteId === site.id).map(r => <FormControlLabel key={r.id} label={r.productKey} control={<Switch checked={r.enabled} onChange={(_, enabled) => update(() => editDraftParticipation(draft, 'product', r.productKey, enabled))} />} />)}</Stack>
      <Stack><Typography variant="subtitle1">Feature inventory</Typography><Typography variant="caption">Runtime settings are edited in configuration controls.</Typography>{draft.data.siteFeatures.filter(r => r.siteKey === draft.siteKey).map(r => <FormControlLabel key={r.id} label={r.featureKey} control={<Switch checked={r.enabled} disabled />} />)}</Stack>
    </Stack>
    <TextField select label="Profile domain" value={kind} onChange={e => { setKind(e.target.value as typeof kind); setId(''); }}><MenuItem value="brandingProfiles">Branding</MenuItem><MenuItem value="supportProfiles">Support / contact</MenuItem></TextField>
    <TextField select label="Profile" value={id} onChange={e => { setId(e.target.value); setJson(JSON.stringify(draft.data[kind].find(r => r.id === e.target.value)?.definition, null, 2)); }}>{draft.data[kind].filter(r => r.scope === 'global' || r.scope === 'client' && r.clientKey === client.key || r.scope === 'site' && r.siteKey === draft.siteKey).map(r => <MenuItem key={r.id} value={r.id}>{r.key} · {r.scope}</MenuItem>)}</TextField>
    {id && <><TextField multiline minRows={3} maxRows={10} label="Profile values (JSON)" value={json} onChange={e => setJson(e.target.value)} /><Button onClick={() => update(() => editDraftProfile(draft, kind, id, JSON.parse(json)))}>Apply Site profile override</Button></>}
  </Stack></Paper>;
}
