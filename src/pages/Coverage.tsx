import { useEffect, useMemo, useState } from "react";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import { Box, Typography } from "@mui/material";
import CoverageCatalog from "../components/coverage/CoverageCatalog";
import FormRoutePage from "../components/form/FormRoutePage";
import FormHelpDrawer from "../components/form/FormHelpDrawer";
import QuickDecisionDrawerContent from "../components/common/QuickDecisionDrawerContent";
import { QuickDecisionMark } from "../components/common/QuickDecisionDrawerContent";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { useApplicationForm } from "../state/ApplicationFormContext";
import type { CoverageApplicantId } from "../config/coverages/types";

export default function Coverage() {
  const pageId = "coverage";
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

  return (
    <FormRoutePage pageId={pageId} validate={validate}>
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
