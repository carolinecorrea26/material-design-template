import { useCanEdit } from '../../admin/AccountContext';
import { useState } from 'react';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { prototypeReleaseService } from '../../services/prototypeReleaseService';
import { useServiceData } from '../../hooks/useServiceData';
export default function PrototypeLaunchQueue({ releaseKey }: { releaseKey?: string }) {
  const canEdit = useCanEdit();
  const { data, error, refresh } = useServiceData(() => import.meta.env.VITE_MOCK_PLATFORM_ENABLED ? prototypeReleaseService.queue() : Promise.resolve([]));
  const [actionError, setActionError] = useState(''), [busy, setBusy] = useState(false);
  if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return null;
  const entries = data?.filter(q => !releaseKey || q.releaseKey === releaseKey) ?? [];
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setActionError(''); try { await fn(); await refresh(); } catch(e) { setActionError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } };
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack gap={1}><Typography variant="h6">Prototype site launches</Typography><Typography variant="body2">Release the reviewed UAT snapshot into prototype production on its scheduled date. Majesco deployment and published-data activation are separate.</Typography>{(error || actionError) && <Alert severity="error">{actionError || error?.message}</Alert>}{!entries.length && <Typography color="text.secondary">No site launches scheduled. Schedule a reviewed Site from Site Builder.</Typography>}{entries.map(q => <Stack key={q.id} direction={{ xs: 'column', md: 'row' }} gap={1} alignItems={{ md: 'center' }}><Typography sx={{ flex: 1 }}>{q.siteKey} · {q.releaseName} · {q.releaseDate} · {q.status}<Typography variant="caption" display="block" sx={{ overflowWrap: 'anywhere' }}>{q.revision}</Typography></Typography>{q.status === 'Scheduled' && <><Button variant="contained" disabled={!canEdit || busy} onClick={() => void run(() => prototypeReleaseService.launch(q.id))}>Release to prototype production</Button><Button disabled={!canEdit || busy} onClick={() => void run(() => prototypeReleaseService.cancel(q.id))}>Cancel</Button></>}</Stack>)}</Stack></Paper>;
}
