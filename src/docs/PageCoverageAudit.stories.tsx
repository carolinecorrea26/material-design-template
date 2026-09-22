import type { Meta } from "@storybook/react-vite";
import { Chip, Stack, Typography } from "@mui/material";
import {
  DocsPage,
  DocsSection,
  DocsTable,
  TableCell,
  TableRow,
} from "./shared/DocsBlocks";
import {
  pageCoverageRows,
  type PageCoverageDisposition,
} from "./pageCoverageData";

const meta = {
  title: "Application Patterns/Page Coverage Audit",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

function DispositionChip({
  disposition,
}: {
  disposition: PageCoverageDisposition;
}) {
  const color = disposition === "Covered" ? "success" : "warning";
  return (
    <Chip
      label={disposition}
      size="small"
      color={color}
      variant="outlined"
      sx={{ height: "auto", "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 } }}
    />
  );
}

export const AllRoutes = () => (
  <DocsPage
    eyebrow="Phase 6"
    title="Page-by-page Storybook coverage audit"
    intro="Every route in app/router.tsx is accounted for. Reusable visual, interactive, responsive, and stateful patterns point to their real component stories; behavior that only makes sense as route orchestration is recorded explicitly as page-specific rather than represented by a misleading mock component."
    maxWidth={1600}
  >
    <DocsSection title="Audit result">
      <Stack spacing={1}>
        <Typography variant="body2">
          <strong>30 routed pages:</strong> 22 applicant/advisor routes and 8
          internal documentation/admin routes. The shared FormRoutePage
          template is used by 17 pages and now has its own live pattern story.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Phase 7 consolidated every repeated inline pattern identified by
          this audit. Internal documentation routes remain explicitly outside
          the applicant component catalog; their source pages are their
          executable reference.
        </Typography>
      </Stack>
    </DocsSection>

    <DocsSection
      title="Route matrix"
      description="Story titles are listed without links because Storybook's generated story IDs are the searchable source of truth."
    >
      <DocsTable
        columns={[
          "Page / route",
          "Composition",
          "Reusable story coverage",
          "Explicitly page-specific",
          "Disposition",
        ]}
      >
        {pageCoverageRows.map((row) => (
          <TableRow key={row.route}>
            <TableCell sx={{ minWidth: 180, verticalAlign: "top" }}>
              <Typography variant="body2" fontWeight={700}>
                {row.page}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <code>{row.route}</code>
              </Typography>
            </TableCell>
            <TableCell sx={{ minWidth: 170, verticalAlign: "top" }}>
              {row.composition}
            </TableCell>
            <TableCell sx={{ minWidth: 300, verticalAlign: "top" }}>
              {row.storyCoverage}
            </TableCell>
            <TableCell sx={{ minWidth: 300, verticalAlign: "top" }}>
              {row.pageSpecific}
            </TableCell>
            <TableCell sx={{ minWidth: 190, verticalAlign: "top" }}>
              <DispositionChip disposition={row.disposition} />
            </TableCell>
          </TableRow>
        ))}
      </DocsTable>
    </DocsSection>

    <DocsSection title="Phase 7 completion">
      <Typography variant="body2" color="text.secondary">
        The eight known repeated patterns are now canonical components/hooks:
        RateFrequencyControl; useCountdown with
        ExpiringCodeAlert/ResendCountdownRow; ProcessingStatusPage; FieldGrid;
        IconListItem; YesNoDetailList; DetailsTable; and RadioSelectionGroup.
        The resume pages now use the shared page composition, and Profile's
        height grid collapses correctly on mobile.
      </Typography>
    </DocsSection>
  </DocsPage>
);
