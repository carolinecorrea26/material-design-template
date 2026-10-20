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
    title="Recorded page composition and component coverage"
    intro="The recorded composition matrix links page concerns to reusable component examples. Current page availability, fields and routing are specified in the Pages, Fields and Flows sections of Portal Library."
    maxWidth={1600}
  >
    <DocsSection title="Audit result">
      <Stack spacing={1}>
        <Typography variant="body2">
          <strong>{pageCoverageRows.length} recorded page compositions.</strong> These
          describe component coverage and do not establish that every configured
          site or journey has been verified.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Shared component extraction is recorded in the component source and examples. Internal documentation routes remain explicitly outside
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
