import { useMemo, useState } from "react";
import { Box, Link, MenuItem, Stack, TextField, Typography } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";
import LibraryTag from "../../../components/docs/LibraryTag";
import { analyticsLibraryRows } from "./analyticsLibraryRows";
import { getStorybookStoryUrl } from "../../../config/storybook";
import { getSiteDetailsPageLabel } from "../../../config/resolvers/resolveClientPages";
import type { PageId } from "../../../types";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import LibraryLink from "./LibraryLink";


const reviewAreas = [
  ["Pages and journey steps", "Page / section views, continuation, validation failure, back navigation, edit-step actions, and conditional or skipped steps. Check both single-page and multi-page templates."],
  ["Fields and selections", "Every configured field, including conditional and repeated-list fields, radio groups, checkboxes, selects, date pickers, consent controls, sliders, and rate toggles. Review focus / blur and validation events where useful."],
  ["Buttons, links and navigation", "Primary and secondary actions, icon buttons, logos, menus, tabs, support contacts, external links, anchor links, and disabled actions. Separate an action attempt from its successful outcome."],
  ["Drawers and modals", "Opening, closing, confirmation, cancellation, and nested overlays. Review close buttons, Escape, backdrop clicks, and browser navigation as dismissal paths; preserve the opening context."],
  ["Tools and content", "Quote and needs calculators, coverage cards, cart / portfolio, result panels, help content, notices, and document previews. Review impressions, expansion, meaningful scroll milestones, and download completion."],
  ["Application and service outcomes", "Start, save, resume, verification, payment authorization, signing, submission, and receipt. Define success, failure, retry, and abandonment separately; agree the measurement window for abandonment."],
  ["Consent and delivery verification", "Review consent requirements, vendor mappings, and duplicate prevention across navigation, rerenders, and templates. Verify delivery for each approved event; exclude applicant values, health answers, credentials, and document contents."],
];

