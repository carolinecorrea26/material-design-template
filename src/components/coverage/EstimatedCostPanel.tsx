import {
  Box,
  CircularProgress,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import type { CoverageApplicantId } from "../../config/coverages/types";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import { formatUSD } from "../../utils/formatUSD";
import { getDisplayedPremium } from "./useCoverageState";

const RateFrequencySwitch = styled(Switch)(({ theme }) => ({
  width: 48,
  height: 26,
  padding: 5,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(4px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
          "#fff",
        )}" d="M7 2v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2V2h-2v2H9V2H7Zm12 18H5V10h14v10Z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.primary.main,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette.primary.main,
    width: 24,
    height: 24,
    "&::before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        "#fff",
      )}" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V8h14v11Z"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    borderRadius: 13,
    backgroundColor: "#cdd9ec",
  },
}));

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
        <Typography variant="h6">
          Estimated cost<sup>1</sup>
        </Typography>

        {grandTotal <= 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 1,
              borderRadius: 2,
              bgcolor: "#f8fafc",
              border: "1px dashed",
              borderColor: "divider",
              color: "text.secondary",
            }}
          >
            <PrivacyTipIcon sx={{ fontSize: 17, color: "text.disabled" }} />
            <Typography
              variant="body2"
              sx={{ fontSize: "0.8rem", fontWeight: 600 }}
            >
              Added coverage will appear here
            </Typography>
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
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "text.secondary",
                      }}
                    >
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
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          fontSize: 14,
                          whiteSpace: "nowrap",
                        }}
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
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, fontSize: 12 }}
                >
                  Total
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
                    variant="body2"
                    sx={{
                      color: "primary.main",
                      fontWeight: 700,
                      fontSize: 14,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatUSD(displayedGrandTotal)}
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        color: "primary.main",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {rateSuffix}
                    </Typography>
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
                  sx={{
                    color:
                      rateFrequency === "monthly"
                        ? "primary.main"
                        : "text.secondary",
                    fontWeight: 700,
                  }}
                >
                  Monthly
                </Typography>
                <RateFrequencySwitch
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
                  sx={{
                    color:
                      rateFrequency === "annual"
                        ? "primary.main"
                        : "text.secondary",
                    fontWeight: 700,
                  }}
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
