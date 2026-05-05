import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { coverageCategories } from "../../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageDefinition,
} from "../../config/coverages/types";
import SelectableOptionCard from "../form/SelectableOptionCard";
import FormSectionTitle from "../form/FormSectionTitle";
import DependentChipSelector from "../form/DependentChipSelector";
import { applicantLabels } from "../../config/formSectionTitle";

type CoverageCatalogProps = {
  coverages: CoverageDefinition[];
  selectedCoverageIds: string[];
  onChangeSelectedCoverageIds: (nextIds: string[]) => void;
  selectedDependents?: string[];
  productApplicants?: Record<string, CoverageApplicantId[]>;
  onChangeProductApplicants?: (
    nextApplicants: Record<string, CoverageApplicantId[]>,
  ) => void;
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

export default function CoverageCatalog({
  coverages,
  selectedCoverageIds,
  onChangeSelectedCoverageIds,
  selectedDependents = [],
  productApplicants = {},
  onChangeProductApplicants,
}: CoverageCatalogProps) {
  const hasDependents = selectedDependents.length > 0;

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
  const groupedCategories = coverageCategories
    .map((category) => ({
      category,
      items: coverages.filter(
        (coverage) => coverage.categoryId === category.id,
      ),
    }))
    .filter((group) => group.items.length > 0);

  function toggleCoverage(coverageId: string) {
    const nextIds = selectedCoverageIds.includes(coverageId)
      ? selectedCoverageIds.filter((id) => id !== coverageId)
      : [...selectedCoverageIds, coverageId];

    onChangeSelectedCoverageIds(nextIds);
  }

  return (
    <Stack spacing={2}>
      {groupedCategories.map(({ category, items }, groupIndex) => (
        <Accordion
          key={category.id}
          defaultExpanded={groupIndex === 0}
          disableGutters
          sx={{
            backgroundColor: "transparent",
            border: "none",
            boxShadow: "none",
            p: 0,
            borderRadius: 0,
            "&::before": { display: "none" },
            "&.MuiAccordion-root": {
              backgroundColor: "transparent",
              border: "none",
              boxShadow: "none",
              m: 0,
              p: 0,
            },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 0 }}>
            <FormSectionTitle icon={category.icon} label={category.label} />
          </AccordionSummary>

          <AccordionDetails sx={{ p: 0 }}>
            <Stack spacing={1.5}>
              {items.map((coverage) => {
                const checked = selectedCoverageIds.includes(coverage.id);
                const visibleApplicants = getVisibleApplicants(
                  coverage.applicants,
                );
                const minAmount = formatCoverageAmount(coverage.minAmount);
                const maxAmount = formatCoverageAmount(coverage.maxAmount);
                const coverageText =
                  minAmount && maxAmount ? `${minAmount} - ${maxAmount}` : null;

                return (
                  <SelectableOptionCard
                    key={coverage.id}
                    onClick={
                      hasDependents
                        ? undefined
                        : () => toggleCoverage(coverage.id)
                    }
                  >
                    {!hasDependents && (
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleCoverage(coverage.id)}
                        onClick={(event) => event.stopPropagation()}
                        inputProps={{
                          "aria-label": `${coverage.name} selection`,
                        }}
                        sx={{
                          mt: 0.25,
                          color: "text.primary",
                          "&.Mui-checked": {
                            color: "primary.main",
                          },
                        }}
                      />
                    )}

                    <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {coverage.name}
                        </Typography>

                        {coverage.featured ? (
                          <Chip
                            icon={<AutoAwesomeIcon />}
                            label="Featured"
                            size="small"
                            color="primary"
                            sx={{
                              "& .MuiChip-label": {
                                fontSize: "0.675rem",
                                fontWeight: 600,
                              },
                              "& .MuiChip-icon": {
                                fontSize: "0.875rem",
                              },
                            }}
                          />
                        ) : null}
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        {coverage.description ?? coverage.definition}
                      </Typography>

                      {!hasDependents && (
                        <Stack sx={{ mt: 0.5, width: "100%" }}>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            Available coverage:{" "}
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ color: "primary.main", fontWeight: 700 }}
                            >
                              {coverageText ?? "-"}
                            </Typography>
                          </Typography>
                        </Stack>
                      )}

                      {hasDependents && (
                        <Stack
                          sx={{
                            mt: 0.5,
                            width: "100%",
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems="flex-start"
                            sx={{ columnGap: 2, rowGap: 1 }}
                          >
                            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#353b48",
                                  fontWeight: 600,
                                  mb: 0.25,
                                }}
                              >
                                Available coverage:
                              </Typography>
                              {visibleApplicants.length > 0 ? (
                                visibleApplicants.map((applicant) => (
                                  <Typography
                                    key={applicant}
                                    variant="caption"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    {applicantLabels[applicant]}:{" "}
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      sx={{
                                        color: "primary.main",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {coverageText ?? "-"}
                                    </Typography>
                                  </Typography>
                                ))
                              ) : (
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  -
                                </Typography>
                              )}
                            </Stack>

                            <Stack sx={{ alignItems: "flex-start" }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#353b48",
                                  fontWeight: 600,
                                  mb: 0.25,
                                }}
                              >
                                Select coverage for:
                              </Typography>
                              <DependentChipSelector
                                applicantIds={visibleApplicants}
                                selectedApplicants={
                                  productApplicants[coverage.id] ?? []
                                }
                                onChange={(nextApplicants) => {
                                  const currentlySelected =
                                    selectedCoverageIds.includes(coverage.id);
                                  const shouldSelectCoverage =
                                    nextApplicants.length > 0;

                                  if (
                                    shouldSelectCoverage &&
                                    !currentlySelected
                                  ) {
                                    onChangeSelectedCoverageIds([
                                      ...selectedCoverageIds,
                                      coverage.id,
                                    ]);
                                  } else if (
                                    !shouldSelectCoverage &&
                                    currentlySelected
                                  ) {
                                    onChangeSelectedCoverageIds(
                                      selectedCoverageIds.filter(
                                        (id) => id !== coverage.id,
                                      ),
                                    );
                                  }

                                  if (onChangeProductApplicants) {
                                    onChangeProductApplicants({
                                      ...productApplicants,
                                      [coverage.id]: nextApplicants,
                                    });
                                  }
                                }}
                              />
                            </Stack>
                          </Stack>
                        </Stack>
                      )}
                    </Stack>
                  </SelectableOptionCard>
                );
              })}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}
