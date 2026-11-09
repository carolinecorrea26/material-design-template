import { requirementText } from "../../domain/requirementContent";
import { combineRateDisplays, rateDisplayForAmount, type RateDisplayState } from '../../domain/rateDisplay';
import { type ReactNode } from "react";
import {
  Box,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import EstimatedRate, { type EstimatedRateProps } from "./EstimatedRate";

export type TotalCostSummaryItem = {
  id: string;
  name: string;
  amount: number;
  isCalculating?: boolean;
  suffix?: string;
  display?: RateDisplayState;
};

type TotalCostPanelProps = {
  items: TotalCostSummaryItem[];
  total: number;
  totalSuffix?: string;
  isCalculating?: boolean;
  disclaimer?: ReactNode;
  title?: string;
  display?: RateDisplayState;
  rateAppearance?: EstimatedRateProps['appearance'];
};

/**
 * Shared "Total Estimated Cost" panel used by EstimatedCostPanel (Coverage page)
 * and CoverageSummary (ECart drawer).
 *
 * Styling: bg #f8fafd, border 2px solid primary, borderRadius 16px.
 * Prices use EstimatedRate’s shared bold, primary-color presentation.
 */
export default function TotalCostSummary({
  items,
  total,
  totalSuffix = "/mo",
  isCalculating = false,
  disclaimer,
  title = "Total Estimated Cost",
  display,
  rateAppearance = 'product',
}: TotalCostPanelProps) {
  if (display?.status === 'hidden') return null;
  const displays = items.map((item): RateDisplayState => {
    const base = item.display ?? rateDisplayForAmount(item.amount);
    return item.isCalculating && base.status === 'available' ? { status: 'loading', previousAmount: base.amount } : base;
  });
  if (displays.length > 0 && displays.every(state => state.status === 'hidden')) return null;
  const referenceOnly = displays.length > 0 && displays.every(state => state.status === 'reference-table');
  const totalDisplay = display ?? (items.some(item => item.display || item.isCalculating) ? combineRateDisplays(displays) : isCalculating ? { status: 'loading' as const, previousAmount: Number.isFinite(total) ? total : undefined } : rateDisplayForAmount(total));
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={(theme) => ({
        p: 2,
        borderRadius: 1,
        backgroundColor: "background.default",
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
            <EstimatedRate appearance={rateAppearance} display={displays[index]} amount={item.amount} suffix={item.suffix ?? totalSuffix} isCalculating={item.isCalculating} />
          </Stack>
        ))}

        {!referenceOnly && <Divider />}

        {!referenceOnly && <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
        >
          <Typography variant="subtitle2" fontWeight={700}>{requirementText("coverage.total-cost-summary.total")}<sup>1</sup>
          </Typography>
          <EstimatedRate appearance={rateAppearance} display={totalDisplay} amount={total} suffix={totalSuffix} isCalculating={isCalculating} />
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
