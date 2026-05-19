import { useEffect, useMemo, useState } from "react";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import { Box, Divider, Stack, Tab, Tabs, Typography } from "@mui/material";
import CoverageCatalog from "../components/coverage/CoverageCatalog";
import FormRoutePage from "../components/form/FormRoutePage";
import FormHelpDrawer from "../components/form/FormHelpDrawer";
import QuickDecisionDrawerContent from "../components/common/QuickDecisionDrawerContent";
import { QuickDecisionMark } from "../components/common/QuickDecisionDrawerContent";
import QuickDecisionIndicator from "../components/common/QuickDecisionIndicator";
import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type { CoverageCategoryId } from "../config/coverages/types";
import { useApplicationForm } from "../state/ApplicationFormContext";
import type { CoverageApplicantId } from "../config/coverages/types";

const CATEGORY_DESCRIPTIONS: Record<CoverageCategoryId, string> = {
  LI: "Life coverage can help provide financial protection for the people who depend on you.",
  AD: "Accidental death and dismemberment coverage can help protect against covered accidental loss or injury.",
  DI: "Disability coverage can help replace income if a covered disability affects your ability to work.",
  OO: "Office overhead coverage can help keep eligible business expenses paid during a covered disability.",
  SH: "Supplemental health coverage can help with out-of-pocket costs tied to covered health events.",
};

function getApplicantLabel(applicant: CoverageApplicantId): string {
  if (applicant === "member") return "Member";
  if (applicant === "spouse") return "Spouse";
  return "Child";
}

