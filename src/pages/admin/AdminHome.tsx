import { foundationRepositories } from "../../repositories/foundations";
import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useOutletContext } from "react-router-dom";
import { Alert, Autocomplete, Box, Button, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { siteService } from "../../services/siteService";
import { releaseService } from "../../services/releaseService";
import { changeRequestService } from "../../services/changeRequestService";
import { auditService } from "../../services/auditService";
import { applicationService } from "../../services/applicationService";
import { analyticsService } from "../../services/analyticsService";
import type { Site } from "../../persistence/types";
import { useServiceData } from "../../hooks/useServiceData";
import type { AdminCenterContext } from "../../components/admin/AdminCenterShell";
import { Section, StatusChip, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";

const load = async () => ({
  sites: await siteService.getSites(), clients: await foundationRepositories.clients.list(), organizations: await foundationRepositories.organizations.list(),
  releases: await releaseService.getUpcomingReleases(), changes: await changeRequestService.getChangeRequests(), audits: await auditService.getRecent(6),
  applications: await applicationService.getApplications(), analytics: await analyticsService.getDashboard(),
});

function DashboardKpi({ label, value, detail, to }: { label: string; value: string | number; detail: string; to: string }) {
  return <Paper component={RouterLink} to={to} variant="outlined" sx={{ p: 2, textDecoration: "none", color: "inherit", transition: "160ms", "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)", boxShadow: 2 } }}>
    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{detail}</Typography>
  </Paper>;
}

export default function AdminHome() {
  const { persona } = useOutletContext<AdminCenterContext>(); const navigate = useNavigate();
  const [selectedSite, setSelectedSite] = useState<Site | null>(null); const { data, error, loading } = useServiceData(load);
  const clientMap = useMemo(() => new Map(data?.clients.map((client) => [client.id, client]) ?? []), [data]);
  const orgMap = useMemo(() => new Map(data?.organizations.map((org) => [org.id, org]) ?? []), [data]);
  const changes = useMemo(() => [...(data?.changes ?? [])].filter((change) => !change.deletedAt && change.status !== "Released").sort((a, b) => Number(b.status === "QA") - Number(a.status === "QA")), [data]);
  const actionApps = data?.applications.filter((application) => !application.deletedAt && application.status !== "Completed" && application.currentActionOwnerType !== "None") ?? [];
  const nextRelease = data?.releases[0];
  const appMeasurements = data?.analytics.measurements.filter((row) => row.metricKey === "submitted_applications" && row.periodType === "month" && row.periodStart.startsWith("2026")) ?? [];
  const maxApps = Math.max(...appMeasurements.map((row) => row.value), 1);
  const attention = [...changes.slice(0, 3).map((change) => ({ id: change.id, title: `${change.changeNumber} · ${change.title}`, meta: `${change.status} · ${change.ownerId ?? change.requestedBy}`, to: `/admin-center/changes/${change.changeNumber}`, status: change.status })), ...actionApps.filter((app) => app.currentActionOwnerType === "TPA" || app.currentActionOwnerType === "Advisor").slice(0, 2).map((app) => ({ id: app.id, title: `${app.applicationNumber} · ${app.productKey}`, meta: `Waiting for ${app.currentActionOwnerType}`, to: `/admin-center/applications/${app.applicationNumber}`, status: app.status }))];

  return <Workspace><WorkspaceHeader title="Admin Center" description={`What needs attention across the portal for ${persona.label}. Using persistent local demo data.`} />
    {error && <Alert severity="error">{error.message}</Alert>}{loading && <Typography>Loading operational data…</Typography>}
    <Paper variant="outlined" sx={{ p: 2 }}><Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems={{ sm: "center" }}><Box sx={{ flex: 1 }}><Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>Find a site</Typography><Autocomplete fullWidth options={data?.sites ?? []} value={selectedSite} onChange={(_, value) => setSelectedSite(value)} getOptionLabel={(site) => { const client = clientMap.get(site.clientId); const org = client && orgMap.get(client.organizationId); return `${site.name} · ${site.key} · ${client?.acronym ?? ""} · ${org?.name ?? ""}`; }} renderInput={(params) => <TextField {...params} size="small" placeholder="Search by site, key, client, or TPA" />} /></Box><Button variant="contained" disabled={!selectedSite} endIcon={<ArrowForwardRoundedIcon />} onClick={() => selectedSite && navigate(`/admin-center/library/pages?scope=effective&site=${selectedSite.key}`)} sx={{ mt: { sm: 3.4 } }}>Open site</Button></Stack></Paper>

    <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, gap: 1.5 }}>
      <DashboardKpi label="Sites" value={data?.sites.filter((site) => site.status === "active").length ?? 0} detail="active sites" to="/admin-center/sites" />
      <DashboardKpi label="Open changes" value={changes.length} detail={`${changes.filter((change) => change.status === "QA").length} currently in QA`} to="/admin-center/changes" />
      <DashboardKpi label="Next release" value={nextRelease ? new Date(`${nextRelease.releaseDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"} detail={nextRelease?.name ?? "No release scheduled"} to="/admin-center/releases" />
      <DashboardKpi label="Applications requiring action" value={actionApps.length} detail="across applicants, advisors, TPAs, and NYL" to="/admin-center/applications" />
    </Stack>

    <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.6fr) minmax(280px, 0.8fr)" }, gap: 2 }}>
      <Section title="Requires attention" description="Open work prioritized by workflow state and action owner." action={<Link component={RouterLink} to="/admin-center/changes">View all changes</Link>}><Paper variant="outlined">{attention.length ? attention.map((item, index) => <Stack component={RouterLink} to={item.to} key={item.id} direction="row" alignItems="center" gap={1.5} sx={{ p: 1.5, color: "inherit", textDecoration: "none", borderTop: index ? "1px solid" : 0, borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }}><ErrorOutlineRoundedIcon color={item.status === "QA" ? "warning" : "action"} /><Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{item.title}</Typography><Typography variant="caption" color="text.secondary">{item.meta}</Typography></Box><StatusChip label={item.status} /></Stack>) : <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Nothing needs attention.</Typography>}</Paper></Section>
      <Section title="Upcoming" description="Next scheduled portal releases." action={<Link component={RouterLink} to="/admin-center/releases">Calendar</Link>}><Paper variant="outlined">{data?.releases.slice(0, 3).map((release, index) => <Stack component={RouterLink} to={`/admin-center/releases/${release.releaseKey}`} key={release.id} direction="row" gap={1.25} sx={{ p: 1.5, color: "inherit", textDecoration: "none", borderTop: index ? "1px solid" : 0, borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }}><CalendarMonthRoundedIcon color="primary" /><Box><Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(`${release.releaseDate}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</Typography><Typography variant="caption" color="text.secondary">{release.name} · {release.status}</Typography></Box></Stack>)}</Paper></Section>
    </Stack>

    <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.35fr) minmax(320px, 1fr)" }, gap: 2 }}>
      <Section title="Portal performance" description="Submitted applications · Jan-Aug 2026" action={<Link component={RouterLink} to="/admin-center/analytics">Open analytics</Link>}><Paper variant="outlined" sx={{ p: 2 }}><Stack direction="row" alignItems="flex-end" gap={1} sx={{ height: 150 }}>{appMeasurements.map((row) => <Stack key={row.id} alignItems="center" justifyContent="flex-end" sx={{ flex: 1, height: "100%" }}><Box title={`${row.periodStart}: ${row.value.toLocaleString()}`} sx={{ width: "min(42px, 80%)", height: `${(row.value / maxApps) * 105}px`, bgcolor: "primary.main", borderRadius: "5px 5px 0 0", opacity: 0.86 }} /><Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>{new Date(`${row.periodStart}T12:00:00`).toLocaleDateString("en-US", { month: "short" })}</Typography></Stack>)}</Stack></Paper></Section>
      <Section title="Recent activity" description="Latest persisted audit events."><Paper variant="outlined"><Stack>{data?.audits.map((event, index) => <Stack key={event.id} gap={0.25} sx={{ p: 1.5, borderTop: index ? "1px solid" : 0, borderColor: "divider" }}><Typography variant="body2" sx={{ fontWeight: 700, textTransform: "capitalize" }}>{event.action.replace("_", " ")} · {event.entityType}</Typography><Typography variant="caption" color="text.secondary">{event.entityId} · {new Date(event.createdAt).toLocaleString()}</Typography></Stack>)}{!data?.audits.length && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Activity appears after the first create, update, transition, archive, or restore action.</Typography>}</Stack></Paper></Section>
    </Stack>
  </Workspace>;
}
