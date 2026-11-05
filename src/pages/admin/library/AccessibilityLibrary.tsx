import { Alert, Button, Link, Paper, Stack, Typography } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";
import { accessibilityCriteria } from "../../../content/docs/accessibility";
import { accessibilityConcerns } from "../../../content/docs/accessibilityConcerns";

export default function AccessibilityLibrary({ siteKey }: { siteKey: string }) {
  return <Stack spacing={2.5}>
    <Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={1.5}>
      <Typography variant="h6">Accessibility tracking setup pending</Typography>
      <Typography>Siteimprove will be used for accessibility tracking. This screen is under maintenance while tracking is set up. No scan results are available here yet.</Typography>
      <Typography variant="body2" color="text.secondary">Assessment is pending for {siteKey === 'all' ? 'all prototype sites' : siteKey}. The target is WCAG 2.2 AA. Admin Center is outside this assessment scope.</Typography>
    </Stack></Paper>
    <Stack direction="row" gap={1} flexWrap="wrap">
      <Button component="a" href="https://developer.chrome.com/docs/lighthouse/overview" target="_blank" rel="noopener noreferrer" variant="outlined">Lighthouse in Chrome DevTools</Button>
      <Button component="a" href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noopener noreferrer">WCAG 2.2 AA reference</Button>
    </Stack>
    <Typography variant="body2">Open the prototype page in Chrome, open DevTools, choose Lighthouse, select Accessibility and analyze the page. Repeat for the pages and states you want to inspect.</Typography>
    <Alert severity="info">A Lighthouse score covers automated checks. Keyboard, screen reader and complete journey checks are still needed; a score alone does not establish AA conformance.</Alert>
    <Typography component="h3" variant="subtitle1" fontWeight={800}>Current prototype areas of concern</Typography>
    <Typography variant="body2" color="text.secondary">Code concerns identify behavior to investigate. Items marked Needs review have no recorded assessment yet; neither status is a confirmed WCAG failure.</Typography>
    <BrowseTable label="Accessibility concerns" rows={accessibilityConcerns} rowKey={row => row.area} acceptUrlFilters={false} hiddenColumns={['displayId']} columns={[
      { id: 'area', label: 'Area', width: 230, value: row => row.area },
      { id: 'concern', label: 'Concern', width: 420, value: row => row.concern },
      { id: 'criteria', label: 'WCAG criteria', width: 180, value: row => row.criteria.join(', '), render: row => <Stack>{row.criteria.map(id => <Link key={id} href={accessibilityCriteria.find(criterion => criterion.id === id)!.reference} target="_blank" rel="noopener noreferrer">{id}</Link>)}</Stack> },
      { id: 'status', label: 'Status', width: 240, value: row => row.status, filter: true },
      { id: 'evidence', label: 'Evidence / basis', width: 320, value: row => row.evidence },
      { id: 'check', label: 'Next check', width: 400, value: row => row.check },
    ]} />
  </Stack>;
}
