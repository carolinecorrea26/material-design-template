import { Link as RouterLink, useParams } from "react-router-dom";
import { Button, Link, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { configurationsData } from "../../content/docs/configurations";
import { siteRules } from "../../content/docs/siteRules";
import { featuresData } from "../../content/docs/features";
import { cmsEntries } from "../../content/docs/cmsEntries";
import { pages } from "../../config/pages";
import { siteEntities } from "../../data";
import { Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";

const domains = [
  { id: "configurations", label: "Configurations", description: "Client-configurable portal behavior", count: configurationsData.length, currentPath: "/site-details#configuration-options" },
  { id: "rules", label: "Rules", description: "Global, client, and site behavioral rules", count: siteRules.length, currentPath: "/site-details#rules" },
  { id: "features", label: "Features", description: "Supported portal capabilities", count: featuresData.length, currentPath: "/portal-admin/site-features" },
  { id: "pages-fields", label: "Pages & fields", description: "Registered pages and their field architecture", count: pages.length, currentPath: "/site-details" },
  { id: "emails", label: "Emails", description: "Consumer and advisor email templates", count: undefined, currentPath: "/mock-email-preview" },
  { id: "content", label: "Content", description: "Managed global content and client overrides", count: cmsEntries.length, currentPath: "/portal-admin/cms" },
  { id: "themes", label: "Themes & branding", description: "Theme presets and client brand configuration", count: undefined, currentPath: "/design-system" },
  { id: "documents", label: "Documents", description: "Legal and coverage document references", count: undefined, currentPath: "/portal-admin/cms" },
];

export default function PortalLibrary() {
  const { domainId } = useParams();
  const domain = domains.find((entry) => entry.id === domainId);
  if (domain) return <LibraryDomain domain={domain} />;

  return <Workspace>
    <WorkspaceHeader title="Portal Library" description="Domain-centric access to the same portal definitions used by Site Details." />
    <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, gap: 1.5 }}>
      {domains.map((entry) => <Paper key={entry.id} variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{entry.label}</Typography><Typography variant="body2" color="text.secondary" sx={{ minHeight: 44, mt: 0.5 }}>{entry.description}</Typography><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}><Typography variant="caption" color="text.secondary">{entry.count === undefined ? "Existing reference" : `${entry.count} definitions`}</Typography><Link component={RouterLink} to={`/admin-center/library/${entry.id}`} variant="caption">Browse</Link></Stack></Paper>)}
    </Stack>
  </Workspace>;
}

function LibraryDomain({ domain }: { domain: (typeof domains)[number] }) {
  const rows = domain.id === "configurations"
    ? configurationsData.slice(0, 25).map((item) => ({ id: item.id, name: item.label, group: item.group, scope: item.scope }))
    : domain.id === "rules"
      ? siteRules.slice(0, 25).map((item) => ({ id: item.id, name: item.rule, group: item.area, scope: item.scope ?? "global" }))
      : domain.id === "features"
        ? featuresData.map((item) => ({ id: item.id, name: item.name, group: "Portal capability", scope: "global / client" }))
        : [];
  return <Workspace>
    <WorkspaceHeader title={domain.label} description={`${domain.description}. Definitions are not copied; links return to the current authoritative implementation.`} actions={<Button component={RouterLink} to="/admin-center/library" startIcon={<ArrowBackRoundedIcon />}>Library</Button>} />
    {rows.length > 0 ? <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Definition</TableCell><TableCell>Group / area</TableCell><TableCell>Scope</TableCell><TableCell>Sites</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{row.id}</Typography></TableCell><TableCell>{row.group}</TableCell><TableCell>{row.scope}</TableCell><TableCell><Link component={RouterLink} to="/admin-center/sites">{siteEntities.length} available sites</Link></TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer> : <Paper variant="outlined" sx={{ p: 2.5 }}><Typography variant="body2">This domain already has an authoritative reference in the current Portal Admin.</Typography><Link component={RouterLink} to={domain.currentPath}>Open current {domain.label} reference</Link></Paper>}
  </Workspace>;
}
