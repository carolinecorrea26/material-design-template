import LibraryTag from "../../../components/docs/LibraryTag";
import { useSearchParams } from "react-router-dom";
import { getOrderedLibraryPages } from "./libraryInspection";
import { siteFieldOverrides } from "../../../config/fields/fieldOverrides";
import LibraryLink from "./LibraryLink";
import { ruleRelations, getLibraryRules } from "./libraryInspection";
import { libraryRepository } from "../../../repositories/libraryRepository";
import { libraryMetadata } from "../../../domain/provenance";
import { useMemo } from "react";
import { Link, MenuItem, Stack, TextField, Typography } from "@mui/material";


import { pageFieldOrder } from "../../../config/fields/pageFieldOrder";
import { getFieldInventory, getFieldPlacements, selectFieldInventory, type InspectedField } from "../../../config/fields/inspectionInventory";
import type { FieldDefinition } from "../../../config/fields/types";

import { getFieldStorybookReference } from "../../../content/docs/fieldStorybook";
import { getStorybookStoryUrl } from "../../../config/storybook";
import BrowseTable from "../../../components/docs/BrowseTable";
import { useLibraryScope } from "./LibraryScope";
import { useLibrarySite } from "./LibrarySiteSelector";
import { ValidationLibrary } from "./SiteDetailsLibraryDomains";

const fieldCatalog = libraryRepository.read("fieldCatalog");

