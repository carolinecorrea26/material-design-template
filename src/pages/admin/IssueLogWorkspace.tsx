import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { Section, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import BrowseTable from "../../components/docs/BrowseTable";
import { readLibraryCatalog } from "../../services/libraryCatalogService";
import { useServiceData } from "../../hooks/useServiceData";
import { useCanEdit } from "../../admin/AccountContext";

type Scope = "TPA" | "Client" | "Site";
type Issue = { id: string; title: string; description: string; scope: Scope; targetId: string; targetName: string; priority: string; createdAt: string; status: "Open" | "Resolved" };
const storageKey = "portal.prototype.manualIssues.v1";
const loadIdentities = () => readLibraryCatalog('all');
function readIssues(): Issue[] {
  const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  if (!Array.isArray(parsed) || !parsed.every(row => row && typeof row.id === "string" && typeof row.title === "string" && typeof row.description === "string" && ["TPA", "Client", "Site"].includes(row.scope) && typeof row.targetId === "string" && typeof row.targetName === "string" && typeof row.priority === "string" && typeof row.createdAt === "string" && ["Open", "Resolved"].includes(row.status))) throw new Error("Saved issues could not be read.");
  return parsed;
}

export default function IssueLogWorkspace() {
  const canEdit = useCanEdit();
  const identities = useServiceData(loadIdentities);
  const [initial] = useState(() => { try { return { issues: readIssues(), error: "" }; } catch { return { issues: [], error: "Saved issues could not be read. Issue changes are unavailable in this browser." }; } });
  const [issues, setIssues] = useState<Issue[]>(initial.issues);
  const [error, setError] = useState(initial.error);
  const [tab, setTab] = useState("manual");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<Scope>("Site");
  const [targetId, setTargetId] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [attempted, setAttempted] = useState(false);
  const targets = (scope === "TPA" ? identities.data?.data.organizations : scope === "Client" ? identities.data?.data.clients : identities.data?.data.sites) ?? [];
  const target = targets.find(row => row.id === targetId);
  const writable = canEdit && !initial.error && !identities.loading && !identities.error;
  function save(next: Issue[]) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setIssues(next); setError(""); return true; }
    catch { setError("Issues could not be saved. Check browser storage and try again."); return false; }
  }
  function add(event: FormEvent) {
    event.preventDefault(); setAttempted(true);
    if (!writable || !title.trim() || !target) return;
    if (save([{ id: crypto.randomUUID(), title: title.trim(), description: description.trim(), scope, targetId, targetName: target.name, priority, createdAt: new Date().toISOString(), status: "Open" }, ...issues])) {
      setAdding(false); setTitle(""); setDescription(""); setTargetId(""); setPriority("Medium"); setAttempted(false);
    }
  }
  const openIssues = issues.filter(issue => issue.status === "Open");
  return <Workspace>
    <WorkspaceHeader title="Issue Log" description="Track open issues for TPAs, clients, and sites." />
    <Alert severity="info">Prototype: manual issues are saved in this browser only.</Alert>
    {error && <Alert severity="error">{error}</Alert>}
    {identities.loading && <Typography>Loading TPA, Association and Site records…</Typography>}
    {identities.error && <Alert severity="error">Identity records could not be loaded: {identities.error.message}<Button onClick={() => void identities.refresh()}>Retry</Button></Alert>}
    <Section title="Open issues" action={tab === "manual" && writable ? <Button variant="contained" onClick={() => setAdding(true)}>Add issue</Button> : undefined}>
      <Tabs value={tab} onChange={(_, value: string) => setTab(value)} aria-label="Open issue sources" sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tab value="manual" label={`Manually created (${openIssues.length})`} id="issues-tab-manual" aria-controls="issues-panel-manual" />
        <Tab value="jira" label="Jira" id="issues-tab-jira" aria-controls="issues-panel-jira" />
      </Tabs>
      <Box role="tabpanel" id={`issues-panel-${tab}`} aria-labelledby={`issues-tab-${tab}`}>
        {tab === "jira" ? <Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={1}><Typography variant="h6">Jira · TBD</Typography><Typography color="text.secondary">Jira issues will appear here in a future release. No Jira integration is connected in this prototype.</Typography></Stack></Paper> : <BrowseTable label="Open issues" rows={openIssues} rowKey={row => row.id} acceptUrlFilters={false} hiddenColumns={["displayId"]} columns={[
          { id: "title", label: "Issue", value: row => `${row.title} ${row.description}`, width: 340, render: row => <><Typography variant="body2" fontWeight={700}>{row.title}</Typography><Typography variant="body2" color="text.secondary">{row.description}</Typography></> },
          { id: "scope", label: "Scope", value: row => row.scope, filter: true, width: 120 },
          { id: "target", label: "TPA / Client / Site", value: row => row.targetName, filter: true, width: 240 },
          { id: "priority", label: "Priority", value: row => row.priority, filter: true, width: 120 },
          { id: "created", label: "Created", value: row => row.createdAt.slice(0, 10), width: 140 },
          { id: "status", label: "Status", value: row => row.status, width: 180, render: row => <Stack spacing={1}><Typography variant="body2">Open</Typography>{writable && <Button size="small" variant="outlined" onClick={() => save(issues.map(issue => issue.id === row.id ? { ...issue, status: "Resolved" } : issue))}>Mark resolved</Button>}</Stack> },
        ]} />}
      </Box>
    </Section>
    <Dialog open={adding} onClose={() => setAdding(false)} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={add} noValidate>
        <DialogTitle>Add issue</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField autoFocus label="Issue title" required value={title} onChange={event => setTitle(event.target.value)} error={attempted && !title.trim()} helperText={attempted && !title.trim() ? "Enter an issue title." : undefined} />
          <TextField label="Description" multiline minRows={3} value={description} onChange={event => setDescription(event.target.value)} />
          <TextField select label="Scope" value={scope} onChange={event => { setScope(event.target.value as Scope); setTargetId(""); }}>{(["TPA", "Client", "Site"] as const).map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
          <TextField select label={scope} required value={targetId} onChange={event => setTargetId(event.target.value)} error={attempted && !target} helperText={attempted && !target ? `Select a ${scope.toLowerCase()}.` : undefined}>{targets.map(row => <MenuItem key={row.id} value={row.id}>{row.name} · {row.id}</MenuItem>)}</TextField>
          <TextField select label="Priority" value={priority} onChange={event => setPriority(event.target.value)}>{["Low", "Medium", "High", "Critical"].map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => setAdding(false)}>Cancel</Button><Button variant="contained" type="submit" disabled={!writable}>Add issue</Button></DialogActions>
      </Box>
    </Dialog>
  </Workspace>;
}
