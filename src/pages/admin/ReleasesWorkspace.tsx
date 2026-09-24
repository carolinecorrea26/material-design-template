import { Link as RouterLink, useParams } from "react-router-dom";
import { Button, Link, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { getSite } from "../../data";
import { portalChanges, portalReleases } from "../../admin/domain";
import { Section, StatusChip, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";

export default function ReleasesWorkspace() {
  const { releaseId } = useParams();
  const release = portalReleases.find((entry) => entry.id === releaseId);
  if (release) {
    const changes = portalChanges.filter((change) => release.changeIds.includes(change.id));
    return <Workspace><WorkspaceHeader title={release.name} description={release.notes} actions={<Button component={RouterLink} to="/admin-center/releases" startIcon={<ArrowBackRoundedIcon />}>Releases</Button>} />
      <Paper variant="outlined" sx={{ p: 2 }}><Stack direction={{ xs: "column", sm: "row" }} gap={4}><Meta label="Release ID" value={release.id} /><Meta label="Date" value={release.date} /><Stack gap={0.25}><Typography variant="caption" color="text.secondary">Status</Typography><StatusChip label={release.status} /></Stack><Meta label="QA scope" value={`${release.siteIds.length} site(s) · ${changes.length} change(s)`} /></Stack></Paper>
      <Section title="Changes"><ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Change</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell>Site</TableCell></TableRow></TableHead><TableBody>{changes.map((change) => <TableRow key={change.id}><TableCell><Link component={RouterLink} to={`/admin-center/changes/${change.id}`}>{change.id} · {change.title}</Link></TableCell><TableCell>{change.type}</TableCell><TableCell><StatusChip label={change.status} /></TableCell><TableCell>{change.siteId}</TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer></Section>
      <Section title="Sites"><Stack direction="row" flexWrap="wrap" gap={1}>{release.siteIds.map((siteId) => { const site = getSite(siteId)!; return <Button key={siteId} size="small" component={RouterLink} to={`/site-details?site=${site.id}&client=${site.legacyClientId}`} variant="outlined">{site.name}</Button>; })}</Stack></Section>
    </Workspace>;
  }
  return <Workspace><WorkspaceHeader title="Releases" description="First-class release records connecting dates, changes, sites, QA scope, and notes." />
    <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Release</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell>Sites affected</TableCell><TableCell>Changes</TableCell></TableRow></TableHead><TableBody>{portalReleases.map((entry) => <TableRow key={entry.id} hover><TableCell><Link component={RouterLink} to={`/admin-center/releases/${entry.id}`}>{entry.name}</Link></TableCell><TableCell>{entry.date}</TableCell><TableCell><StatusChip label={entry.status} /></TableCell><TableCell>{entry.siteIds.length}</TableCell><TableCell>{entry.changeIds.length}</TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer>
  </Workspace>;
}

function Meta({ label, value }: { label: string; value: string }) { return <Stack gap={0.25}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography></Stack>; }