type FieldRow = InspectedField & { key: string; field: FieldDefinition; pages: string[]; included: string; status: string; notes: string[]; area: string; condition: string; storage: string; sites: string[] };
export default function FieldsLibrary() {
  const pages = getOrderedLibraryPages();
  const scope = useLibraryScope();
  const [search, setSearch] = useSearchParams();
  const view = search.get("fieldView") === "tools" ? "tools" : search.get("fieldView") === "unplaced" ? "unplaced" : search.get("fieldView") === "all" || scope === "global" && !search.has("fieldView") ? "all" : "pages";
  const includeLinkedTools = search.get("linkedTools") === "true";
  const updateView = (key: string, value: string) => {
    setSearch(previous => {
      const next = new URLSearchParams(previous);
      if (key === "fieldView") {
        next.set(key, value === "combined" ? "pages" : value);
        if (value === "combined") next.set("linkedTools", "true"); else next.delete("linkedTools");
      } else if (value) next.set(key, value); else next.delete(key);
      next.delete("area");
      if (key === "fieldView") next.delete("group");
      return next;
    });
  };
  const selectedPage = search.get("pages");
  const [siteId] = useLibrarySite();
  const rules = getLibraryRules(scope, siteId);
  const inventory = useMemo(() => getFieldInventory(scope, siteId), [scope, siteId]);
  const availablePages = [...new Set(inventory.flatMap(row => getFieldPlacements(row).map(p => p.pageId)))];
  const rows = selectFieldInventory(inventory, view, view === "unplaced" ? undefined : selectedPage ?? undefined, includeLinkedTools)
    .map((row,index): FieldRow => ({...row,key:`${row.group?.id ?? row.pageId}:${row.field.id}:${index}`,pages:[...new Set(getFieldPlacements(row).map(p => p.pageId))],included:"Yes"}));
  const orderedRows = [...rows];
  if (selectedPage) {
    const order = [...(pageFieldOrder[selectedPage as keyof typeof pageFieldOrder] ?? []), ...getFieldInventory(scope,siteId).filter(row => row.pageId === selectedPage).map(row=>row.field.id)];
    const rank = (id: string) => order.indexOf(id) < 0 ? Number.MAX_SAFE_INTEGER : order.indexOf(id);
    orderedRows.sort((a,b)=>rank(a.field.id)-rank(b.field.id));
  }
  return <Stack spacing={3}>
    <Typography variant="body2" color="text.secondary">All fields includes default page placements, shared tools and unplaced definitions. Choose a page or field view to narrow the catalog. Linked tools are calculators and drawers opened from that page.</Typography>
    <BrowseTable stableFilterLayout filterControls={<>
      <TextField select size="small" label="Show" value={view === "pages" && includeLinkedTools ? "combined" : view} sx={{width: 240, flexShrink: 0}} onChange={event => updateView("fieldView", event.target.value)}>
        <MenuItem value="all">All fields</MenuItem>
        <MenuItem value="pages">Page fields only</MenuItem>
        <MenuItem value="combined">Page fields + linked tools</MenuItem>
        <MenuItem value="tools">Shared tools</MenuItem>
        {scope === "global" && <MenuItem value="unplaced">Unplaced definitions</MenuItem>}
      </TextField>
      <TextField select size="small" disabled={view === "unplaced"} label="Page" value={selectedPage ?? ""} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }} sx={{width: 240, flexShrink: 0}} onChange={event => updateView("pages", event.target.value)}>
        <MenuItem value="">All pages</MenuItem>
        {pages.filter(page => scope === "global" || availablePages.includes(page.id)).map(page => <MenuItem key={page.id} value={page.id}>{page.id}</MenuItem>)}
      </TextField>

    </>} hiddenColumns={scope === "global" ? ["included", "status", "notes"] : ["sites"]} key={`${scope}:${siteId}:${view}:${includeLinkedTools}`} label="Fields" rows={orderedRows.map(row => ({ ...row, ...libraryMetadata("fields", row.field.id, `prototype:fields/${row.field.id}`) }))} rowKey={(row) => row.key} columns={[
      { id: "field", label: "Field", width: 240, value: (row) => `${row.field.label} ${row.field.id}`, render: ({ field }) => <><Typography variant="body2" fontWeight={700}>{field.label}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{field.id}</Typography></> },
      { id: "pages", label: "Page", width: 180, value: row => row.pages.join(", ") || "Unplaced", render: row => {
        const links = row.pages.map((page, i) => <span key={page}>{i > 0 && ", "}<LibraryLink domain="pages" filters={{ q: page }}>{page}</LibraryLink></span>);
        return row.pages.length > 3 ? <details><summary>{row.pages.length} pages</summary>{links}</details> : row.pages.length ? <>{links}</> : "Unplaced";
      } },
      { id: "group", label: "Field group", width: 180, value: row => row.group?.label ?? "Page fields", filter: true },
      { id: "placements", label: "Access path", width: 300, value: row => getFieldPlacements(row).map(p => `${p.pageId} → ${p.accessPath} (${p.presentation}); ${p.condition}`).join("; "), render: row => {
        const placements = getFieldPlacements(row);
        const paths = placements.map((p, i) => <Typography key={i} variant="body2">{p.pageId} → {p.accessPath} ({p.presentation}) · {p.condition}</Typography>);
        return placements.length > 1 ? <details><summary>{placements.length} placements</summary>{paths}</details> : <>{paths}</>;
      } },
      { id: "area", label: "Area", width: 220, value: row => row.area, filter: true },
      { id: "condition", label: "Display conditions", width: 280, value: row => row.condition },
      { id: "storage", label: "Field / collection key", width: 240, value: row => row.storage },
      { id: "sites", label: "Sites", width: 220, value: row => row.sites.join(", ") || "Global baseline", filter: true, filterValues: row => row.sites.length ? row.sites : ["Global baseline"], render: row => row.sites.length > 3 ? <details><summary>{row.sites.length} Sites</summary>{row.sites.join(", ")}</details> : row.sites.join(", ") || "Global baseline" },
      { id: "rules", label: "Rules / conditions", value: row => rules.filter(r => ruleRelations(r).some(ref => ref.domain === "fields" && ref.key === row.field.id)).map(r => r.id).join(", "), render: row => <>{rules.filter(r => ruleRelations(r).some(ref => ref.domain === "fields" && ref.key === row.field.id)).map(r => <div key={r.id}><LibraryLink domain="rules" filters={{ q: r.id }}>{r.rule}</LibraryLink></div>)}</> },
      { id: "input", label: "Input", value: (row) => row.field.inputType, filter: true, tag: true },
      { id: "component", missingDetails: row => !getFieldStorybookReference(row.field) ? "Design component / Storybook reference has not been supplied." : undefined, label: "Component / Storybook", width: 240, value: (row) => getFieldStorybookReference(row.field)?.label ?? "—", render: ({ field }) => { const story = getFieldStorybookReference(field); return story ? <Link href={getStorybookStoryUrl(story.storyId)} target="_blank" rel="noopener noreferrer">{story.label}</Link> : "—"; } },
      { id: "required", label: "Required", value: (row) => row.field.required ? "Yes" : "No", filter: true, tag: true },
      { id: "included", label: "Enabled", value: (row) => row.included, filter: true, tag: true },
      { id: "status", label: "Resolution", value: (row) => row.status, filter: true, tag: true, render: row => scope === "global" ? "Global definition" : <details><summary><LibraryTag label={row.status} /></summary><div>Global required: {fieldCatalog[row.field.id as keyof typeof fieldCatalog] ? fieldCatalog[row.field.id as keyof typeof fieldCatalog].required ? "Yes" : "No" : "Defined by page / component"}</div><div>Effective required: {row.field.required ? "Yes" : "No"}</div><div>Resolver notes: {row.notes.join("; ") || "None"}</div><div>Explicit Site records:</div><pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(siteFieldOverrides.filter(o => o.fieldId === row.field.id && row.pages.includes(o.pageId) && o.siteIds?.includes(siteId)), null, 2)}</pre>{["inherited", "overridden", "client-specific"].includes(row.status) && <><div><LibraryTag label="Details needed" title="Separate Client-level provenance is unavailable." /></div><div>Client values may be merged with Site configuration by the existing adapter; separate client provenance is unavailable here.</div></>}<div>Effective definition:</div><pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(row.field, null, 2)}</pre></details> },
      { id: "notes", label: "Notes", width: 240, value: (row) => row.notes.join("; ") || "—" },
    ]} />
    <ValidationLibrary level="Field" />
  </Stack>;
}



