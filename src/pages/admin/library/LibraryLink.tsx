import type { ReactNode } from "react";
import { Link } from "@mui/material";
import { getLibrarySelection } from "./LibrarySiteSelector";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { libraryOwners } from '../../../domain/libraryOwnership';

/** Carry scope/Site context, never unrelated domain filters. */
export function libraryHref(domain: string, search: URLSearchParams, filters: Record<string, string> = {}) {
  if (domain === 'coverage') domain = !filters.dataset || (libraryOwners.products as readonly string[]).includes(filters.dataset) ? 'products' : 'rules';
  if (domain === 'patterns' || domain === 'flags') domain = 'rules';
  const next = new URLSearchParams();
  next.set("site", getLibrarySelection(search));
  for (const [key, value] of Object.entries(filters)) next.set(key, value);
  if (Object.values(filters).some(Boolean)) next.set("table", ({ configurations: 'configurationDefinitions', 'url-parameters': 'urlParameters' } as Record<string, string>)[domain] ?? domain);
  return `/admin-center/library/${domain}?${next}`;
}
export default function LibraryLink({ domain, filters, children }: { domain: string; filters?: Record<string, string>; children: ReactNode }) {
  const [search] = useSearchParams();
  return <Link color="primary" component={RouterLink} to={libraryHref(domain, search, filters)}>{children}</Link>;
}
