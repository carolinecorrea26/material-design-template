import LibraryTag from "../../../components/docs/LibraryTag";
import { progressSteps } from "../../../config/progressSteps";
import { libraryRepository } from "../../../repositories/libraryRepository";
import { getLibraryPages, ruleRelations, getLibraryRules } from "./libraryInspection";
import LibraryLink from "./LibraryLink";
import { pageSections } from "../../../config/pageSections/pageSections";
import { resolvePageStepLabel } from "../../../config/resolvers/resolveClientPages";
import { getSitePagePrototypeUrl } from "../../../config/sitePrototype";
import { Link, Stack } from "@mui/material";

import { getFieldInventory, selectFieldInventory } from "../../../config/fields/inspectionInventory";
import { resolveSitePages } from "../../../data";
import BrowseTable from "../../../components/docs/BrowseTable";
import { useLibraryScope } from "./LibraryScope";
import { useLibrarySite } from "./LibrarySiteSelector";
import { ValidationLibrary } from "./SiteDetailsLibraryDomains";


export default function PagesLibrary() {
  const [siteId] = useLibrarySite();
  const scope = useLibraryScope();
  const resolutions = resolveSitePages(siteId);
  const rules = getLibraryRules(scope, siteId);
  const relatedRules = (pageId: string) => rules.filter(r => ruleRelations(r).some(ref => ref.domain === "pages" && ref.key === pageId));
  const fields = getFieldInventory(scope, siteId);
  const rows = getLibraryPages(scope, siteId).map((page, index) => {
    const resolution = resolutions.find((entry) => entry.id === page.id);
    return { ...page, sequence: index + 1, fieldCount: selectFieldInventory(fields, "pages", page.id).length, resolution, included: scope === "global" || resolution?.effective.included ? "Yes" : "No", requirement: scope === "global" ? "—" : resolution?.effective.requirement ?? "—", status: scope === "global" ? "global" : resolution?.status ?? "—" };
  });
  return <Stack spacing={3}>
    <BrowseTable hiddenColumns={scope === "global" ? ["included", "requirement"] : []} label="Pages" rows={rows} rowKey={(row) => row.id} columns={[
      { id: "sequence", label: "Sequence", value: row => String(row.sequence) },
      { id: "page", label: "Page", value: (row) => row.id, width: 220, render: row => <Link color="success.main" href={getSitePagePrototypeUrl(scope === "global" ? "demo" : siteId, row.id)} target="_blank" rel="noopener noreferrer">{row.id}</Link> },
      { id: "fields", label: "Fields by page", value: row => row.id, render: row => row.fieldCount ? <LibraryLink domain="fields" filters={{ pages: row.id }}>{row.id}</LibraryLink> : "No field placements" },
      { id: "path", label: "Path", value: (row) => row.path, width: 220 },
      { id: "type", label: "Type", value: (row) => row.type, filter: true, tag: true },
      { id: "included", label: "Enabled", value: (row) => row.included, filter: true, tag: true },
      { id: "requirement", label: "Page requirement", value: (row) => row.requirement, filter: true, tag: true },
      ...(scope === "effective" ? [{ id: "status", label: "Resolution", value: (row: typeof rows[number]) => row.status, filter: true, tag: true, render: (row: typeof rows[number]) => <details><summary><LibraryTag label={row.status} /></summary><pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(row.resolution, null, 2)}</pre></details> }] : []),
      { id: "progress", label: "Progress step", value: row => { const i = progressSteps.findIndex(step => step.pageIds.includes(row.id)); return `${i < 0 ? "" : `${i + 1}. `}${resolvePageStepLabel(row.id)}`; } },
      { id: "sections", label: "Sections (sequence)", value: row => (pageSections[row.id] ?? []).map((s, i) => `${i + 1}. ${s.id}`).join("; "), render: row => <details><summary>{(pageSections[row.id] ?? []).length} sections</summary>{(pageSections[row.id] ?? []).map((s, i) => <div key={s.id}>{i + 1}. {s.id}: {s.fieldIds.join(", ")}</div>)}</details> },
      { id: "rules", label: "Related rules", value: row => relatedRules(row.id).map(r => r.id).join(", "), render: row => relatedRules(row.id).length ? <LibraryLink domain="rules" filters={{ target: row.id }}>View {relatedRules(row.id).length} related rules</LibraryLink> : "No explicit rule relationships" },
      { id: "flows", label: "Related flows", value: row => libraryRepository.read("allFlows").filter(f => f.nodes.some(n => n.pageId === row.id)).map(f => f.id).join(", "), render: row => <>{libraryRepository.read("allFlows").filter(f => f.nodes.some(n => n.pageId === row.id)).map(f => <div key={f.id}><LibraryLink domain="flows" filters={{ flow: f.id }}>{f.title}</LibraryLink></div>)}</> },
    ]} />
    <ValidationLibrary level="Page" />
  </Stack>;
}

