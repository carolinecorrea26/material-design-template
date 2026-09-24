import { Link as RouterLink, useParams } from "react-router-dom";
import { Alert, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { applicationRecords } from "../../admin/domain";
import { getClient, getSite } from "../../data";
import { StatusChip, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";

export default function ApplicationsWorkspace() {
  const { applicationId } = useParams();
  const application = applicationRecords.find((entry) => entry.id === applicationId);
  if (application) {
    const site = getSite(application.siteId)!;
    return <Workspace><WorkspaceHeader title={application.id} description="Internal support and status investigation view." actions={<Button component={RouterLink} to="/admin-center/applications" startIcon={<ArrowBackRoundedIcon />}>Applications</Button>} />
      <Alert severity="info">Application status and current action owner are modeled separately so TPA and Advisor experiences can answer who acts next without overloading status.</Alert>
      <Paper variant="outlined" sx={{ p: 2 }}><Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}><Meta label="Application status"><StatusChip label={application.status} /></Meta><Meta label="Current action owner"><StatusChip label={application.actionOwner} /></Meta><Meta label="Site">{site.name} ({site.id})</Meta><Meta label="Client">{getClient(application.clientId)?.name}</Meta><Meta label="Product">{application.product}</Meta><Meta label="Submitted">{application.submitted}</Meta><Meta label="Last updated">{application.updated}</Meta></Stack></Paper>
    </Workspace>;
  }
  return <Workspace><WorkspaceHeader title="Applications" description="Cross-client internal support lookup—not the primary TPA or advisor workflow." />
    <Alert severity="info">TPA Admin and Advisor remain separate experiences. This workspace exposes only an internal operational summary.</Alert>
    <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Application ID</TableCell><TableCell>Site</TableCell><TableCell>Client</TableCell><TableCell>Product</TableCell><TableCell>Submitted</TableCell><TableCell>Current status</TableCell><TableCell>Current action owner</TableCell><TableCell>Last updated</TableCell></TableRow></TableHead><TableBody>{applicationRecords.map((entry) => <TableRow key={entry.id} hover><TableCell><Button component={RouterLink} to={`/admin-center/applications/${entry.id}`} size="small">{entry.id}</Button></TableCell><TableCell>{entry.siteId}</TableCell><TableCell>{getClient(entry.clientId)?.acronym}</TableCell><TableCell>{entry.product}</TableCell><TableCell>{entry.submitted}</TableCell><TableCell><StatusChip label={entry.status} /></TableCell><TableCell><StatusChip label={entry.actionOwner} /></TableCell><TableCell>{entry.updated}</TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer>
  </Workspace>;
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) { return <Stack gap={0.25}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography component="div" variant="body2" sx={{ fontWeight: 700 }}>{children}</Typography></Stack>; }
