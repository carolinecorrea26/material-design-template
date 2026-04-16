import { Box, Typography } from "@mui/material";
import FormRoutePage, {
  isSectionVisible,
} from "../components/form/FormRoutePage";
import FieldRenderer from "../components/form/FieldRenderer";
import ApplicantSection from "../components/form/ApplicantSection";
import { shouldShowApplicantLabel } from "../components/form/applicantVisibility";
import SubQuestionContainer from "../components/form/SubQuestionContainer";
import { useApplicationForm } from "../state/ApplicationFormContext";
import {
  categoryQuestionFields,
  categoryQuestionFieldsSpouse,
  getSelectedCategoryIds,
} from "../config/formFlow";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import type { CoverageApplicantId } from "../config/coverages/types";

export default function CoverageQuestions() {
  const { values } = useApplicationForm();
  const selectedCategories = getSelectedCategoryIds(values);
  const coverages = getActiveClientCoverages();

  const selectedCoverageIds = Array.isArray(values.coverageSelections)
    ? values.coverageSelections
    : [];

  const selectedDependents = Array.isArray(values.dependents)
    ? values.dependents
    : [];

  const productApplicants =
    values.productApplicants != null &&
    typeof values.productApplicants === "object" &&
    !Array.isArray(values.productApplicants)
      ? (values.productApplicants as Record<string, CoverageApplicantId[]>)
      : {};

  // Determine which applicants are "active" for each category
  // An applicant is active if they were selected for at least one product in that category
  function isApplicantActiveForCategory(
    applicant: CoverageApplicantId | "self",
    categoryId: string,
  ): boolean {
    const normalizedApplicant = applicant === "self" ? "member" : applicant;

    // If no productApplicants or empty, fall back to selectedDependents
    if (!productApplicants || Object.keys(productApplicants).length === 0) {
      // Fall back: member always active, else check selectedDependents
      if (normalizedApplicant === "member") return true;
      if (normalizedApplicant === "spouse")
        return (
          Array.isArray(selectedDependents) &&
          selectedDependents.includes("spouse")
        );
      if (normalizedApplicant === "child")
        return (
          Array.isArray(selectedDependents) &&
          selectedDependents.includes("child")
        );
      return false;
    }

    // Check if this applicant was selected for any product in this category
    for (const coverage of coverages) {
      if (
        coverage.categoryId === categoryId &&
        selectedCoverageIds.includes(coverage.id)
      ) {
        const applicantsForProduct = productApplicants[coverage.id] ?? [];
        if (applicantsForProduct.includes(normalizedApplicant)) {
          return true;
        }
      }
    }

    return false;
  }

  const selfFieldIds = new Set(
    selectedCategories.flatMap((cat) => categoryQuestionFields[cat] ?? []),
  );

  const spouseFieldIds = new Set(
    selectedCategories.flatMap(
      (cat) => categoryQuestionFieldsSpouse[cat] ?? [],
    ),
  );

  const tobaccoConditionalFieldIds = new Set([
    "tobacco-last-used",
    "tobacco-products",
  ]);
  const spouseTobaccoConditionalFieldIds = new Set([
    "spouse-tobacco-last-used",
    "spouse-tobacco-products",
  ]);

  return (
    <FormRoutePage pageId="coverage-questions">
      {({ control, errors, watchedValues, allFields, pageSections }) =>
        pageSections.map((section) => {
          if (!isSectionVisible(section, watchedValues)) return null;

          // Skip applicant sections if the applicant is not active for any category
          if (section.applicant) {
            const applicantActive = selectedCategories.some((cat) =>
              isApplicantActiveForCategory(
                section.applicant as CoverageApplicantId | "self",
                cat,
              ),
            );
            if (!applicantActive) return null;
          }

          const activeFieldIds =
            section.applicant === "spouse" ? spouseFieldIds : selfFieldIds;

          const smokerFieldId =
            section.applicant === "spouse" ? "spouse-smoker" : "smoker";
          const isSmokerYes = watchedValues[smokerFieldId] === "yes";

          const conditionalFieldIds =
            section.applicant === "spouse"
              ? spouseTobaccoConditionalFieldIds
              : tobaccoConditionalFieldIds;

          const visibleFieldIds = section.fieldIds.filter(
            (id) =>
              activeFieldIds.has(id) &&
              (!conditionalFieldIds.has(id) || isSmokerYes),
          );

          if (visibleFieldIds.length === 0) return null;

          // Fields to render in the main loop (excluding conditional fields)
          const mainFieldIds = visibleFieldIds.filter(
            (id) => !conditionalFieldIds.has(id) || id === smokerFieldId,
          );

          // Conditional fields to render in the container
          const conditionalFields = visibleFieldIds.filter((id) =>
            conditionalFieldIds.has(id),
          );

          const content = (
            <>
              {mainFieldIds.map((fieldId) => {
                const field = allFields.find((f) => f.id === fieldId);
                if (!field) return null;

                return (
                  <Box key={field.id}>
                    <FieldRenderer
                      field={field}
                      control={control}
                      errors={errors}
                    />

                    {fieldId === smokerFieldId &&
                      isSmokerYes &&
                      conditionalFields.length > 0 && (
                        <SubQuestionContainer>
                          {conditionalFields.map((conditionalFieldId) => {
                            const conditionalField = allFields.find(
                              (f) => f.id === conditionalFieldId,
                            );
                            if (!conditionalField) return null;

                            return (
                              <Box key={conditionalField.id} sx={{ mb: 2 }}>
                                <FieldRenderer
                                  field={conditionalField}
                                  control={control}
                                  errors={errors}
                                />
                              </Box>
                            );
                          })}
                        </SubQuestionContainer>
                      )}
                  </Box>
                );
              })}
            </>
          );

          return (
            <div key={section.id}>
              {section.applicant ? (
                <ApplicantSection
                  applicant={section.applicant}
                  showLabel={shouldShowApplicantLabel(
                    section.applicant,
                    watchedValues,
                    "coverage-questions",
                  )}
                >
                  {content}
                </ApplicantSection>
              ) : (
                <>
                  {section.title && (
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                      {section.title}
                    </Typography>
                  )}
                  {content}
                </>
              )}
            </div>
          );
        })
      }
    </FormRoutePage>
  );
}
