import { Link as RouterLink, useParams } from "react-router-dom";
import { Button, Link, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { getClient, getSite } from "../../data";
import { portalChanges } from "../../admin/domain";
import { Section, StatusChip, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";

export default function ChangesWorkspace() {
  const { changeId } = useParams();
  const change = portalChanges.find((entry) => entry.id === changeId);
  if (change) {
    const site = getSite(change.siteId)!;
    return <Workspace><WorkspaceHeader title={`${change.id} · ${change.title}`} description="Structured change record linked to its affected site, portal object type, and release." actions={<Button component={RouterLink} to="/admin-center/changes" startIcon={<ArrowBackRoundedIcon />}>Changes</Button>} />
      <Paper variant="outlined" sx={{ p: 2 }}><Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}><Detail label="Status"><StatusChip label={change.status} /></Detail><Detail label="Affected site"><Link component={RouterLink} to={`/site-details?site=${site.id}&client=${site.legacyClientId}`}>{site.name} ({site.id})</Link></Detail><Detail label="Client">{getClient(change.clientId)?.name}</Detail><Detail label="Portal object type">{change.type}</Detail><Detail label="Owner / requested by">{change.owner}</Detail><Detail label="Target release"><Link component={RouterLink} to={`/admin-center/releases/${change.targetRelease}`}>{change.targetRelease}</Link></Detail></Stack></Paper>
      <Section title="Value comparison" description="Reserved for the same canonical object referenced above."><Paper variant="outlined" sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">Current value and proposed value will be resolved from the affected portal object. Mutation, approval, diff, Jira, and audit-history services are deferred.</Typography></Paper></Section>
    </Workspace>;
  }
  return <Workspace><WorkspaceHeader title="Changes" description="Internal work queue for structured modifications to portal data." />
    <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Change ID</TableCell><TableCell>Site / client</TableCell><TableCell>Change type</TableCell><TableCell>Status</TableCell><TableCell>Owner / requested by</TableCell><TableCell>Target release</TableCell><TableCell>Updated</TableCell></TableRow></TableHead><TableBody>{portalChanges.map((entry) => <TableRow key={entry.id} hover><TableCell><Link component={RouterLink} to={`/admin-center/changes/${entry.id}`}>{entry.id}</Link></TableCell><TableCell>{entry.siteId} / {getClient(entry.clientId)?.acronym}</TableCell><TableCell>{entry.type}</TableCell><TableCell><StatusChip label={entry.status} /></TableCell><TableCell>{entry.owner}</TableCell><TableCell><Link component={RouterLink} to={`/admin-center/releases/${entry.targetRelease}`}>{entry.targetRelease}</Link></TableCell><TableCell>{entry.updated}</TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer>
  </Workspace>;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) { return <Stack gap={0.25}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography component="div" variant="body2" sx={{ fontWeight: 700 }}>{children}</Typography></Stack>; }
