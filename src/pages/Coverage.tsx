import { useEffect, useMemo } from "react";
import CoverageCatalog from "../components/coverage/CoverageCatalog";
import FormRoutePage from "../components/form/FormRoutePage";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { useApplicationForm } from "../state/ApplicationFormContext";
import type { CoverageApplicantId } from "../config/coverages/types";

export default function Coverage() {
  const pageId = "coverage";
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const { values, setPageValues } = useApplicationForm();

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

  function validate() {
    if (selectedCoverageIds.length === 0) {
      return "Please select at least one coverage to continue.";
    }
    return undefined;
  }

  return (
    <FormRoutePage pageId={pageId} validate={validate}>
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
    </FormRoutePage>
  );
}
