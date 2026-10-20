import { canonicalRelations } from "../../../migration/review";
import { useMemo, useState } from 'react';
import { Alert, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import BrowseTable from '../../../components/docs/BrowseTable';
import { createMigrationDatabase } from '../../../migration/fixtures';
import { mcrCoverageReport } from '../../../migration/mcr';

/** Isolated, lazy-loaded review snapshot. No service/provider replacement and no writes. */
export default function CanonicalReview() {
  const db = useMemo(() => createMigrationDatabase(), []);
  const report = useMemo(() => mcrCoverageReport(db), [db]);
  const [table, setTable] = useState('sourceRequirements');
  const [promotion, setPromotion] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(null);
  const rows = (db[table as keyof typeof db] as unknown as Array<Record<string, unknown>>).filter(r => typeof r.key === 'string' && (table !== 'sourceRequirements' || promotion === 'ALL' || r.promotionState === promotion));
  const selectedRow = rows.find(r => r.key === selected);
  const relations = selectedRow ? canonicalRelations(db, table as keyof typeof db, selectedRow) : [];
  const destinations = table === 'sourceRequirements' ? db.requirementTargets.filter(t => t.requirementKey === selected) : [];
  const sources = db.requirementTargets.filter(t => t.targetTable === table && t.targetKey === selected);
  const navigate = (nextTable: string, key: string) => { setTable(nextTable); setSelected(key); };
  return <Stack spacing={2}>
    <Alert severity={report.phase5Ready ? 'success' : 'warning'}>Review-only migration snapshot · phase5Ready: {String(report.phase5Ready)} · {report.phase5BlockingCount} Phase 5 blockers · {report.blockingCount} Phase 6 business/data blockers · {report.integrityErrors.length} integrity errors</Alert>
    <Typography variant="body2">Source only: {report.sourceOnlyRecords} · Pattern candidates: {report.patternCandidates} · Promoted: {report.promotionCounts.CANONICAL_LIBRARY} · Site configuration: {report.promotionCounts.SITE_CONFIGURATION}</Typography>
    {report.blockers.map(blocker => <Alert key={blocker.key} severity="warning">{blocker.key}: {blocker.reason}</Alert>)}
    {table === 'sourceRequirements' && <TextField select label="Promotion state" value={promotion} onChange={e => setPromotion(e.target.value)}>{['ALL', ...Object.keys(report.promotionCounts)].map(state => <MenuItem key={state} value={state}>{state}</MenuItem>)}</TextField>}
    <Typography variant="body2">Select source evidence to inspect canonical destinations, or select a canonical table to inspect its records and supporting source references. This view cannot edit data.</Typography>
    <TextField select label="Canonical table" value={table} onChange={e => { setTable(e.target.value); setSelected(null); }}>{Object.keys(db).filter(k => !['applications','applicationEvents','users','auditEvents'].includes(k)).map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}</TextField>
    {selectedRow && <Stack spacing={1}>
      <Typography variant="h6">{selected}</Typography>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(selectedRow, null, 2)}</pre>
      {destinations.map(t => <Link component="button" color="primary" key={t.key} onClick={() => navigate(t.targetTable, t.targetKey)}>Extracted target (adoption is separate): {t.targetTable} / {t.targetKey} / {t.targetColumn}</Link>)}
      {relations.map(r => <Link component="button" color="primary" key={r.field} aria-disabled={!r.exists} onClick={() => { if (r.exists) navigate(r.table, r.key); }}>{r.field}: {r.table} / {r.key}{r.exists ? '' : ' (missing)'}</Link>)}
      {sources.map(t => <Link component="button" color="primary" key={t.key} onClick={() => navigate('sourceRequirements', t.requirementKey)}>Evidence: {t.sourceReference}</Link>)}
    </Stack>}
    <BrowseTable key={table} tableName={table} label="Canonical records" rows={rows} rowKey={r => String(r.key)} columns={[
      { id: 'key', label: 'Key', value: r => String(r.key), width: 350, render: r => <Link component="button" color="primary" onClick={() => setSelected(String(r.key))}>{String(r.key)}</Link> },
      { id: 'promotion', label: 'Promotion state', value: r => String(r.promotionState ?? ''), filter: true },
      { id: 'sites', label: 'Active Sites', value: r => Array.isArray(r.activeSiteKeys) ? r.activeSiteKeys.join(', ') : '' },
      { id: 'classification', label: 'Category / domain', value: r => String(r.classification ?? r.domain ?? r.status ?? ''), filter: true },
      { id: 'source', label: 'Source reference', value: r => String(r.sourceReference ?? ''), width: 350 },
      { id: 'reason', label: 'Reason / meaning', value: r => String(r.reason ?? r.predicate ?? r.name ?? ''), width: 400 },
    ]} />

  </Stack>;
}