export function CoverageOptionsDrawerContent() {
  const coverages = getActiveClientCoverages();
  const coverageGroups = coverageCategories
    .map((category) => ({
      category,
      products: coverages.filter((c) => c.categoryId === category.id),
    }))
    .filter((group) => group.products.length > 0);

  const [activeCategory, setActiveCategory] = useState<CoverageCategoryId>(
    coverageGroups[0]?.category.id ?? "LI",
  );

  const activeGroup = coverageGroups.find(
    (g) => g.category.id === activeCategory,
  );

  if (coverageGroups.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No coverage categories are currently available.
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review the coverage categories available and the products offered within
        each category.
      </Typography>

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          divider={<Divider flexItem orientation="vertical" />}
        >
          <Box
            sx={{
              width: 56,
              flexShrink: 0,
              backgroundColor: "#fbfcff",
            }}
          >
            <Tabs
              value={activeCategory}
              onChange={(_, value: CoverageCategoryId) =>
                setActiveCategory(value)
              }
              orientation="vertical"
              variant="standard"
              sx={{
                py: 1,
                minHeight: "100%",
                "& .MuiTabs-indicator": {
                  backgroundColor: "primary.main",
                },
                "& .MuiTab-root": {
                  alignItems: "center",
                  justifyContent: "center",
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 52,
                  minWidth: 56,
                  px: 0,
                },
              }}
            >
              {coverageGroups.map(({ category }) => {
                const IconComponent = category.icon;
                return (
                  <Tab
                    key={category.id}
                    value={category.id}
                    icon={<IconComponent sx={{ fontSize: "1.25rem" }} />}
                    aria-label={category.label}
                  />
                );
              })}
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, p: 2, bgcolor: "#fff" }}>
            {activeGroup ? (
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {activeGroup.category.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {CATEGORY_DESCRIPTIONS[activeGroup.category.id]}
                  </Typography>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  {activeGroup.products.map((product) => (
                    <Box key={product.id}>
                      <Stack spacing={0.25}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: "primary.main" }}
                        >
                          {product.name}
                          {product.underwritingType === "QD" && (
                            <QuickDecisionIndicator />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.description ?? product.definition}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Available for:{" "}
                          {product.applicants.map(getApplicantLabel).join(", ")}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            ) : null}
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

export default function Coverage() {
  const pageId = "coverage";
  const client = getActiveClient();
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const { values, setPageValues } = useApplicationForm();
  const [qdDrawerOpen, setQdDrawerOpen] = useState(false);

  const hasQdProduct = coverages.some((c) => c.underwritingType === "QD");

  const selectedDependents = Array.isArray(values.dependents)
    ? values.dependents
    : [];

  const selectedCoverageIds = Array.isArray(values.coverageSelections)
    ? values.coverageSelections
    : [];

  const productApplicants = useMemo<
    Record<string, CoverageApplicantId[]>
  >(() => {
    if (
      values.productApplicants != null &&
      typeof values.productApplicants === "object" &&
      !Array.isArray(values.productApplicants)
    ) {
      return values.productApplicants as Record<string, CoverageApplicantId[]>;
    }
    return {};
  }, [values.productApplicants]);

  // Initialize productApplicants when dependents change or coverage selections change
  useEffect(() => {
    if (!selectedDependents || selectedDependents.length === 0) {
      // Member-only mode: chips are hidden, so clear per-product applicant state.
      if (Object.keys(productApplicants).length > 0) {
        setPageValues({
          productApplicants: {} as Record<string, CoverageApplicantId[]>,
        });
      }
      return;
    }

    const nextProductApplicants: Record<string, CoverageApplicantId[]> = {};
    const allowedDependents = selectedDependents.filter(
      (dependent): dependent is Exclude<CoverageApplicantId, "member"> =>
        dependent === "spouse" || dependent === "child",
    );
    const allowedApplicants: CoverageApplicantId[] = [
      "member",
      ...allowedDependents,
    ];
    let hasChanges = false;

    // Keep only selected products and normalize applicant selections.
    for (const coverageId of selectedCoverageIds) {
      const existingApplicants = Array.isArray(productApplicants[coverageId])
        ? productApplicants[coverageId]
        : null;

      if (!existingApplicants) {
        nextProductApplicants[coverageId] = [];
        hasChanges = true;
        continue;
      }

      const normalizedApplicants: CoverageApplicantId[] = [];
      for (const applicant of existingApplicants) {
        if (
          allowedApplicants.includes(applicant) &&
          !normalizedApplicants.includes(applicant)
        ) {
          normalizedApplicants.push(applicant);
        }
      }

      nextProductApplicants[coverageId] = normalizedApplicants;

      const unchanged =
        existingApplicants.length === normalizedApplicants.length &&
        existingApplicants.every(
          (applicant, index) => applicant === normalizedApplicants[index],
        );

      if (!unchanged) {
        hasChanges = true;
      }
    }

    if (Object.keys(productApplicants).length !== selectedCoverageIds.length) {
      hasChanges = true;
    }

    if (hasChanges) {
      setPageValues({ productApplicants: nextProductApplicants });
    }
  }, [
    selectedDependents,
    selectedCoverageIds,
    productApplicants,
    setPageValues,
  ]);

  useEffect(() => {
    function handleDevFillForm() {
      const allCoverageIds = coverages.map((coverage) => coverage.id);
      if (allCoverageIds.length === 0) return;

      setPageValues({
        coverageSelections: allCoverageIds,
      });
    }

    window.addEventListener("devtools:fillform", handleDevFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleDevFillForm);
  }, [coverages, setPageValues]);

  function validate(nextValues: Record<string, unknown>) {
    const nextSelectedCoverageIds = Array.isArray(nextValues.coverageSelections)
      ? nextValues.coverageSelections
      : [];

    if (nextSelectedCoverageIds.length === 0) {
      return "Please select at least one coverage to continue.";
    }

    return undefined;
  }

  const helpItems = [
    {
      id: "coverage-options-available",
      label: "What coverage options are available?",
      title: "What coverage options are available?",
      content: <CoverageOptionsDrawerContent />,
    },
  ];

  return (
    <FormRoutePage pageId={pageId} validate={validate} helpItems={helpItems}>
      {hasQdProduct && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            p: 2,
            mb: 2,
            borderRadius: 2,
            backgroundColor: "rgba(46, 125, 50, 0.06)",
            border: "1px solid rgba(46, 125, 50, 0.2)",
          }}
        >
          <OfflineBoltIcon color="success" sx={{ mt: 0.25, flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary">
            <Typography
              component="span"
              variant="body2"
              sx={{ fontWeight: 700, color: "success.main" }}
            >
              <QuickDecisionMark />
            </Typography>{" "}
            helps many applicants receive a decision instantly or within a few
            days without a medical exam. This starts with health questions you
            answer online to reduce time needed with phone calls or other follow
            up.{" "}
            <Typography
              component="span"
              role="button"
              tabIndex={0}
              onClick={() => setQdDrawerOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setQdDrawerOpen(true);
                }
              }}
              sx={{
                color: "primary.main",
                textDecoration: "underline",
                textUnderlineOffset: "0.12em",
                cursor: "pointer",
                font: "inherit",
                lineHeight: "inherit",
              }}
            >
              Learn more about this process.
            </Typography>
          </Typography>
        </Box>
      )}
      <CoverageCatalog
        coverages={coverages}
        selectedCoverageIds={selectedCoverageIds}
        selectedDependents={selectedDependents}
        productApplicants={productApplicants}
        onChangeSelectedCoverageIds={(nextIds) =>
          setPageValues({ coverageSelections: nextIds })
        }
        onChangeProductApplicants={(nextApplicants) =>
          setPageValues({ productApplicants: nextApplicants })
        }
        allCategoriesExpanded={client.coverages.allCategoriesExpanded}
      />
      <FormHelpDrawer
        open={qdDrawerOpen}
        title={
          <>
            What is <QuickDecisionMark />?
          </>
        }
        onClose={() => setQdDrawerOpen(false)}
      >
        <QuickDecisionDrawerContent />
      </FormHelpDrawer>
    </FormRoutePage>
  );
}