export default function AnalyticsLibrary({ siteKey }: { siteKey: string }) {
  const [individualPlacements, setIndividualPlacements] = useState(false);
  const catalog = useLibraryCatalog();
  const rows = useMemo(() => analyticsLibraryRows(catalog, siteKey, individualPlacements), [catalog, siteKey, individualPlacements]);
  const tags = rows.flatMap(row => row.placements);
  const pageLabel = (page: string) => page === "app-shell" ? "Site navigation" : getSiteDetailsPageLabel(page as PageId);
  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">Actual site elements, using saved field and page definitions plus source-reviewed buttons, links, help chips, and overlays. Where it appears identifies the page section, menu area, or drawer containing the element. Tracking specifications are shown separately in the details.</Typography>
    <Stack direction="row" flexWrap="wrap" gap={1} aria-label="Tracking inventory summary">
      <LibraryTag label={`${tags.length} tracking contexts`} />
      <LibraryTag label={`${tags.filter(tag => tag.status === "proposed").length} tagging pending`} />
      <LibraryTag label={`${tags.filter(tag => tag.status === "local-hook").length} local hooks`} />
    </Stack>
    <BrowseTable key={`${siteKey}:${individualPlacements}`} hiddenColumns={["displayId", ...(siteKey === "all" ? [] : ["sites"])]} label="Analytics" tableName="analytics"
      filterControls={<TextField select size="small" label="Placements" value={individualPlacements ? "individual" : "grouped"} onChange={event => setIndividualPlacements(event.target.value === "individual")}><MenuItem value="grouped">Grouped</MenuItem><MenuItem value="individual">Individual</MenuItem></TextField>}
      rows={rows} rowKey={row => JSON.stringify([row.id, row.label, row.appearances])} columns={[
        { id: "element", label: "Element", width: 240, value: row => `${row.label} ${row.placements.map(tag => tag.elementKey).join(" ")}`, render: row => <><Typography variant="body2" fontWeight={700}>{row.label}</Typography><Typography variant="caption" display="block" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{row.kind === "page" ? row.pageId : row.placements.length === 1 ? row.elementKey : `${row.placements.length} tracking contexts`}</Typography></> },
        { id: "kind", label: "Element type", width: 130, value: row => row.kind, filter: true, tag: true },
        { id: "component", label: "Component / Storybook", width: 220, value: row => row.components.map(component => component.label).join("; ") || (row.kind === "page" ? "Not applicable" : "Not documented"), missingDetails: row => row.kind !== "page" && !row.components.length ? "The stored specification has no matching field control or source component in the Storybook catalog." : undefined, render: row => row.components.length ? <Stack spacing={0.5}>{row.components.map(component => <Link key={component.storyId} href={getStorybookStoryUrl(component.storyId)} target="_blank" rel="noopener noreferrer">{component.label}</Link>)}</Stack> : row.kind === "page" ? "Not applicable — page event" : "Not documented" },
        { id: "appearance", label: "Where it appears", width: 280, value: row => row.appearances.join("; ") || "Placement not recorded", filter: true, filterValues: row => row.appearances.length ? row.appearances : ["Placement not recorded"], missingDetails: row => row.placementMissing ? "One or more tracking contexts have no matching placement in the selected stored catalog." : undefined, render: row => {
          const surfaces = row.appearances.map(surface => <Typography variant="body2" key={surface}>{surface}</Typography>);
          return surfaces.length ? <>{surfaces}</> : "Placement not recorded";
        } },
        { id: "events", label: "Event types", width: 180, value: row => row.events.join(", "), filter: true, filterValues: row => row.events, render: row => <Stack direction="row" flexWrap="wrap" gap={0.5}>{row.events.map(event => <LibraryTag key={event} label={event} />)}</Stack> },
        { id: "status", label: "Tagging status", width: 200, value: row => row.status === "local-hook" ? "Local hook; vendor unverified" : "Proposed; not instrumented", filter: true, tag: true },
        { id: "description", label: "Description", width: 340, value: row => row.description },
        { id: "trigger", label: "Trigger", width: 260, value: row => row.trigger },
        { id: "adobe", label: "Adobe mapping", width: 220, value: row => row.adobe.mapping ?? "Not configured" },
        { id: "contentsquare", label: "Contentsquare mapping", width: 220, value: row => row.contentsquare.mapping ?? "Not configured" },
        { id: "condition", label: "When shown", width: 280, value: row => [...new Set(row.placements.map(tag => tag.condition))].join("\n") },
        { id: "pages", label: "Page context", width: 200, value: row => row.placements.map(tag => tag.pageId).join("\n"), render: row => <>{[...new Set(row.placements.map(tag => tag.pageId))].map(page => <div key={page}>{page === "app-shell" ? pageLabel(page) : <LibraryLink domain="pages" filters={{ q: page }}>{pageLabel(page)}</LibraryLink>}</div>)}</> },
        { id: "source", label: "Source", width: 300, value: row => [...new Set(row.placements.map(tag => tag.sourceFile))].join("\n") },
        { id: "properties", label: "Permitted properties", width: 260, value: row => row.permittedProperties.join(", ") },
        { id: "sites", label: "Sites", width: 180, value: row => row.sites.join(", "), filter: true, filterValues: row => row.sites, render: row => row.sites.join(", ") },
      ]} />
    <Box component="details" sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
      <Typography component="summary" fontWeight={700} sx={{ cursor: "pointer" }}>Coverage review checklist — additional tracking to consider</Typography>
      <Typography variant="body2" sx={{ my: 1.5 }}>These areas are review prompts, separate from the stored tagging specifications above.</Typography>
      <Stack spacing={1.5}>{reviewAreas.map(([label, description]) => <Box key={label}><Typography variant="body2" fontWeight={700}>{label}</Typography><Typography variant="body2" color="text.secondary">{description}</Typography></Box>)}</Stack>
    </Box>
  </Stack>;
}
