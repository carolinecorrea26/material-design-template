import { useCanEdit } from '../../admin/AccountContext';
import { siteBuilderService } from '../../services/siteBuilderService';
import { isLibraryDraft } from '../../domain/libraryDraft';
import { useMemo, useState } from "react";
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";
import SearchField from "../../components/docs/SearchField";
import { foundationRepositories } from "../../repositories/foundations";
import { useServiceData } from "../../hooks/useServiceData";
import { defaultMigrationSchedule, migrationScheduleService } from "../../services/migrationScheduleService";
import { migrationStages, migrationStatuses, type MigrationSchedule, type MigrationStatus } from "../../persistence/types";

const load = async () => {
  const [clients, schedules, drafts] = await Promise.all([foundationRepositories.clients.list(), migrationScheduleService.list(), siteBuilderService.getDrafts()]);
  const builtSites = drafts.filter(d => isLibraryDraft(d.draftDataJson)).map(d => ({ key: d.siteKey, acronym: d.siteKey, name: `${d.siteName} · Site implementation in Majesco` }));
  return { clients, schedules, builtSites };
};
const statusColor = (status: MigrationStatus) => status === "Complete" ? "success" : status === "Blocked" ? "error" : status === "In review" ? "warning" : status === "In progress" ? "primary" : "default";
const displayDate = (date: string | null) => date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD";

