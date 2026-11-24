import { useCanEdit } from '../../admin/AccountContext';
import { foundationRepositories } from "../../repositories/foundations";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Alert, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { applicationService } from "../../services/applicationService";
import { persistence } from "../../persistence/client";
import { useServiceData } from "../../hooks/useServiceData";
import { Section, StatusChip, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";
import { useState } from 'react';
import { portalDatabaseEnabled, portalRequest } from '../../services/portalClient';
import type { Application, ApplicationEvent } from '../../persistence/types';

async function load() {
  const [operation, sites, clients] = await Promise.all([
    portalDatabaseEnabled
      ? portalRequest<{ applications: Application[]; events: ApplicationEvent[] }>('/applications', { action: 'list' })
      : Promise.all([applicationService.getApplications(), persistence.list('applicationEvents')]).then(([applications, events]) => ({ applications, events })),
    foundationRepositories.sites.list(), foundationRepositories.clients.list(),
  ]);
  return { ...operation, sites, clients };
}
export default function ApplicationsWorkspace() {
  const canEdit = useCanEdit();
  const { applicationId } = useParams(); const { data, error, loading, refresh } = useServiceData(load);
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  async function transition(id: string, action: 'approve' | 'reject' | 'advisor') {
    setActionError('');
    setSaving(true);
    try {
      if (portalDatabaseEnabled) await portalRequest('/applications', { action, id });
      else if (action === 'approve') await applicationService.approveApplication(id);
      else if (action === 'reject') await applicationService.rejectApplication(id);
      else await applicationService.transitionApplication(id, 'Waiting for Advisor', 'Advisor', { notes: 'Advisor follow-up requested' });
      await refresh();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  }
  if (loading) return <Workspace><Typography>Loading applications…</Typography></Workspace>; if (error) return <Workspace><Alert severity="error">{error.message}</Alert></Workspace>;
  const application = data?.applications.find((entry) => entry.id === applicationId || entry.applicationNumber === applicationId);
  if (application) { const site = data?.sites.find((item) => item.id === application.siteId); const client = data?.clients.find((item) => item.id === site?.clientId); const events = data?.events.filter((event) => event.applicationId === application.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? [];
    const reviewDisabled = !canEdit || saving || application.status !== 'Pending TPA Review';
    return <Workspace><WorkspaceHeader title={application.applicationNumber} description="Prototype application" />
      {actionError && <Alert severity="error">{actionError}</Alert>}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Meta label="Status"><StatusChip label={application.status} /></Meta>
          <Meta label="Action owner"><StatusChip label={application.currentActionOwnerType} /></Meta>
          <Meta label="Site">{site?.displayName ?? site?.key}</Meta>
          <Meta label="Client">{client?.name}</Meta>
          <Meta label="Coverage">{application.coverages ? <ul style={{ paddingInlineStart: 20, margin: 0 }}>{application.coverages.map(item => <li key={`${item.productKey}:${item.applicant}`}>
            {item.productKey} · {item.applicant}{item.amount !== null && ` · ${item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`}
          </li>)}</ul> : application.productKey}</Meta>
          <Meta label="Submitted">{application.submittedAt?.slice(0, 10) ?? '—'}</Meta>
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
          <Button variant="contained" disabled={reviewDisabled} onClick={() => void transition(application.id, 'approve')}>TPA approve</Button>
          <Button color="error" variant="outlined" disabled={reviewDisabled} onClick={() => void transition(application.id, 'reject')}>TPA reject</Button>
          <Button variant="outlined" disabled={portalDatabaseEnabled ? reviewDisabled : !canEdit || saving} onClick={() => void transition(application.id, 'advisor')}>Send to advisor</Button>
        </Stack>
      </Paper>
      <Section title="Application event history"><ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>When</TableCell><TableCell>Event</TableCell><TableCell>Status</TableCell><TableCell>Owner</TableCell><TableCell>Notes</TableCell></TableRow></TableHead><TableBody>{events.map((event) => <TableRow key={event.id}><TableCell>{event.createdAt.slice(0, 19).replace("T", " ")}</TableCell><TableCell>{event.eventType}</TableCell><TableCell>{event.fromStatus} → {event.toStatus}</TableCell><TableCell>{event.fromOwnerType} → {event.toOwnerType}</TableCell><TableCell>{event.notes}</TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer>{events.length === 0 && <Alert severity="info">No transitions recorded yet.</Alert>}</Section>
    </Workspace>;
  }
  if (applicationId) return <Workspace><Alert severity="info">Application unavailable.</Alert><Button component={RouterLink} to="/admin-center/applications">View applications</Button></Workspace>;
  return <Workspace><WorkspaceHeader title="Applications" description="Submitted prototype applications for your Sites." />
    {(data?.applications.length ?? 0) === 0 ? <Alert severity="info">No applications.</Alert> : <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Application</TableCell><TableCell>Site</TableCell><TableCell>Product</TableCell><TableCell>Status</TableCell><TableCell>Action owner</TableCell><TableCell>Updated</TableCell></TableRow></TableHead><TableBody>{data?.applications.map((entry) => <TableRow key={entry.id}><TableCell><Button component={RouterLink} to={`/admin-center/applications/${entry.applicationNumber}`} size="small">{entry.applicationNumber}</Button></TableCell><TableCell>{data.sites.find((site) => site.id === entry.siteId)?.key}</TableCell><TableCell>{entry.productKey}</TableCell><TableCell><StatusChip label={entry.status} /></TableCell><TableCell><StatusChip label={entry.currentActionOwnerType} /></TableCell><TableCell>{entry.updatedAt.slice(0, 10)}</TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer>}
  </Workspace>;
}
function Meta({ label, children }: { label: string; children: React.ReactNode }) { return <Stack gap={0.25}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography component="div" variant="body2" sx={{ fontWeight: 700 }}>{children}</Typography></Stack>; }
