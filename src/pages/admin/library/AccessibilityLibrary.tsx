import { Alert, Button, Chip, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import BrowseTable from "../../../components/docs/BrowseTable";
import { accessibilityCriteria, accessibilityReviews } from "../../../content/docs/accessibility";
import { Accessibility } from "../../../docs/guidelines/Accessibility";

export default function AccessibilityLibrary({ siteKey }: { siteKey: string }) {
  return <Stack spacing={2.5}>
    <Alert severity="info">WCAG 2.2 Level AA is the acceptance target for prototype sites, including all Level A and AA criteria. This scope covers applicant journeys, both templates, site branding, content and responsive states. Admin Center is outside this assessment scope.</Alert>
    <Stack direction="row" gap={1} flexWrap="wrap">
      <Chip label="WCAG 2.2 AA" color="primary" variant="outlined" />
      <Chip label={`${accessibilityCriteria.length} A / AA criteria`} variant="outlined" />
      <Button component={RouterLink} to={`/admin-center/accessibility?${new URLSearchParams({ site: siteKey })}`} variant="outlined">Siteimprove reporting</Button>
      <Button component="a" href="#accessibility-implementation-guidance">Implementation guidance</Button>
    </Stack>
    <Typography variant="body2" color="text.secondary">These shared requirements apply to {siteKey === "all" ? "every prototype site" : siteKey}. Assessment is pending; implementation guidance and automated scores alone do not establish conformance. Siteimprove findings, manual evidence and retesting are required before AA sign-off.</Typography>
    <BrowseTable label="Accessibility requirements" tableName="accessibility" rows={accessibilityCriteria} rowKey={row => row.id} columns={[
      { id: "id", label: "Criterion", value: row => row.id, width: 110, render: row => <Link href={row.reference} target="_blank" rel="noopener noreferrer">{row.id}</Link> },
      { id: "name", label: "Requirement", value: row => row.name, width: 310 },
      { id: "level", label: "Level", value: row => row.level, filter: true, width: 100 },
      { id: "principle", label: "Principle", value: row => row.principle, filter: true, width: 160 },
    ]} />
    <Typography component="h3" variant="subtitle1" fontWeight={800}>Manual review plan</Typography>
    <BrowseTable label="Accessibility reviews" rows={accessibilityReviews} rowKey={row => row.area} acceptUrlFilters={false} columns={[
      { id: "area", label: "Review area", value: row => row.area, width: 220 },
      { id: "criteria", label: "Related criteria", value: row => row.criteria, width: 230 },
      { id: "check", label: "Acceptance checks", value: row => row.check, width: 480 },
    ]} />
    <details id="accessibility-implementation-guidance"><summary>Accessibility implementation guidance</summary><Accessibility /></details>
  </Stack>;
}
