import { canonicalSiteKey } from '../../../domain/siteIdentity.mjs';
import { useEffect, useState } from "react";
import { readLibraryCatalog } from "../../../services/libraryCatalogService";
import type { Client, Site } from "../../../persistence/types";
import { Alert, Autocomplete, Button, Paper, TextField, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { getSite, siteEntities, type SiteId } from "../../../data";

export type LibrarySelection = SiteId | "all";
export function getLibrarySelection(search: URLSearchParams): LibrarySelection {
  const value = search.get("site");
  const requested = value ? canonicalSiteKey(value) : null;
  if (search.get("scope") === "global" || !requested || requested === "all" || (!getSite(requested) && !/^[a-z][a-z0-9-]{2,79}$/.test(requested))) return "all";
  return requested;
}
export function useLibrarySelection(): [LibrarySelection, (selection: LibrarySelection) => void] {
  const [search, setSearch] = useSearchParams();
  const selection = getLibrarySelection(search);
  useEffect(() => {
    const requested = search.get('site');
    if (requested && canonicalSiteKey(requested) !== requested) setSearch(previous => {
      const next = new URLSearchParams(previous); next.set('site', canonicalSiteKey(requested)); return next;
    }, { replace: true });
  }, [search, setSearch]);
  return [selection, nextSelection => setSearch(new URLSearchParams({ site: nextSelection }), { replace: true })];
}
/** A concrete Site is required by legacy effective inspectors; All inspectors
 * read their complete catalogs and do not use this fallback as their inventory. */
export function useLibrarySite(): [SiteId, (siteId: SiteId) => void] {
  const [selection, setSelection] = useLibrarySelection();
  return [selection === "all" ? siteEntities[0].id : selection, setSelection];
}

export default function LibrarySiteSelector({ siteId, onChange }: { siteId: LibrarySelection; onChange: (siteId: LibrarySelection) => void }) {
  const [catalog, setCatalog] = useState<{ sites: Site[]; clients: Client[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    let active = true;
    readLibraryCatalog('all').then(result => { if (active) setCatalog(result.data); }).catch(value => { if (active) setError(value instanceof Error ? value.message : String(value)); });
    return () => { active = false; };
  }, [generation]);
  if (error) return <Alert severity="error">Site identities could not be loaded: {error}<Button onClick={() => { setError(null); setGeneration(value => value + 1); }}>Retry</Button></Alert>;
  if (!catalog) return <Typography>Loading Site identities…</Typography>;
  const { sites, clients } = catalog;
  const options = [{ id: "all", label: "All sites", group: "All sites" }, ...sites.map(site => {
    const client = clients.find(c => c.id === site.clientId);
    const clientKey = client?.key;
    return { id: site.key, label: `${client?.acronym ?? site.clientId} · ${site.key}${site.key === clientKey ? '' : ` · ${site.name}`}`, group: client?.acronym ?? site.clientId };
  }).sort((a, b) => a.group.localeCompare(b.group) || a.id.localeCompare(b.id))];
  const selected = options.find(option => option.id === siteId);
  if (!selected) return <Alert severity="error">The selected Site is unavailable in the stored catalog.<Button onClick={() => onChange('all')}>Show all Sites</Button></Alert>;
  return <Paper component="section" aria-label="Site scope selector" variant="outlined" sx={{ p: 2 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Effective Site scope</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>All shows the complete Library catalog and default placements. Choose a Site to see its effective configuration and applicable shared standards.</Typography>
    <Autocomplete options={options} value={selected} disableClearable groupBy={option => option.group} getOptionLabel={option => option.label} isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, option) => onChange(option.id)} sx={{ maxWidth: 640 }} renderInput={params => <TextField {...params} label="Search sites by client or site name" placeholder="Search, e.g. WAEPA" />} />
  </Paper>;
}
