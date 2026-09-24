import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useOutletContext } from "react-router-dom";
import { Autocomplete, Button, Link, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { clientEntities, getClient, getTpaForClient, siteEntities } from "../../data";
import { changeLog } from "../../content/docs/changeLog";
import { portalChanges, portalReleases } from "../../admin/domain";
import type { AdminCenterContext } from "../../components/admin/AdminCenterShell";
import { Section, StatusChip, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";

type SiteOption = (typeof siteEntities)[number];
const siteDetailsPath = (site: SiteOption) => `/site-details?site=${site.id}&client=${site.legacyClientId}`;

export default function AdminHome() {
  const { persona } = useOutletContext<AdminCenterContext>();
  const navigate = useNavigate();
  const [selectedSite, setSelectedSite] = useState<SiteOption | null>(null);
  const changes = useMemo(() => {
    const priorities: Record<string, (change: (typeof portalChanges)[number]) => boolean> = {
      developer: (change) => change.status === "Development" || change.type === "Rule" || change.type === "Configuration",
      qa: (change) => change.status === "QA" || change.status === "Approved",
      "account-manager": (change) => change.status === "Requested" || change.clientId !== "demo",
      marketing: (change) => ["Content", "Email", "Branding"].includes(change.type),
      "ux-design": (change) => ["Page / Field", "Branding"].includes(change.type),
    };
    const priority = priorities[persona.id];
    return [...portalChanges].sort((a, b) => Number(Boolean(priority?.(b))) - Number(Boolean(priority?.(a))));
  }, [persona.id]);

  const recentActivity = changeLog.slice(0, 4);

  return (
    <Workspace>
      <WorkspaceHeader title="Admin Center Home" description={`Operational view for ${persona.label}. Emphasis: ${persona.emphasis.join(" · ")}.`} />

      <Section title="Site lookup" description="Find the canonical site by site name, ID, client, association, or TPA.">
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems={{ sm: "center" }}>
            <Autocomplete
              fullWidth
              options={siteEntities}
              value={selectedSite}
              onChange={(_, value) => setSelectedSite(value)}
              getOptionLabel={(site) => {
                const client = getClient(site.clientId);
                const tpa = getTpaForClient(site.clientId);
                return `${site.name} · ${site.id} · ${client?.acronym ?? site.clientId} · ${tpa?.acronym ?? tpa?.name ?? ""}`;
              }}
              renderInput={(params) => <TextField {...params} size="small" label="Find a site" placeholder="Name, site ID, client, or TPA" />}
            />
            <Button variant="contained" disabled={!selectedSite} endIcon={<ArrowForwardRoundedIcon />} onClick={() => selectedSite && navigate(siteDetailsPath(selectedSite))} sx={{ minWidth: 130 }}>
              Open site
            </Button>
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Recently viewed:</Typography>
            {siteEntities.slice(0, 3).map((site) => <Link key={site.id} component={RouterLink} to={siteDetailsPath(site)} variant="caption">{getClient(site.clientId)?.acronym} — {site.name}</Link>)}
          </Stack>
        </Paper>
      </Section>

      <Section title="Upcoming releases" description="Scheduled operational scope from current release records." action={<Link component={RouterLink} to="/admin-center/releases" variant="caption">View releases</Link>}>
        <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Release</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell>Sites affected</TableCell><TableCell>Changes</TableCell></TableRow></TableHead><TableBody>
          {portalReleases.map((release) => <TableRow key={release.id} hover><TableCell><Link component={RouterLink} to={`/admin-center/releases/${release.id}`}>{release.name}</Link></TableCell><TableCell>{release.date}</TableCell><TableCell><StatusChip label={release.status} /></TableCell><TableCell>{release.siteIds.length}</TableCell><TableCell>{release.changeIds.length}</TableCell></TableRow>)}
        </TableBody></Table></ResponsiveTableContainer>
      </Section>

      <Section title="Active / recent changes" description="Same work queue, reordered to reflect the selected internal persona." action={<Link component={RouterLink} to="/admin-center/changes" variant="caption">View all changes</Link>}>
        <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Change</TableCell><TableCell>Site / client</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell>Target release</TableCell><TableCell>Updated</TableCell></TableRow></TableHead><TableBody>
          {changes.map((change) => <TableRow key={change.id} hover><TableCell><Link component={RouterLink} to={`/admin-center/changes/${change.id}`}>{change.id} · {change.title}</Link></TableCell><TableCell>{change.siteId} / {getClient(change.clientId)?.acronym}</TableCell><TableCell>{change.type}</TableCell><TableCell><StatusChip label={change.status} /></TableCell><TableCell>{change.targetRelease}</TableCell><TableCell>{change.updated}</TableCell></TableRow>)}
        </TableBody></Table></ResponsiveTableContainer>
      </Section>

      <Section title="Recent portal activity / requires attention" description="Latest documented changes from the existing Portal Admin change log; no synthetic metrics.">
        <Paper variant="outlined"><Stack divider={<span style={{ borderTop: "1px solid #e0e0e0" }} />}>
          {recentActivity.map((entry) => <Stack key={entry.id} direction={{ xs: "column", sm: "row" }} gap={1} sx={{ p: 1.5 }}><Typography variant="caption" sx={{ fontFamily: "monospace", minWidth: 74 }}>{entry.id}</Typography><Typography variant="body2" sx={{ flex: 1 }}>{entry.summary}</Typography><Typography variant="caption" color="text.secondary">{entry.area} · {entry.date}</Typography></Stack>)}
        </Stack></Paper>
      </Section>
      <Typography variant="caption" color="text.secondary">{clientEntities.length} canonical clients and {siteEntities.length} canonical sites are available to this global internal view.</Typography>
    </Workspace>
  );
}
