import { useCanEdit } from '../../admin/AccountContext';
import { getSiteAcronym } from "../../data/siteDisplay";
import { foundationRepositories } from "../../repositories/foundations";
import { getSitePrototypeUrl } from "../../config/sitePrototype";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { launchLinks } from "../../data/siteEnvironmentLinks";
import type { SiteEnvironment, SiteEnvironmentLink } from "../../domain/sites";
import { useId, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, IconButton, Tooltip, Link, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { siteService } from "../../services/siteService";
import type { Client, Organization, Site } from "../../persistence/types";
import { useServiceData } from "../../hooks/useServiceData";
import { StatusChip, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import SearchField from "../../components/docs/SearchField";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";

type Data = { sites: Site[]; clients: Client[]; organizations: Organization[]; links: SiteEnvironmentLink[] };
const load = async (): Promise<Data> => ({ sites: await siteService.getSites({ includeArchived: true }), clients: await foundationRepositories.clients.list(), organizations: await foundationRepositories.organizations.list(), links: await foundationRepositories.siteEnvironmentLinks.list() });

export default function SitesWorkspace() {
  const canEdit = useCanEdit();
  const { data, error, loading, refresh } = useServiceData(load);
  const [organizationId, setOrganizationId] = useState("all"); const [siteFilter, setSiteFilter] = useState("all");
  const [search, setSearch] = useState(""); const [clientId, setClientId] = useState("all"); const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Site | "new" | null>(null); const [form, setForm] = useState({ key: "", name: "", clientId: "", environment: "demo", templateType: "multi" as "single" | "multi" }); const [saving, setSaving] = useState(false);
  const clients = useMemo(() => data?.clients ?? [], [data?.clients]); const organizations = useMemo(() => data?.organizations ?? [], [data?.organizations]);
  const clientMap = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]); const orgMap = useMemo(() => new Map(organizations.map((org) => [org.id, org])), [organizations]);
  const sites = useMemo(() => (data?.sites ?? []).filter((site) => { const client = clientMap.get(site.clientId); const org = client && orgMap.get(client.organizationId); const haystack = `${site.name} ${site.key} ${client?.name} ${client?.acronym} ${org?.name}`.toLowerCase(); return haystack.includes(search.toLowerCase()) && (organizationId === "all" || client?.organizationId === organizationId) && (siteFilter === "all" || site.id === siteFilter) && (clientId === "all" || site.clientId === clientId) && (status === "all" || (site.deletedAt ? "archived" : site.status) === status); }), [data, search, clientId, organizationId, siteFilter, status, clientMap, orgMap]);
  const openNew = () => { setForm({ key: "", name: "", clientId: clients[0]?.id ?? "", environment: "demo", templateType: "multi" }); setEditing("new"); };
  const openEdit = (site: Site) => { setForm({ key: site.key, name: site.name, clientId: site.clientId, environment: site.environment, templateType: site.templateType }); setEditing(site); };
  const save = async () => { setSaving(true); try { if (editing === "new") await siteService.createSite({ ...form, displayName: form.name, legacyClientId: clientMap.get(form.clientId)?.key ?? "demo" }); else if (editing) await siteService.updateSite(editing.id, { name: form.name, displayName: form.name, environment: form.environment, templateType: form.templateType }); setEditing(null); await refresh(); } finally { setSaving(false); } };
  const toggleArchive = async (site: Site) => { if (site.deletedAt) await siteService.restoreSite(site.id); else await siteService.archiveSite(site.id); await refresh(); };
  return <Workspace><WorkspaceHeader title="Sites" description="Manage Sites and launch configured environments. Inspect configuration in Portal Library." actions={<Button variant="contained" disabled={!canEdit} onClick={openNew}>Create site</Button>} />
    {error && <Alert severity="error">{error.message}</Alert>}{loading && <Typography color="text.secondary">Loading sites…</Typography>}
    <Stack direction={{ xs: "column", lg: "row" }} gap={1}>
      <Filter label="TPA / Organization" value={organizationId} onChange={(value) => { setOrganizationId(value); setClientId("all"); setSiteFilter("all"); }} options={organizations.map((org) => ({ id: org.id, label: org.name }))} />
      <Filter label="Client" value={clientId} onChange={(value) => { setClientId(value); setSiteFilter("all"); }} options={clients.filter((client) => organizationId === "all" || client.organizationId === organizationId).map((client) => ({ id: client.id, label: client.acronym }))} />
      <Filter label="Site" value={siteFilter} onChange={setSiteFilter} options={(data?.sites ?? []).filter((site) => (clientId === "all" || site.clientId === clientId) && (organizationId === "all" || clientMap.get(site.clientId)?.organizationId === organizationId)).map((site) => ({ id: site.id, label: getSiteAcronym(site.key) }))} />
      <Filter label="Status" value={status} onChange={setStatus} options={["active", "inactive", "archived"].map((id) => ({ id, label: id }))} />
      <SearchField value={search} onChange={setSearch} placeholder="Search sites" />
    </Stack>
    {!loading && sites.length === 0 ? <Alert severity="info">No sites match these filters.</Alert> : <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>TPA</TableCell><TableCell>Client</TableCell><TableCell>Site</TableCell><TableCell>Site key</TableCell><TableCell>Prototype / Sandbox</TableCell><TableCell>UAT / Test</TableCell><TableCell>Pre-production</TableCell><TableCell>Production</TableCell><TableCell>Automation</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{sites.map((site) => { const client = clientMap.get(site.clientId); return <TableRow key={site.id} hover><TableCell>{client ? orgMap.get(client.organizationId)?.name : "—"}</TableCell><TableCell>{client?.name}</TableCell><TableCell>{site.name}</TableCell><TableCell sx={{ fontFamily: "monospace" }}>{site.key}</TableCell><TableCell><Tooltip title={`${site.name} Prototype / Sandbox`}><IconButton size="small" component="a" href={getSitePrototypeUrl(site.key)} target="_blank" rel="noopener noreferrer" aria-label={`${site.name} Prototype / Sandbox`}><OpenInNewRoundedIcon fontSize="small" /></IconButton></Tooltip></TableCell>{([["test"], ["pre-production"], ["production"], ["automation"]] as SiteEnvironment[][]).map((environments) => <TableCell key={environments[0]}>{launchLinks(data?.links ?? [], site.key, environments).map((link) => <Tooltip key={link.id} title={link.label}><IconButton size="small" component="a" href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.label}><OpenInNewRoundedIcon fontSize="small" /></IconButton></Tooltip>)}</TableCell>)}<TableCell><StatusChip label={site.deletedAt ? "Archived" : site.status} /></TableCell><TableCell><Stack direction="row" gap={1}><Link component={RouterLink} to={`/admin-center/library/pages?scope=effective&site=${site.key}`}>Inspect</Link><Button size="small" disabled={!canEdit} onClick={() => openEdit(site)}>Edit</Button><Button size="small" color={site.deletedAt ? "primary" : "warning"} disabled={!canEdit} onClick={() => void toggleArchive(site)}>{site.deletedAt ? "Restore" : "Archive"}</Button></Stack></TableCell></TableRow>; })}</TableBody></Table></ResponsiveTableContainer>}
    <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="sm"><DialogTitle>{editing === "new" ? "Create site" : "Edit site"}</DialogTitle><DialogContent><Stack gap={2} sx={{ pt: 1 }}><TextField label="Stable site key" value={form.key} disabled={editing !== "new"} onChange={(e) => setForm({ ...form, key: e.target.value })} /><TextField label="Site name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><FormControl><InputLabel>Client</InputLabel><Select label="Client" value={form.clientId} disabled={editing !== "new"} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>{clients.map((client) => <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>)}</Select></FormControl><TextField label="Environment" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} /><FormControl><InputLabel>Template</InputLabel><Select label="Template" value={form.templateType} onChange={(e) => setForm({ ...form, templateType: e.target.value as "single" | "multi" })}><MenuItem value="single">Single</MenuItem><MenuItem value="multi">Multi</MenuItem></Select></FormControl></Stack></DialogContent><DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" disabled={!canEdit || saving || !form.key || !form.name || !form.clientId} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</Button></DialogActions></Dialog>
  </Workspace>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ id: string; label: string }> }) {
  const labelId = useId();
  return <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}><InputLabel id={labelId}>{label}</InputLabel><Select labelId={labelId} label={label} value={value} onChange={(event) => onChange(event.target.value)}><MenuItem value="all">All</MenuItem>{options.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}</Select></FormControl>;
}
