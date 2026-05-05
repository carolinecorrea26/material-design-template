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

  const selectedDependents = Array.isArray(values.dependents)
    ? values.dependents
    : [];

  const productApplicants =
    values.productApplicants != null &&
    typeof values.productApplicants === "object" &&
    !Array.isArray(values.productApplicants)
      ? (values.productApplicants as Record<string, CoverageApplicantId[]>)
      : {};

  // Compute categories active per applicant
  const categoriesByApplicant: Partial<
    Record<CoverageApplicantId, Set<string>>
  > = {};
  for (const [productId, applicants] of Object.entries(productApplicants)) {
    const product = coverages.find((c) => c.id === productId);
    if (!product) continue;
    const categoryId = product.categoryId;
    for (const applicant of applicants) {
      if (!categoriesByApplicant[applicant]) {
        categoriesByApplicant[applicant] = new Set();
      }
      categoriesByApplicant[applicant]!.add(categoryId);
    }
  }

  // Fallback for when productApplicants is empty (old logic)
  if (Object.keys(productApplicants).length === 0) {
    categoriesByApplicant["member"] = new Set(selectedCategories);
    if (
      Array.isArray(selectedDependents) &&
      selectedDependents.includes("spouse")
    ) {
      categoriesByApplicant["spouse"] = new Set(selectedCategories);
    }
    if (
      Array.isArray(selectedDependents) &&
      selectedDependents.includes("child")
    ) {
      categoriesByApplicant["child"] = new Set(selectedCategories);
    }
  }

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

          // Skip applicant sections if the applicant has no active categories
          if (section.applicant) {
            const normalizedApplicant =
              section.applicant === "self" ? "member" : section.applicant;
            const activeCats =
              categoriesByApplicant[
                normalizedApplicant as CoverageApplicantId
              ] || new Set();
            if (activeCats.size === 0) return null;
          }

          // Compute activeFieldIds based on applicant's active categories
          let activeFieldIds: Set<string>;
          if (section.applicant === "spouse") {
            const activeCats = categoriesByApplicant["spouse"] || new Set();
            activeFieldIds = new Set(
              Array.from(activeCats).flatMap(
                (cat) =>
                  (
                    categoryQuestionFieldsSpouse as Record<
                      string,
                      string[] | undefined
                    >
                  )[cat] ?? [],
              ),
            );
          } else {
            const activeCats = categoriesByApplicant["member"] || new Set();
            activeFieldIds = new Set(
              Array.from(activeCats).flatMap(
                (cat) =>
                  (
                    categoryQuestionFields as Record<
                      string,
                      string[] | undefined
                    >
                  )[cat] ?? [],
              ),
            );
          }

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
                  )}
                >
                  {content}
                </ApplicantSection>
              ) : (
                <>
                  {section.title && (
                    <Typography
                      variant="h6"
                      sx={{ mt: 2, mb: 1, color: "primary.main" }}
                    >
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
