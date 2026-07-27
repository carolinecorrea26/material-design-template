import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

import type { CoverageApplicantId } from "../../config/coverages/types";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import { formatUSD } from "../../utils/formatUSD";
import { getDisplayedPremium } from "../../app/useCoverageState";

import RateFrequencyToggle from "../common/RateFrequencyToggle";

type EstimatedCostPanelProps = {
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

export default function EstimatedCostPanel({
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
}: EstimatedCostPanelProps) {
  const isAnyRateCalculating =
    calculatingRateKeys.size > 0 ||
    frequencyCalculating ||
    selectionCalculating;

  const displayedGrandTotal = getDisplayedPremium(grandTotal, rateFrequency);
  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";

  return (
    <Box
      sx={{
        p: "16px",
        borderRadius: "8px",
        bgcolor: "#f8fafd",
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCartOutlinedIcon sx={{ color: "primary.main" }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Your requested coverage
          </Typography>
        </Stack>

        {grandTotal <= 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 4,
              py: 4,
              borderRadius: 2,
              bgcolor: "#f8fafc",
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Stack spacing={1} alignItems="center">
              <PrivacyTipIcon sx={{ fontSize: 24, color: "text.disabled" }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No coverage selected yet.
              </Typography>
            </Stack>
          </Box>
        ) : (
          <>
            {categoryProducts
              .filter((c) => selectedCoverageIds.includes(c.id))
              .map((coverage) => {
                const coverageTotal = calcCoveragePremium(coverage.id);
                const isCalculating = isCoverageCalculating(coverage.id);

                if (coverageTotal <= 0 && !isCalculating) return null;

                const displayedTotal = getDisplayedPremium(
                  coverageTotal,
                  rateFrequency,
                );
                const coverageRateSuffix =
                  rateFrequency === "annual" ? "/yr" : "/mo";

                return (
                  <Stack
                    key={coverage.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      {coverage.name}
                    </Typography>
                    {isCalculating ? (
                      <CircularProgress
                        size={16}
                        thickness={4}
                        sx={{ color: "primary.main" }}
                      />
                    ) : (
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {formatUSD(displayedTotal)}
                        {coverageRateSuffix}
                      </Typography>
                    )}
                  </Stack>
                );
              })}

            <Box
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                pt: 1.5,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
              >
                <Typography variant="subtitle2">
                  Total estimated cost<sup>1</sup>
                </Typography>
                {isAnyRateCalculating ? (
                  <CircularProgress
                    size={16}
                    thickness={4}
                    sx={{ color: "primary.main" }}
                  />
                ) : (
                  <Typography
                    component="span"
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{ color: "primary.main", whiteSpace: "nowrap" }}
                  >
                    {formatUSD(displayedGrandTotal)}
                    {rateSuffix}
                  </Typography>
                )}
              </Stack>
            </Box>

            {showRateFrequencyToggle && (
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                justifyContent="end"
              >
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color={
                    rateFrequency === "monthly"
                      ? "primary.main"
                      : "text.secondary"
                  }
                >
                  Monthly
                </Typography>
                <RateFrequencyToggle
                  checked={rateFrequency === "annual"}
                  onChange={(event) =>
                    onFrequencyToggle(
                      event.target.checked ? "annual" : "monthly",
                    )
                  }
                  slotProps={{
                    input: {
                      "aria-label":
                        "Toggle estimated cost between monthly and annual",
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color={
                    rateFrequency === "annual"
                      ? "primary.main"
                      : "text.secondary"
                  }
                >
                  Annual
                </Typography>
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
