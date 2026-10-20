import { buildReviewPages } from '../../domain/buildReviewPages';
import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, FormControlLabel, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { LibraryDraft } from '../../domain/libraryDraft';
import { resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { resolveRatePresentation } from '../../domain/ratePresentation';
import { useServiceData } from '../../hooks/useServiceData';
import { releaseService } from '../../services/releaseService';
import { mockRequest, type MockQuote, type MockPayment } from '../../mock/client';
import { buildPreviewUrl, prototypeReleaseService, savedRevision, type ServiceCheck, type VisualCheck } from '../../services/prototypeReleaseService';

export default function SiteBuildReview({ draft, dirty }: { draft: LibraryDraft; dirty: boolean }) {
  const { data: status, error: statusError, refresh } = useServiceData(() => prototypeReleaseService.status(draft.siteKey), [draft.siteKey, draft.mockTransport?.version]);
  const { data: releases } = useServiceData(() => releaseService.getUpcomingReleases());
  const prototype = resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision);
  const pages = buildReviewPages(draft);
  const [visual, setVisual] = useState<VisualCheck[]>([]), [services, setServices] = useState<ServiceCheck[]>([]);
  useEffect(() => { const review = status?.review; if (review && review.version === draft.mockTransport?.version) { setVisual(review.visualChecks ?? []); setServices(review.serviceChecks ?? []); } }, [status?.review?.id, draft.mockTransport?.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const [releaseId, setReleaseId] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>) => { setBusy(true); setError(''); try { await action(); await refresh(); } catch(e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } };
  const patchVisual = (page: string, patch: Partial<VisualCheck>) => setVisual(rows => [...rows.filter(r => r.page !== page), { page, desktop: false, mobile: false, notes: '', ...rows.find(r => r.page === page), ...patch }]);
  const test = async (productKey: string) => {
    const revision = `prototype:${(await savedRevision(draft)).payloadHash}`;
    const product = prototype.products.find(p => p.id === productKey)!;
    const amount = product.coverageAmounts?.[0]?.selections?.[0];
    const testAmount = amount?.type === 'range' ? amount.min : amount?.type === 'amountList' ? amount.values[0] : 10000;
    const quote = await mockRequest<MockQuote>('/rates/quote', { siteKey: draft.siteKey, productKey, amount: testAmount, frequency: 'monthly', revision });
    const approved = await mockRequest<MockPayment>('/payments/authorize', { quoteId: quote.quoteId, paymentToken: 'mock-approved', idempotencyKey: crypto.randomUUID() });
    const declined = await mockRequest<MockPayment>('/payments/authorize', { quoteId: quote.quoteId, paymentToken: 'mock-declined', idempotencyKey: crypto.randomUUID() });
    setServices(rows => [...rows.filter(r => r.productKey !== productKey), { productKey, approvedPaymentId: approved.paymentId, declinedPaymentId: declined.paymentId }]);
  };
  const release = releases?.find(r => r.id === releaseId) ?? releases?.[0];
  const accepted = !dirty && status?.review?.blockers.length === 0 && status.review.version === draft.mockTransport?.version;
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
    <Typography variant="h6">Site review → scheduled launch</Typography>
    <Typography>Review the complete applicant journey, then stage the accepted snapshot in prototype UAT and schedule production in the next release.</Typography>
    <Alert severity="info">Prototype UAT and production represent the implemented prototype solution. Majesco implementation is tracked separately. Published-data activation (step 6) remains gated.</Alert>
    {dirty && <Alert severity="warning">Save your edits before previewing or reviewing. Previous acceptance applies only to its saved revision.</Alert>}
    {(error || statusError) && <Alert severity="error">{error || statusError?.message}</Alert>}
    <Button component="a" href={buildPreviewUrl(draft)} target="_blank" rel="noopener" disabled={dirty || !draft.mockTransport}>Open full working journey</Button>
    {pages.map(p => { const check = visual.find(v => v.page === p.pageKey); return <Stack key={p.id} direction={{ xs: 'column', md: 'row' }} gap={1} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ flexWrap: 'wrap' }}><Button component="a" href={buildPreviewUrl(draft, undefined, p.pageKey)} target="_blank" rel="noopener" disabled={dirty || !draft.mockTransport}>{p.pageKey}</Button><FormControlLabel sx={{ width: 'auto', minWidth: 180, m: 0 }} label="Desktop accepted" control={<Checkbox checked={!!check?.desktop} onChange={(_, desktop) => patchVisual(p.pageKey, { desktop })} />} /><FormControlLabel sx={{ width: 'auto', minWidth: 170, m: 0 }} label="Mobile accepted" control={<Checkbox checked={!!check?.mobile} onChange={(_, mobile) => patchVisual(p.pageKey, { mobile })} />} /><TextField size="small" label={`${p.pageKey} review notes`} value={check?.notes ?? ''} onChange={e => patchVisual(p.pageKey, { notes: e.target.value })} sx={{ flex: 1, minWidth: { xs: '100%', md: 220 } }} /></Stack>; })}
    <Typography variant="subtitle1">Test scenarios</Typography>
    {prototype.products.map(product => { const rate = resolveRatePresentation(prototype.site, product.id); const check = services.find(r => r.productKey === product.id); return <Stack key={product.id} direction="row" gap={1} alignItems="center"><Typography>{product.name}</Typography>{rate.praseConfigured ? <Button disabled={dirty || busy || !draft.mockTransport} onClick={() => void run(() => test(product.id))}>Test quote / approved / declined</Button> : <FormControlLabel label="Reference-only preview verified" control={<Checkbox checked={!!check?.referenceOnly} onChange={(_, referenceOnly) => setServices(rows => [...rows.filter(r => r.productKey !== product.id), { productKey: product.id, referenceOnly }])} />} />}{check?.approvedPaymentId && <Typography color="success.main">Approved and declined verified</Typography>}</Stack>; })}
    <Button variant="contained" disabled={dirty || busy || !draft.mockTransport} onClick={() => void run(() => prototypeReleaseService.review(draft, visual, services))}>Run readiness review</Button>
    {status?.review && <><Typography variant="caption">Reviewed revision: {status.review.revision} · {status.review.analyticsCount} matching analytics events</Typography>{status.review.blockers.length ? status.review.blockers.map(b => <Alert key={b} severity="warning">{b}</Alert>) : <Alert severity="success">Saved revision accepted within provisional prototype scope.</Alert>}</>}
    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}><Button disabled={!accepted || busy} onClick={() => void run(() => prototypeReleaseService.stage(draft, status?.heads.uat ?? null))}>Stage accepted revision in UAT</Button>{status?.heads.uat && <Button component="a" href={buildPreviewUrl(draft, 'uat')} target="_blank" rel="noopener">Preview UAT</Button>}{status?.heads.production && <Button component="a" href={buildPreviewUrl(draft, 'production')} target="_blank" rel="noopener">Preview production</Button>}</Stack>
    <TextField select label="Scheduled release" disabled={!releases?.length} value={release?.id ?? ''} onChange={e => setReleaseId(e.target.value)}>{!releases?.length && <MenuItem value="">No upcoming release</MenuItem>}{releases?.map(r => <MenuItem key={r.id} value={r.id}>{r.name} · {r.releaseDate}</MenuItem>)}</TextField>
    {!release && <Button component={RouterLink} to="/admin-center/releases">Create the next release</Button>}
    <Button variant="contained" disabled={!accepted || !status?.heads.uat || !release || busy} onClick={() => void run(() => prototypeReleaseService.schedule(draft, release!))}>Schedule site launch</Button>
    {status?.queue.map(q => <Stack key={q.id} direction="row" gap={1} alignItems="center"><Typography>{q.releaseName} · {q.releaseDate} · {q.status}</Typography>{q.status === 'Scheduled' && <Button onClick={() => void run(() => prototypeReleaseService.cancel(q.id))}>Cancel launch</Button>}</Stack>)}
    <Typography variant="subtitle1">Production rollback</Typography>
    {status?.releases.filter(r => r.id !== status.heads.production && status.queue.some(q => q.snapshotId === r.id && q.status === 'Released')).map(r => <Button key={r.id} disabled={busy || !status.heads.production} onClick={() => void run(() => prototypeReleaseService.rollback(draft.siteKey, r.id, status.heads.production!))}>Restore {r.revision}</Button>)}
    <Button component={RouterLink} to="/admin-center/migration-schedule">Track implementation in Majesco environments</Button>
  </Stack></Paper>;
}
