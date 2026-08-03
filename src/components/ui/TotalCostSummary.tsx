import type { ReactNode } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { CARD_RADIUS } from "../../app/theme";
import { formatUSD } from "../../utils/formatUSD";

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
}: TotalCostPanelProps) {
  return (
    <Box
      sx={(theme) => ({
        p: 2,
        borderRadius: CARD_RADIUS,
        backgroundColor: "background.subtle",
        border: `2px solid ${theme.palette.primary.main}`,
      })}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle2" fontWeight={700}>
          Total Estimated Cost<sup>1</sup>
        </Typography>

        {items.map((item) => (
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
            {item.isCalculating ? (
              <CircularProgress
                size={14}
                thickness={4}
                sx={{ color: "primary.main" }}
              />
            ) : (
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ whiteSpace: "nowrap" }}
              >
                {formatUSD(item.amount)}
                {item.suffix ?? totalSuffix}
              </Typography>
            )}
          </Stack>
        ))}

        <Divider />

        <Stack
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
              sx={{ color: "success.main" }}
            />
          ) : (
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 900,
                color: "success.main",
                whiteSpace: "nowrap",
              }}
            >
              {formatUSD(total)}
              {totalSuffix}
            </Typography>
          )}
        </Stack>

        {disclaimer && (
          <Typography variant="caption" color="text.secondary">
            {disclaimer}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