export default function MigrationScheduleWorkspace() {
  const canEdit = useCanEdit();
  const { data, error, loading, refresh } = useServiceData(load);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<{ label: string; schedule: MigrationSchedule } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState("");
  const rows = useMemo(() => {
    if (!data) return [];
    const clients = data.clients.map(client => ({ key: client.key, acronym: client.acronym, name: client.name }));
    for (const site of data.builtSites) if (!clients.some(c => c.key === site.key)) clients.push(site);
    // AAFP can be planned before its portal configuration is added to the Library.
    if (!clients.some(client => client.key.toLowerCase() === "aafp" || client.acronym.toUpperCase() === "AAFP")) clients.push({ key: "aafp", acronym: "AAFP", name: "American Academy of Family Physicians" });
    return clients.filter(client => !/prase/i.test(`${client.key} ${client.acronym}`)).map(client => ({
      ...client,
      schedule: data.schedules.find(row => row.clientKey === client.key) ?? defaultMigrationSchedule(["ASCE", "AAFP"].includes(client.acronym.toUpperCase()) ? client.acronym.toLowerCase() : client.key),
    })).sort((a, b) => Number(b.schedule.migrating) - Number(a.schedule.migrating) || a.acronym.localeCompare(b.acronym));
  }, [data]);
  const visible = rows.filter(row => `${row.acronym} ${row.name}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || row.schedule.migrating === (filter === "yes")));
  const patch = (patch: Partial<MigrationSchedule>) => setEditing(current => current && ({ ...current, schedule: { ...current.schedule, ...patch } }));
  const save = async () => {
    if (!editing) return;
    setSaving(true); setSaveError("");
    try {
      await migrationScheduleService.save(editing.schedule);
      await refresh(); setSaved(`${editing.label} migration schedule saved.`); setEditing(null);
    } catch (reason) { setSaveError(reason instanceof Error ? reason.message : "Unable to save migration schedule."); }
    finally { setSaving(false); }
  };
  return <Workspace>
    <WorkspaceHeader title="Migration schedule" description="Track client migration requirements, prototype progress, and Majesco environments with expected dates." />
    <Typography variant="body2" color="text.secondary">Changes are saved in this browser’s local prototype data. Statuses start as Not assessed and dates as TBD. Schedule statuses are planning records; acceptance and activation require their own verification.</Typography>
    {error && <Alert severity="error">{error.message}</Alert>}
    {saved && <Alert severity="success" onClose={() => setSaved("")}>{saved}</Alert>}
    <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }}>
      <SearchField value={search} onChange={setSearch} placeholder="Search clients" />
      <TextField select size="small" label="Migrating" value={filter} onChange={event => setFilter(event.target.value)} sx={{ minWidth: 150 }}><MenuItem value="all">All clients</MenuItem><MenuItem value="yes">Yes</MenuItem><MenuItem value="no">No</MenuItem></TextField>
      <Typography variant="body2" color="text.secondary">{rows.filter(row => row.schedule.migrating).length} migrating · {rows.length} clients</Typography>
    </Stack>
    {loading ? <Typography>Loading migration schedule…</Typography> : <ResponsiveTableContainer><Table size="small" aria-label="Migration schedule" sx={{ minWidth: 1100 }}>
      <TableHead><TableRow><TableCell rowSpan={2}>Client</TableCell><TableCell rowSpan={2}>Migrating</TableCell><TableCell rowSpan={2}>Requirements</TableCell><TableCell rowSpan={2}>Prototype</TableCell><TableCell colSpan={3} align="center">Majesco environment</TableCell><TableCell rowSpan={2}>Date expected</TableCell><TableCell rowSpan={2}>Actions</TableCell></TableRow><TableRow><TableCell>UAT</TableCell><TableCell>Preprod</TableCell><TableCell>Production</TableCell></TableRow></TableHead>
      <TableBody>{visible.map(row => <TableRow key={row.key} hover>
        <TableCell><Typography variant="body2" fontWeight={700}>{row.acronym}</Typography><Typography variant="caption" color="text.secondary">{row.name}</Typography>{row.schedule.notes && <Typography variant="caption" display="block" sx={{ mt: 0.5, maxWidth: 250, whiteSpace: "pre-wrap" }}>{row.schedule.notes}</Typography>}</TableCell>
        <TableCell><Chip size="small" label={row.schedule.migrating ? "Yes" : "No"} color={row.schedule.migrating ? "primary" : "default"} variant="outlined" /></TableCell>
        {migrationStages.map(({ key }) => <TableCell key={key}><Stack gap={0.5} alignItems="flex-start"><Chip size="small" variant="outlined" label={row.schedule.milestones[key].status} color={statusColor(row.schedule.milestones[key].status)} /><Typography variant="caption" color="text.secondary">Expected: {displayDate(row.schedule.milestones[key].expectedDate)}</Typography></Stack></TableCell>)}
        <TableCell sx={{ whiteSpace: "nowrap" }}>{displayDate(row.schedule.expectedDate)}</TableCell>
        <TableCell><Button size="small" disabled={!canEdit} aria-label={`Edit ${row.acronym} migration schedule`} onClick={() => { setEditing({ label: row.acronym, schedule: { ...structuredClone(row.schedule), clientKey: row.key } }); setSaveError(""); }}>Edit</Button></TableCell>
      </TableRow>)}{visible.length === 0 && <TableRow><TableCell colSpan={9}>No clients match these filters.</TableCell></TableRow>}</TableBody>
    </Table></ResponsiveTableContainer>}
    <Dialog open={Boolean(editing)} onClose={() => { if (!saving) setEditing(null); }} fullWidth maxWidth="md"><DialogTitle>Edit {editing?.label} migration schedule</DialogTitle><DialogContent><Stack gap={2} sx={{ pt: 1 }}>
      {saveError && <Alert severity="error">{saveError}</Alert>}
      <TextField select label="Migrating" value={editing?.schedule.migrating ? "yes" : "no"} disabled={!canEdit || saving} onChange={event => patch({ migrating: event.target.value === "yes" })}><MenuItem value="yes">Yes</MenuItem><MenuItem value="no">No</MenuItem></TextField>
      {migrationStages.map(({ key, label }) => <Stack key={key} direction={{ xs: "column", sm: "row" }} gap={2}>
        <TextField fullWidth select label={`${label} status`} value={editing?.schedule.milestones[key].status ?? "Not assessed"} disabled={!canEdit || saving} onChange={event => editing && patch({ milestones: { ...editing.schedule.milestones, [key]: { ...editing.schedule.milestones[key], status: event.target.value as MigrationStatus } } })}>{migrationStatuses.map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}</TextField>
        <TextField fullWidth type="date" label={`${label} date expected`} value={editing?.schedule.milestones[key].expectedDate ?? ""} disabled={!canEdit || saving} slotProps={{ inputLabel: { shrink: true } }} onChange={event => editing && patch({ milestones: { ...editing.schedule.milestones, [key]: { ...editing.schedule.milestones[key], expectedDate: event.target.value || null } } })} />
      </Stack>)}
      <TextField type="date" label="Overall date expected" value={editing?.schedule.expectedDate ?? ""} disabled={!canEdit || saving} slotProps={{ inputLabel: { shrink: true } }} onChange={event => patch({ expectedDate: event.target.value || null })} />
      <TextField multiline minRows={2} label="Requirements / progress notes" value={editing?.schedule.notes ?? ""} disabled={!canEdit || saving} onChange={event => patch({ notes: event.target.value })} />
    </Stack></DialogContent><DialogActions><Button disabled={!canEdit || saving} onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" disabled={!canEdit || saving} onClick={() => void save()}>{saving ? "Saving…" : "Save schedule"}</Button></DialogActions></Dialog>
  </Workspace>;
}
