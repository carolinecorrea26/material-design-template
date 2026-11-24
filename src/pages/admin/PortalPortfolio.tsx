import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, Stack, TextField, Typography } from '@mui/material';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { StatusChip, Workspace, WorkspaceHeader } from '../../components/admin/AdminPrimitives';
import { getSitePrototypeUrl } from '../../config/sitePrototype';
import { useServiceData } from '../../hooks/useServiceData';
import { readPortalSites, type PortalSite } from '../../services/portalClient';

function prototypeUrl(site: PortalSite) {
  const url = new URL(getSitePrototypeUrl(site.key));
  url.searchParams.set('template', site.templateType);
  return url.href;
}

function groupSites(sites: PortalSite[], getKey: (site: PortalSite) => string) {
  const groups = new Map<string, PortalSite[]>();
  for (const site of sites) {
    const key = getKey(site);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(site);
  }
  return groups;
}

export default function PortalPortfolio() {
  const [search, setSearch] = useState('');
  const { data: sites, error, loading, refresh } = useServiceData(readPortalSites);
  const query = search.trim().toLowerCase();
  const visible = (sites ?? []).filter(site => [site.name, site.key, site.associationName, site.organizationName, site.migrationStage, site.migrationStatus].some(value => value?.toLowerCase().includes(query)));
  const organizations = groupSites(visible, site => site.organizationId);
  return <Workspace>
    <WorkspaceHeader title="Sites" description="Prototype access and migration progress by TPA and Association." />
    <TextField label="Search Sites" value={search} onChange={event => setSearch(event.target.value)} size="small" sx={{ maxWidth: 480 }} />
    {loading && <Typography role="status">Loading Sites…</Typography>}
    {error && <Alert severity="error" action={<Button onClick={() => void refresh()}>Retry</Button>}>{error.message}</Alert>}
    {!loading && !error && visible.length === 0 && <Typography>No Sites match your search.</Typography>}
    <Stack spacing={1}>
      {[...organizations].map(([organizationId, group]) => <Accordion key={`${organizationId}:${query}`} defaultExpanded={!!query || group.some(site => site.key === 'asce')} disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRounded />}><Typography fontWeight={700}>{group[0].organizationName} · {group.length} {group.length === 1 ? 'Site' : 'Sites'}</Typography></AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {[...groupSites(group, site => site.hostingAssociationId ?? '')].map(([associationId, associationSites]) => <Stack key={associationId} spacing={1}>
              <Typography component="h2" variant="subtitle1" fontWeight={700}>{associationSites[0].associationName}</Typography>
              {associationSites.map(site => <Stack key={site.key} direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={1}>
                <Typography sx={{ flex: 1 }}>{site.name}</Typography>
                <StatusChip label={site.migrationStage ? `${site.migrationStage} · ${site.migrationStatus}` : site.migrationStatus} />
                <Button size="small" component="a" href={prototypeUrl(site)} target="_blank" rel="noopener noreferrer">Open prototype</Button>
                <Button size="small" component={RouterLink} to={`/admin-center/library?site=${encodeURIComponent(site.key)}`}>View in Library</Button>
              </Stack>)}
            </Stack>)}
          </Stack>
        </AccordionDetails>
      </Accordion>)}
    </Stack>
  </Workspace>;
}
