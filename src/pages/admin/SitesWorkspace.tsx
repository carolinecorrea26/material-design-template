import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { FormControl, InputLabel, Link, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { clientEntities, getClient, getTpaForClient, siteEntities, tpaEntities } from "../../data";
import { StatusChip, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import SearchField from "../../components/docs/SearchField";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";

export default function SitesWorkspace() {
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("all");
  const [tpaId, setTpaId] = useState("all");
  const [status, setStatus] = useState("all");
  const sites = useMemo(() => siteEntities.filter((site) => {
    const client = getClient(site.clientId);
    const tpa = getTpaForClient(site.clientId);
    const haystack = `${site.name} ${site.id} ${client?.name} ${client?.acronym} ${tpa?.name} ${tpa?.acronym}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (clientId === "all" || site.clientId === clientId) && (tpaId === "all" || client?.tpaId === tpaId) && (status === "all" || site.status === status);
  }), [clientId, search, status, tpaId]);

  return <Workspace>
    <WorkspaceHeader title="Sites" description="Find and select a site. Site Details remains the authoritative management workspace." />
    <Stack direction={{ xs: "column", lg: "row" }} gap={1}>
      <SearchField value={search} onChange={setSearch} placeholder="Search site, ID, client, or TPA" />
      <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Client</InputLabel><Select value={clientId} label="Client" onChange={(event) => setClientId(event.target.value)}><MenuItem value="all">All clients</MenuItem>{clientEntities.map((client) => <MenuItem key={client.id} value={client.id}>{client.acronym}</MenuItem>)}</Select></FormControl>
      <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>TPA / organization</InputLabel><Select value={tpaId} label="TPA / organization" onChange={(event) => setTpaId(event.target.value)}><MenuItem value="all">All organizations</MenuItem>{tpaEntities.map((tpa) => <MenuItem key={tpa.id} value={tpa.id}>{tpa.acronym ?? tpa.name}</MenuItem>)}</Select></FormControl>
      <FormControl size="small" sx={{ minWidth: 140 }}><InputLabel>Status</InputLabel><Select value={status} label="Status" onChange={(event) => setStatus(event.target.value)}><MenuItem value="all">All statuses</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem></Select></FormControl>
    </Stack>
    <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Site</TableCell><TableCell>Site ID</TableCell><TableCell>Client</TableCell><TableCell>TPA / organization</TableCell><TableCell>Template</TableCell><TableCell>Status</TableCell><TableCell>Action</TableCell></TableRow></TableHead><TableBody>
      {sites.map((site) => { const client = getClient(site.clientId); const tpa = getTpaForClient(site.clientId); return <TableRow key={site.id} hover><TableCell>{site.name}</TableCell><TableCell sx={{ fontFamily: "monospace" }}>{site.id}</TableCell><TableCell>{client?.name}</TableCell><TableCell>{tpa?.name}</TableCell><TableCell>{site.templateType}</TableCell><TableCell><StatusChip label={site.status === "active" ? "Active" : "Inactive"} /></TableCell><TableCell><Link component={RouterLink} to={`/site-details?site=${site.id}&client=${site.legacyClientId}`}>Site Details</Link></TableCell></TableRow>; })}
    </TableBody></Table></ResponsiveTableContainer>
  </Workspace>;
}
