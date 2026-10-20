import { useLibrarySelection } from "./LibrarySiteSelector";
import { getEffectiveSiteConfig } from "../../../data";
import { Stack, Typography } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";
import { templateStandards } from "../../../content/docs/templateStandards";
import LibraryLink from "./LibraryLink";
export default function TemplateStandardsLibrary() {
  const [selection] = useLibrarySelection();
  const template = selection === "all" ? null : getEffectiveSiteConfig(selection).features?.defaultTemplate ?? "multi";
  const standards = templateStandards.filter(standard => template === null || !standard.templates || standard.templates.includes(template));
  return <Stack spacing={2}><Typography>Shared standards cannot be overridden by a Client. All shows every standard; a Site shows the standards for its configured template. Partial means documented intent with incomplete implementation verification.</Typography><BrowseTable label="Template Standards" rows={standards} rowKey={r => r.id} columns={[
    { id: "displayId", label: "ID", value: r => r.id },
    { id: "area", label: "Area", value: r => r.area, filter: true },
    { id: "requirement", label: "Requirement", value: r => r.requirement, width: 280 },
    { id: "classification", missingDetails: r => r.missingDetails?.classification, label: "Classification", value: r => r.classification, filter: true, tag: true },
    { id: "legacy", missingDetails: r => r.missingDetails?.legacy, label: "Legacy Behavior", value: r => r.legacy, width: 280 },
    { id: "behavior", missingDetails: r => r.missingDetails?.behavior, label: "New Template Behavior", value: r => r.behavior, width: 320 },
    { id: "related", label: "Related Entities", value: r => r.related.map(ref => `${ref.domain}: ${ref.key}`).join(", "), render: r => <>{r.related.map(ref => <div key={`${ref.domain}:${ref.key}`}><LibraryLink domain={ref.domain} filters={ref.domain === "flows" ? { flow: ref.key } : ref.domain === "fields" && ref.key === "membership" ? { pages: ref.key } : { q: ref.key }}>{ref.key || ref.domain}</LibraryLink></div>)}</> },
    { id: "status", missingDetails: r => r.missingDetails?.status, label: "Implementation Status", value: r => r.status, filter: true, tag: true },
    { id: "source", missingDetails: r => r.missingDetails?.source, label: "Source / Documentation", value: r => r.source, width: 320 },
    { id: "providedBy", label: "Authority", value: () => "Curated template documentation" },
  ]} /></Stack>;
}
