import { Box, Stack, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
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

  const helpItems = [
    {
      id: "why-asked",
      label: "Why is this information being asked?",
      title: "Why is this information being asked?",
      content: (
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            We understand these questions can feel personal. Here&apos;s how
            this information is used in your application.
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <CalculateOutlinedIcon
              sx={{
                color: "primary.main",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Determining your coverage options
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your answers help us identify the coverage types and amounts
                available to you. Different products have different eligibility
                requirements, and this information ensures we show you the right
                options.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TuneRoundedIcon
              sx={{
                color: "primary.main",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Calculating your estimated cost
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Health and lifestyle information is used to calculate
                personalized premium estimates. The more accurate your answers,
                the more accurate your quoted rate will be.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <InfoOutlinedIcon
              sx={{
                color: "primary.main",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Your information is protected
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All information you provide is transmitted securely and used
                only for the purpose of evaluating your application. It is never
                sold or shared for marketing purposes.
              </Typography>
            </Box>
          </Box>
        </Stack>
      ),
    },
  ];

  return (
    <FormRoutePage pageId="coverage-questions" helpItems={helpItems}>
      {({ control, errors, watchedValues, allFields, pageSections }) =>
        pageSections.map((section) => {
          if (!isSectionVisible(section, watchedValues)) return null;

          // Skip applicant sections if the applicant has no active categories
          // (but never skip since gender is always asked)
          if (section.applicant) {
            const normalizedApplicant =
              section.applicant === "self" ? "member" : section.applicant;
            // Spouse section requires spouse to have coverage selected
            if (normalizedApplicant === "spouse") {
              const spouseCats = categoriesByApplicant["spouse"] || new Set();
              if (spouseCats.size === 0) return null;
            }
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
            // Gender is always shown
            activeFieldIds.add("spouse-gender");
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
            // Gender is always shown
            activeFieldIds.add("gender");
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
