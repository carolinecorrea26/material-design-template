import { Alert, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Section, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import LibrarySiteSelector, { useLibrarySelection } from "./library/LibrarySiteSelector";
import { accessibilityReviews } from "../../content/docs/accessibility";

export default function AccessibilityWorkspace() {
  const [selection, setSelection] = useLibrarySelection();
  return <Workspace>
    <WorkspaceHeader title="Accessibility" description="Siteimprove monitoring and WCAG 2.2 AA review for prototype sites." actions={<Button component={RouterLink} to={`/admin-center/library/accessibility?${new URLSearchParams({ site: selection })}`} variant="outlined">View requirements</Button>} />
    <LibrarySiteSelector siteId={selection} onChange={setSelection} />
    <Alert severity="info">Assessment scope: {selection === "all" ? "all prototype sites" : selection}. Include applicant pages, conditional states, both templates and responsive layouts. Exclude Admin Center routes from Siteimprove scans.</Alert>
    <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
      {[{ label: "AA readiness", value: "Not assessed", detail: "WCAG 2.2 · Levels A and AA" }, { label: "Siteimprove scan", value: "Awaiting connection", detail: "No scan results received" }, { label: "Manual review", value: "Pending", detail: "Keyboard, screen reader and complete journey checks" }].map(card => <Paper key={card.label} variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="overline" color="text.secondary">{card.label}</Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, my: 1 }}>{card.value}</Typography>
        <Typography variant="body2" color="text.secondary">{card.detail}</Typography>
      </Paper>)}
    </Stack>
    <Section title="Siteimprove findings" description="Scan coverage, affected pages, severity, WCAG criterion, owner and retest status will be reported here.">
      <Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={1.5}>
        <Chip label="Siteimprove · not connected" variant="outlined" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="subtitle1" fontWeight={800}>No assessment data available</Typography>
        <Typography variant="body2" color="text.secondary">Connect Siteimprove to the hosted prototype URLs and map each scan to its site and template. Last scan, pages scanned, open findings and trends remain unavailable until results are connected. Authenticated and conditional application states also need explicit test coverage.</Typography>
      </Stack></Paper>
    </Section>
    <Section title="Manual review & AA sign-off" description="Automated scans are one input. Record evidence for all applicable criteria and full application processes.">
      <Stack spacing={1.5}>{accessibilityReviews.map(review => <Paper key={review.area} variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Typography variant="subtitle2" fontWeight={800}>{review.area}</Typography><Chip label="Pending" size="small" variant="outlined" /></Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{review.check}</Typography>
      </Paper>)}</Stack>
    </Section>
    <Alert severity="warning">AA sign-off requires resolved and retested failures, completed manual checks, documented exceptions for criteria that do not apply, and dated evidence identifying site URLs, template, browser, assistive technology and reviewer. A Siteimprove score alone is not a conformance claim.</Alert>
  </Workspace>;
}
