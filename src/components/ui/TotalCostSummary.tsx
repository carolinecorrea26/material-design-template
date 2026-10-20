import { resolveRatePresentation } from "../../domain/ratePresentation";
import ReferenceRateTableLink from "./ReferenceRateTableLink";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import type { ReactNode } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { CARD_RADIUS } from "../../app/theme";
import EstimatedRate from "./EstimatedRate";

export type TotalCostSummaryItem = {
  id: string;
  name: string;
  amount: number;
  isCalculating?: boolean;
  suffix?: string;
};

type TotalCostPanelProps = {
  items: TotalCostSummaryItem[];
  total: number;
  totalSuffix?: string;
  isCalculating?: boolean;
  disclaimer?: ReactNode;
  title?: string;
};

/**
 * Shared "Total Estimated Cost" panel used by EstimatedCostPanel (Coverage page)
 * and CoverageSummary (ECart drawer).
 *
 * Styling: bg #f8fafd, border 2px solid primary, borderRadius 16px.
 * Total: fontWeight 900, color success.main.
 */
export default function TotalCostSummary({
  items,
  total,
  totalSuffix = "/mo",
  isCalculating = false,
  disclaimer,
  title = "Total Estimated Cost",
}: TotalCostPanelProps) {
  const library = getPrototypeLibrary();
  const references = items.map(item => library ? resolveRatePresentation(library.site, item.id).referenceTable : null);
  const referenceOnly = items.length > 0 && references.every(Boolean);
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={(theme) => ({
        p: 2,
        borderRadius: CARD_RADIUS,
        backgroundColor: "background.subtle",
        border: `2px solid ${theme.palette.primary.main}`,
      })}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle2" fontWeight={700}>
          {title}<sup>1</sup>
        </Typography>

        {items.map((item, index) => (
          <Stack
            key={item.id}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
          >
            <Typography variant="body2" color="text.secondary">
              {item.name}
            </Typography>
            {references[index] ? <ReferenceRateTableLink table={references[index]!} /> : item.isCalculating ? (
              <CircularProgress
                size={14}
                thickness={4}
                aria-label="Recalculating"
                sx={{ color: "primary.main" }}
              />
            ) : (
              <EstimatedRate amount={item.amount} suffix={item.suffix ?? totalSuffix} variant="body2" fontWeight={700} sx={{ color: "text.primary" }} />
            )}
          </Stack>
        ))}

        {!referenceOnly && <Divider />}

        {!referenceOnly && <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Total<sup>1</sup>
          </Typography>
          {isCalculating ? (
            <CircularProgress
              size={16}
              thickness={4}
              aria-label="Recalculating"
              sx={{ color: "success.main" }}
            />
          ) : (
            <EstimatedRate amount={total} suffix={totalSuffix} variant="subtitle1" sx={{ fontWeight: 900, color: "success.main" }} />
          )}
        </Stack>}

        {disclaimer && (
          <Typography variant="caption" color="text.secondary">
            {disclaimer}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
