import { useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import { Box, Checkbox, Chip, Stack, Typography } from "@mui/material";
import { coverageCategories } from "../../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageDefinition,
} from "../../config/coverages/types";
import QuickDecisionIndicator from "../common/QuickDecisionIndicator";
import SelectableOptionRow from "../form/SelectableOptionRow";
import type { CoverageCategoryId } from "../../config/coverages/types";

type CoverageCatalogProps = {
  coverages: CoverageDefinition[];
  selectedCoverageIds: string[];
  onChangeSelectedCoverageIds: (nextIds: string[]) => void;
  selectedDependents?: string[];
  productApplicants?: Record<string, CoverageApplicantId[]>;
  onChangeProductApplicants?: (
    nextApplicants: Record<string, CoverageApplicantId[]>,
  ) => void;
  allCategoriesExpanded?: boolean;
};

function formatCoverageAmount(amount?: number) {
  if (amount == null) return null;

  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return `$${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
  }

  if (amount >= 1000) {
    const thousands = amount / 1000;
    return `$${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`;
  }

  return `$${amount}`;
}

const applicantCheckboxLabels: Record<CoverageApplicantId, string> = {
  member: "Select for myself",
  spouse: "Select for my spouse",
  child: "Select for my child",
};

export default function CoverageCatalog({
  coverages,
  selectedCoverageIds,
  onChangeSelectedCoverageIds,
  selectedDependents = [],
  productApplicants = {},
  onChangeProductApplicants,
}: CoverageCatalogProps) {
  // Determine which categories have coverages
  const availableCategories = coverageCategories.filter((category) =>
    coverages.some((coverage) => coverage.categoryId === category.id),
  );

  // All category filters selected by default
  const [selectedFilters, setSelectedFilters] = useState<CoverageCategoryId[]>(
    () => availableCategories.map((c) => c.id),
  );

  function toggleFilter(categoryId: CoverageCategoryId) {
    setSelectedFilters((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  // Determine visible applicants for a product
  function getVisibleApplicants(
    applicants: CoverageApplicantId[],
  ): CoverageApplicantId[] {
    return applicants.filter((a) => {
      if (a === "member") return true;
      if (a === "spouse") return selectedDependents.includes("spouse");
      if (a === "child") return selectedDependents.includes("child");
      return false;
    });
  }

  // Filter coverages based on selected category filters
  const filteredCoverages = coverages.filter((coverage) =>
    selectedFilters.includes(coverage.categoryId),
  );

  function toggleApplicantForProduct(
    coverageId: string,
    applicant: CoverageApplicantId,
  ) {
    const currentApplicants = productApplicants[coverageId] ?? [];
    const nextApplicants = currentApplicants.includes(applicant)
      ? currentApplicants.filter((a) => a !== applicant)
      : [...currentApplicants, applicant];

    // Update coverage selection based on whether any applicants are selected
    const currentlySelected = selectedCoverageIds.includes(coverageId);
    if (nextApplicants.length > 0 && !currentlySelected) {
      onChangeSelectedCoverageIds([...selectedCoverageIds, coverageId]);
    } else if (nextApplicants.length === 0 && currentlySelected) {
      onChangeSelectedCoverageIds(
        selectedCoverageIds.filter((id) => id !== coverageId),
      );
    }

    if (onChangeProductApplicants) {
      onChangeProductApplicants({
        ...productApplicants,
        [coverageId]: nextApplicants,
      });
    }
  }

  return (
    <Stack spacing={2}>
      {/* Category filter chips */}
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="body2" sx={{ fontWeight: 600, mr: 0.5 }}>
          Filter coverage:
        </Typography>
        {availableCategories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedFilters.includes(category.id);

          return (
            <Chip
              key={category.id}
              icon={<Icon sx={{ fontSize: "1rem !important" }} />}
              label={
                "shortLabel" in category ? category.shortLabel : category.label
              }
              size="small"
              variant="outlined"
              onClick={() => toggleFilter(category.id)}
              sx={{
                fontSize: "0.75rem",
                letterSpacing: "-0.2px",
                color: isSelected ? "primary.main" : "text.secondary",
                borderColor: isSelected ? "primary.main" : "grey.400",
                "& .MuiChip-icon": {
                  color: isSelected ? "primary.main" : "text.secondary",
                  marginLeft: "6px",
                },
              }}
            />
          );
        })}
      </Stack>

      {/* Product cards grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        {filteredCoverages.map((coverage) => {
          const visibleApplicants = getVisibleApplicants(coverage.applicants);
          const minAmount = formatCoverageAmount(coverage.minAmount);
          const maxAmount = formatCoverageAmount(coverage.maxAmount);
          const coverageText =
            minAmount && maxAmount ? `${minAmount} - ${maxAmount}` : null;

          return (
            <Box
              key={coverage.id}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
                bgcolor: "background.paper",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {/* Title row */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={1}
              >
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: "14px",
                      letterSpacing: "-0.25px",
                    }}
                  >
                    {coverage.name}
                    {coverage.underwritingType === "QD" && (
                      <QuickDecisionIndicator />
                    )}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "12px" }}
                  >
                    {coverage.description ?? coverage.definition}
                  </Typography>
                </Stack>

                {coverage.featured && (
                  <Chip
                    icon={<AutoAwesomeIcon />}
                    label="Featured"
                    size="small"
                    color="primary"
                    sx={{
                      flexShrink: 0,
                      "& .MuiChip-label": {
                        fontSize: "0.675rem",
                        fontWeight: 700,
                      },
                      "& .MuiChip-icon": {
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                )}
              </Stack>

              {/* Coverage range */}
              <Box
                sx={{
                  fontWeight: 800,
                  p: "16px",
                  borderRadius: "8px",
                  bgcolor: "#f5f8fd",
                  color: "primary.main",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 400,
                    fontSize: "11px",
                    mb: 0.5,
                  }}
                >
                  Available coverage:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "primary.main", fontWeight: 800 }}
                >
                  {coverageText ?? "-"}
                </Typography>
              </Box>

              {/* Applicant checkboxes */}
              <Stack spacing={1} sx={{ mt: 0.5 }}>
                {visibleApplicants.map((applicant) => {
                  const isChecked = (
                    productApplicants[coverage.id] ?? []
                  ).includes(applicant);

                  return (
                    <SelectableOptionRow key={applicant}>
                      <Checkbox
                        checked={isChecked}
                        onChange={() =>
                          toggleApplicantForProduct(coverage.id, applicant)
                        }
                        sx={{
                          p: 0,
                          pointerEvents: "none",
                          color: "text.primary",
                          "&.Mui-checked": {
                            color: "primary.main",
                          },
                        }}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {applicantCheckboxLabels[applicant]}
                      </Typography>
                      {isChecked && (
                        <Chip
                          label="Added"
                          size="small"
                          color="success"
                          // variant="outlined"
                          sx={{
                            height: 22,
                            "& .MuiChip-label": {
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              px: 1,
                            },
                          }}
                        />
                      )}
                    </SelectableOptionRow>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* Empty state when all filters deselected */}
      {filteredCoverages.length === 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            py: 6,
            px: 4,
          }}
        >
          <Stack spacing={1} alignItems="center">
            <FilterListOffIcon sx={{ fontSize: 40, color: "text.disabled" }} />
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              No coverages match the selected filters.
            </Typography>
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              Adjust the filters above to see available coverage options.
            </Typography>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
