import { useState } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { CoverageApplicantId } from "../../config/coverages/types";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import { getDisplayedPremium } from "../../app/useCoverageState";
import RateFrequencyToggle from "./RateFrequencyToggle";
import TotalCostSummary, {
  type TotalCostSummaryItem,
} from "./TotalCostSummary";
import ConfirmationDialog from "../layout/ConfirmationDialog";

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
  onEditCoverage?: () => void;
  onDeleteCoverage?: (coverageId: string) => void;
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
  onEditCoverage,
  onDeleteCoverage,
}: TotalCostCartProps) {
  const isAnyCalculating =
    calculatingRateKeys.size > 0 ||
    frequencyCalculating ||
    selectionCalculating;
  const displayedTotal = getDisplayedPremium(grandTotal, rateFrequency);
  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteTargetName =
    deleteTargetId != null
      ? (categoryProducts.find((c) => c.id === deleteTargetId)?.name ?? "")
      : "";

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
        <Typography variant="subtitle1" fontWeight="bold">
          Your requested coverage
        </Typography>
      </Stack>

      {grandTotal <= 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 4,
            py: 4,
            borderRadius: 2,
            bgcolor: "background.subtle",
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Stack spacing={1} alignItems="center">
            <PrivacyTipIcon sx={{ fontSize: 24, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary">
              No coverage selected yet.
            </Typography>
          </Stack>
        </Box>
      ) : (
        <>
          {/* Per-item action buttons */}
          {(onEditCoverage || onDeleteCoverage) && (
            <Stack spacing={0.5}>
              {items.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ flex: 1 }}
                  >
                    {item.name}
                  </Typography>
                  <Stack direction="row" spacing={0.25}>
                    {onEditCoverage && (
                      <IconButton
                        size="small"
                        aria-label={`Edit ${item.name}`}
                        onClick={() => setEditDialogOpen(true)}
                        sx={{ color: "primary.main" }}
                      >
                        <EditOutlinedIcon sx={{ fontSize: "1.1rem" }} />
                      </IconButton>
                    )}
                    {onDeleteCoverage && (
                      <IconButton
                        size="small"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => setDeleteTargetId(item.id)}
                        sx={{
                          color: "text.secondary",
                          "&:hover": { color: "error.main" },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: "1.1rem" }} />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}

          <TotalCostSummary
            items={items}
            total={displayedTotal}
            totalSuffix={rateSuffix}
            isCalculating={isAnyCalculating}
            disclaimer={
              <>
                <sup>1</sup> Quoted cost is the best rate available. Final cost
                may vary based on gender, health status, and tobacco/nicotine
                use.
              </>
            }
          />

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
                onChange={(e) =>
                  onFrequencyToggle(e.target.checked ? "annual" : "monthly")
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
                  rateFrequency === "annual" ? "primary.main" : "text.secondary"
                }
              >
                Annual
              </Typography>
            </Stack>
          )}
        </>
      )}

      {/* Edit confirmation dialog */}
      {onEditCoverage && (
        <ConfirmationDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          title="Edit coverage"
          message="To edit your coverage, you will be sent back to the coverage page. Do you want to go to the coverage page to make edits?"
          confirmLabel="Yes"
          cancelLabel="Cancel"
          onConfirm={() => {
            setEditDialogOpen(false);
            onEditCoverage();
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      {onDeleteCoverage && (
        <ConfirmationDialog
          open={deleteTargetId !== null}
          onClose={() => setDeleteTargetId(null)}
          title="Remove coverage"
          message={`Are you sure you want to remove ${deleteTargetName} from your selections?`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          confirmColor="error"
          onConfirm={() => {
            if (deleteTargetId) {
              onDeleteCoverage(deleteTargetId);
            }
            setDeleteTargetId(null);
          }}
        />
      )}
    </Stack>
  );
}
