import { Box, Stack, Typography } from "@mui/material";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import type { CoverageApplicantId } from "../../config/coverages/types";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import { getDisplayedPremium } from "../../app/useCoverageState";
import RateFrequencyToggle from "./RateFrequencyToggle";
import TotalCostSummary, { type TotalCostSummaryItem } from "./TotalCostSummary";

type TotalCostCartProps = {
  categoryProducts: Array<{ id: string; name: string }>;
  selectedCoverageIds: string[];
  productApplicants: Record<string, CoverageApplicantId[]>;
  calculatingRateKeys: Set<string>;
  frequencyCalculating: boolean;
  selectionCalculating: boolean;
  rateFrequency: EstimatedRateFrequency;
  showRateFrequencyToggle: boolean;
  grandTotal: number;
  onFrequencyToggle: (freq: EstimatedRateFrequency) => void;
  calcCoveragePremium: (coverageId: string) => number;
  isCoverageCalculating: (coverageId: string) => boolean;
};

export default function TotalCostCart({
  categoryProducts,
  selectedCoverageIds,
  calculatingRateKeys,
  frequencyCalculating,
  selectionCalculating,
  rateFrequency,
  showRateFrequencyToggle,
  grandTotal,
  onFrequencyToggle,
  calcCoveragePremium,
  isCoverageCalculating,
}: TotalCostCartProps) {
  const isAnyCalculating = calculatingRateKeys.size > 0 || frequencyCalculating || selectionCalculating;
  const displayedTotal = getDisplayedPremium(grandTotal, rateFrequency);
  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";

  const items: TotalCostSummaryItem[] = categoryProducts
    .filter((c) => selectedCoverageIds.includes(c.id))
    .map((coverage) => {
      const coverageTotal = calcCoveragePremium(coverage.id);
      const isCalculating = isCoverageCalculating(coverage.id);
      if (coverageTotal <= 0 && !isCalculating) return null;
      return {
        id: coverage.id,
        name: coverage.name,
        amount: getDisplayedPremium(coverageTotal, rateFrequency),
        isCalculating,
        suffix: rateSuffix,
      };
    })
    .filter(Boolean) as TotalCostSummaryItem[];

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <ShoppingCartOutlinedIcon sx={{ color: "primary.main" }} />
        <Typography variant="subtitle1" fontWeight="bold">Your requested coverage</Typography>
      </Stack>

      {grandTotal <= 0 ? (
        <Box
          sx={{
            display: "flex", alignItems: "center", justifyContent: "center",
            textAlign: "center", px: 4, py: 4, borderRadius: 2,
            bgcolor: "background.subtle", border: "1px dashed", borderColor: "divider",
          }}
        >
          <Stack spacing={1} alignItems="center">
            <PrivacyTipIcon sx={{ fontSize: 24, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary">No coverage selected yet.</Typography>
          </Stack>
        </Box>
      ) : (
        <>
          <TotalCostSummary
            items={items}
            total={displayedTotal}
            totalSuffix={rateSuffix}
            isCalculating={isAnyCalculating}
            disclaimer={<><sup>1</sup> Quoted cost is the best rate available. Final cost may vary based on gender, health status, and tobacco/nicotine use.</>}
          />

          {showRateFrequencyToggle && (
            <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="end">
              <Typography variant="caption" fontWeight="bold"
                color={rateFrequency === "monthly" ? "primary.main" : "text.secondary"}>
                Monthly
              </Typography>
              <RateFrequencyToggle
                checked={rateFrequency === "annual"}
                onChange={(e) => onFrequencyToggle(e.target.checked ? "annual" : "monthly")}
                slotProps={{ input: { "aria-label": "Toggle estimated cost between monthly and annual" } }}
              />
              <Typography variant="caption" fontWeight="bold"
                color={rateFrequency === "annual" ? "primary.main" : "text.secondary"}>
                Annual
              </Typography>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
