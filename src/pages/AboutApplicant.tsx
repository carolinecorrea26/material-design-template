import { useMemo, useState } from "react";
import { Alert, Box, Button, Divider, Typography } from "@mui/material";
import FormRoutePage, {
  isSectionVisible,
} from "../components/form/FormRoutePage";
import FieldRenderer from "../components/form/FieldRenderer";
import ApplicantSection from "../components/form/ApplicantSection";
import {
  isApplicantApplying,
  shouldShowApplicantLabel,
} from "../components/form/applicantVisibility";
import { SECTION_SURFACE_BG } from "../components/form/sectionStyles";
import SubQuestionContainer from "../components/form/SubQuestionContainer";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { getPageSections } from "../config/pageSections";
import AddList from "../components/form/AddList";
import type { FieldDefinition } from "../config/fields/types";

// ----- Personal page field sets -----
const selfHeightFieldIds = new Set(["height-feet", "height-inches"]);
const selfDriversLicenseFollowupFieldIds = new Set([
  "drivers-license-number",
  "drivers-license-state",
]);
const selfOutsideUsFollowupFieldIds = new Set([
  "outside-us-months",
  "outside-us-country",
]);
const selfTravelOutsideUsFollowupFieldIds = new Set([
  "travel-outside-us-country",
]);
const qdRequiredUwFlags = new Set(["FUW", "QD"]);
const qdOnlyFieldIds = new Set([
  "weight-12-months-ago-lbs",
  "has-drivers-license",
  "travel-outside-us-six-months",
  "drivers-license-number",
  "drivers-license-state",
  "travel-outside-us-country",
  "spouse-weight-12-months-ago-lbs",
  "spouse-has-drivers-license",
  "spouse-travel-outside-us-six-months",
  "spouse-drivers-license-number",
  "spouse-drivers-license-state",
  "spouse-travel-outside-us-country",
]);
const physicianFieldIds = new Set([
  "physician-first-name",
  "physician-last-name",
  "physician-phone",
  "medical-facility-name",
  "medical-facility-street-address",
  "medical-facility-apt-suite",
  "medical-city",
  "medical-state",
  "medical-zip-code",
]);
const physicianNameRow = new Set([
  "physician-first-name",
  "physician-last-name",
]);
const physicianStreetRow = new Set([
  "medical-facility-street-address",
  "medical-facility-apt-suite",
]);
const physicianCityStateZipRow = new Set([
  "medical-city",
  "medical-state",
  "medical-zip-code",
]);

// ----- Financial page helpers -----
const otherCoverageInfoNote =
  "Please indicate if you currently hold an active insurance policy with any carrier, including through your employer. Other insurance you have today can impact the amount of coverage you may be approved for.";

const disabilityCompanyFields: FieldDefinition[] = [
  {
    id: "di-company-name",
    label: "Company",
    inputType: "text",
    labelVariant: "floating",
    required: true,
  },
  {
    id: "di-company-monthly-benefit",
    label: "Monthly Benefit Amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
    required: true,
    helperText:
      "You can find your current coverage amount in your recent statement from your carrier.",
  },
  {
    id: "di-company-benefit-period",
    label: "Benefit Period",
    inputType: "text",
    placeholder: "Age 65 or older, 1-5 year, etc.",
    labelVariant: "floating",
    required: true,
  },
  {
    id: "di-company-waiting-period",
    label: "Waiting Period",
    inputType: "text",
    placeholder: "30 days, 60 days, etc",
    labelVariant: "floating",
    required: true,
  },
];

const disabilityCompanyMapping = {
  fields: disabilityCompanyFields,
  fieldToKey: {
    "di-company-name": "company",
    "di-company-monthly-benefit": "monthlyBenefitAmount",
    "di-company-benefit-period": "benefitPeriod",
    "di-company-waiting-period": "waitingPeriod",
  } as const,
};

function getStoredCoverageAmounts(values: Record<string, unknown>) {
  if (
    values.coverageAmounts != null &&
    typeof values.coverageAmounts === "object" &&
    !Array.isArray(values.coverageAmounts)
  ) {
    return values.coverageAmounts as Record<string, number>;
  }
  return {};
}

function toNumericAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeApplicantId(rawApplicantId: string) {
  if (rawApplicantId === "self") return "member";
  return rawApplicantId;
}

type PersonalSectionGroups = {
  selfPrimary: string[];
  selfConditional: string[];
  selfPhysician: string[];
  spouse: string[];
  spouseConditional: string[];
  spousePhysician: string[];
};

export default function AboutApplicant() {
  const [showPhysician, setShowPhysician] = useState(false);
  useState(false); // spouse physician toggle (for future use)
  const coverages = useMemo(() => getActiveClientCoverages(), []);

  return (
    <FormRoutePage pageId="about-applicant">
      {({ control, errors, watchedValues }) => {
        // ----- Personal section logic -----
        const personalFields = getClientPageFields("personal", watchedValues);
        const personalSections = getPageSections("personal");

        const selectedCoverageIds = Array.isArray(
          watchedValues["coverageSelections"],
        )
          ? watchedValues["coverageSelections"]
          : [];
        const selectedCoverageIdSet = new Set(selectedCoverageIds);
        const hasQdUwProduct = coverages.some(
          (coverage) =>
            selectedCoverageIdSet.has(coverage.id) &&
            qdRequiredUwFlags.has(coverage.underwritingType),
        );

        const visiblePersonalSections = personalSections.filter((section) =>
          isSectionVisible(section, watchedValues),
        );

        const sectionGroups =
          visiblePersonalSections.reduce<PersonalSectionGroups>(
            (acc, section) => {
              if (section.id === "personalSelf") {
                acc.selfPrimary.push(...section.fieldIds);
              } else if (section.id === "personalSelfPhysician") {
                acc.selfPhysician.push(...section.fieldIds);
              } else if (section.applicant === "self") {
                acc.selfConditional.push(...section.fieldIds);
              } else if (section.id === "personalSpousePhysician") {
                acc.spousePhysician.push(...section.fieldIds);
              } else if (section.id === "personalSpouse") {
                acc.spouse.push(...section.fieldIds);
              } else if (section.applicant === "spouse") {
                acc.spouseConditional.push(...section.fieldIds);
              }
              return acc;
            },
            {
              selfPrimary: [],
              selfConditional: [],
              selfPhysician: [],
              spouse: [],
              spouseConditional: [],
              spousePhysician: [],
            },
          );

        const selfPrimaryFieldIds = sectionGroups.selfPrimary.filter(
          (id) =>
            !physicianFieldIds.has(id) &&
            (hasQdUwProduct || !qdOnlyFieldIds.has(id)),
        );
        const selfConditionalFieldIds = sectionGroups.selfConditional.filter(
          (id) => hasQdUwProduct || !qdOnlyFieldIds.has(id),
        );
        const spouseFieldIds = sectionGroups.spouse.filter(
          (id) => hasQdUwProduct || !qdOnlyFieldIds.has(id),
        );
        const spouseConditionalFieldIds =
          sectionGroups.spouseConditional.filter(
            (id) => hasQdUwProduct || !qdOnlyFieldIds.has(id),
          );

        const hasSelf = isApplicantApplying("self", watchedValues);

        // ----- Financial section logic -----
        const financialFields = getClientPageFields("financial", watchedValues);
        const financialSections = getPageSections("financial");
        const visibleFinancialSections = financialSections.filter((section) =>
          isSectionVisible(section, watchedValues),
        );
        void visibleFinancialSections; // used for future expansion

        const storedAmounts = getStoredCoverageAmounts(watchedValues);
        const selectedCoverages = coverages.filter((coverage) =>
          selectedCoverageIds.includes(coverage.id),
        );

        const coverageIdSet = new Set(coverages.map((c) => c.id));
        const selectedCoveragesById = new Map(
          selectedCoverages.map((c) => [c.id, c]),
        );

        function parseCoverageAmountKey(key: string) {
          const [firstPart, secondPart] = key.split(":").map((p) => p.trim());
          if (!firstPart || !secondPart) return null;
          if (coverageIdSet.has(firstPart)) {
            return {
              coverageId: firstPart,
              applicant: normalizeApplicantId(secondPart),
            };
          }
          if (coverageIdSet.has(secondPart)) {
            return {
              coverageId: secondPart,
              applicant: normalizeApplicantId(firstPart),
            };
          }
          return null;
        }

        function hasCoverage(
          applicantId: "member" | "spouse",
          categoryId: "LI" | "DI",
          minimumAmount = 0,
        ) {
          return Object.entries(storedAmounts).some(([key, rawAmount]) => {
            const parsedKey = parseCoverageAmountKey(key);
            if (!parsedKey) return false;
            if (parsedKey.applicant !== applicantId) return false;
            if (
              selectedCoverageIdSet.size > 0 &&
              !selectedCoverageIdSet.has(parsedKey.coverageId)
            )
              return false;
            const coverage = selectedCoveragesById.get(parsedKey.coverageId);
            if (!coverage || coverage.categoryId !== categoryId) return false;
            return toNumericAmount(rawAmount) > minimumAmount;
          });
        }

        const selfHasLife = hasCoverage("member", "LI");
        const selfHasDisability = hasCoverage("member", "DI");
        const spouseHasLife = hasCoverage("spouse", "LI");
        const spouseHasDisability = hasCoverage("spouse", "DI");
        const showSelfFinancialProfile = hasCoverage("member", "DI", 3000);
        void showSelfFinancialProfile; // used for future expansion

        // Combined allFields from both pages
        const combinedFields = [...personalFields, ...financialFields].filter(
          (field, index, arr) =>
            arr.findIndex((f) => f.id === field.id) === index,
        );

        function renderFieldById(fieldId: string) {
          const field = combinedFields.find((f) => f.id === fieldId);
          if (!field) return null;
          return (
            <FieldRenderer
              key={field.id}
              field={field}
              control={control}
              errors={errors}
            />
          );
        }

        function renderDisabilityCompanySummary(item: Record<string, string>) {
          return (
            <>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.company || "Company"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`${item.monthlyBenefitAmount || "$0"} | ${item.benefitPeriod || "Benefit period not provided"} | ${item.waitingPeriod || "Waiting period not provided"}`}
              </Typography>
            </>
          );
        }

        function renderOtherCoverageContent(applicant: "self" | "spouse") {
          const isSelf = applicant === "self";
          const hasLife = isSelf ? selfHasLife : spouseHasLife;
          const hasDi = isSelf ? selfHasDisability : spouseHasDisability;

          const hasOtherLifeInsuranceFieldId = isSelf
            ? "has-other-life-insurance"
            : "spouse-has-other-life-insurance";
          const existingLifeAmountFieldId = isSelf
            ? "existing-life-insurance-amount"
            : "spouse-existing-life-insurance-amount";
          const replacingLifeFieldId = isSelf
            ? "is-replacing-life-insurance"
            : "spouse-is-replacing-life-insurance";
          const pendingLifeAppsFieldId = isSelf
            ? "has-pending-life-insurance-applications"
            : "spouse-has-pending-life-insurance-applications";
          const pendingLifeAmountFieldId = isSelf
            ? "pending-life-insurance-amount"
            : "spouse-pending-life-insurance-amount";
          const pendingLifeCompanyFieldId = isSelf
            ? "pending-life-insurance-company"
            : "spouse-pending-life-insurance-company";
          const hasDiFieldId = isSelf
            ? "has-disability-insurance"
            : "spouse-has-disability-insurance";
          const replacingDiFieldId = isSelf
            ? "is-replacing-disability-insurance"
            : "spouse-is-replacing-disability-insurance";
          const replacingDiAmountFieldId = isSelf
            ? "disability-replacement-amount"
            : "spouse-disability-replacement-amount";
          const disabilityCompanyListName = isSelf
            ? "selfDisabilityCompanies"
            : "spouseDisabilityCompanies";

          return (
            <>
              <Alert severity="info" icon={false} sx={{ mb: 1.5 }}>
                {otherCoverageInfoNote}
              </Alert>

              {hasLife && (
                <>
                  {renderFieldById(hasOtherLifeInsuranceFieldId)}
                  {watchedValues[hasOtherLifeInsuranceFieldId] === "yes" && (
                    <SubQuestionContainer>
                      {renderFieldById(existingLifeAmountFieldId)}
                      {renderFieldById(replacingLifeFieldId)}
                    </SubQuestionContainer>
                  )}
                  {renderFieldById(pendingLifeAppsFieldId)}
                  {watchedValues[pendingLifeAppsFieldId] === "yes" && (
                    <SubQuestionContainer>
                      {renderFieldById(pendingLifeAmountFieldId)}
                      {renderFieldById(pendingLifeCompanyFieldId)}
                    </SubQuestionContainer>
                  )}
                </>
              )}

              {hasDi && (
                <Box sx={{ mt: hasLife ? 2 : 0 }}>
                  {renderFieldById(hasDiFieldId)}
                  {watchedValues[hasDiFieldId] === "yes" && (
                    <SubQuestionContainer>
                      <Box sx={{ mt: 1, mb: 2 }}>
                        <AddList
                          control={control}
                          name={disabilityCompanyListName}
                          label="Company"
                          mapping={disabilityCompanyMapping}
                          renderItem={renderDisabilityCompanySummary}
                        />
                      </Box>
                      {renderFieldById(replacingDiFieldId)}
                      {watchedValues[replacingDiFieldId] === "yes" &&
                        renderFieldById(replacingDiAmountFieldId)}
                    </SubQuestionContainer>
                  )}
                </Box>
              )}
            </>
          );
        }

        const showFinancial =
          selfHasLife ||
          selfHasDisability ||
          spouseHasLife ||
          spouseHasDisability;

        return (
          <>
            {/* ===== Personal Information Section ===== */}
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, mb: 1, display: "block" }}
            >
              Personal information
            </Typography>

            {hasSelf && (
              <ApplicantSection
                applicant="self"
                showLabel={shouldShowApplicantLabel("self", watchedValues)}
              >
                <Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                    }}
                  >
                    {selfPrimaryFieldIds
                      .filter((fieldId) => selfHeightFieldIds.has(fieldId))
                      .map((fieldId) => {
                        const field = personalFields.find(
                          (f) => f.id === fieldId,
                        );
                        if (!field) return null;
                        return (
                          <FieldRenderer
                            key={field.id}
                            field={field}
                            control={control}
                            errors={errors}
                            margin="none"
                          />
                        );
                      })}
                  </Box>
                </Box>

                {selfPrimaryFieldIds
                  .filter((fieldId) => !selfHeightFieldIds.has(fieldId))
                  .map((fieldId) => {
                    const field = personalFields.find((f) => f.id === fieldId);
                    if (!field) return null;
                    return (
                      <Box key={field.id}>
                        <FieldRenderer
                          field={field}
                          control={control}
                          errors={errors}
                        />
                        {fieldId === "has-drivers-license" &&
                          selfConditionalFieldIds.filter((id) =>
                            selfDriversLicenseFollowupFieldIds.has(id),
                          ).length > 0 &&
                          watchedValues[fieldId] === "yes" && (
                            <SubQuestionContainer>
                              {selfConditionalFieldIds
                                .filter((id) =>
                                  selfDriversLicenseFollowupFieldIds.has(id),
                                )
                                .map((conditionalFieldId) => {
                                  const f = personalFields.find(
                                    (fl) => fl.id === conditionalFieldId,
                                  );
                                  if (!f) return null;
                                  return (
                                    <Box key={f.id} sx={{ mb: 2 }}>
                                      <FieldRenderer
                                        field={f}
                                        control={control}
                                        errors={errors}
                                      />
                                    </Box>
                                  );
                                })}
                            </SubQuestionContainer>
                          )}
                        {fieldId === "intend-live-outside-us" &&
                          selfConditionalFieldIds.filter((id) =>
                            selfOutsideUsFollowupFieldIds.has(id),
                          ).length > 0 &&
                          watchedValues[fieldId] === "yes" && (
                            <SubQuestionContainer>
                              {selfConditionalFieldIds
                                .filter((id) =>
                                  selfOutsideUsFollowupFieldIds.has(id),
                                )
                                .map((conditionalFieldId) => {
                                  const f = personalFields.find(
                                    (fl) => fl.id === conditionalFieldId,
                                  );
                                  if (!f) return null;
                                  return (
                                    <Box key={f.id} sx={{ mb: 2 }}>
                                      <FieldRenderer
                                        field={f}
                                        control={control}
                                        errors={errors}
                                      />
                                    </Box>
                                  );
                                })}
                            </SubQuestionContainer>
                          )}
                        {fieldId === "travel-outside-us-six-months" &&
                          selfConditionalFieldIds.filter((id) =>
                            selfTravelOutsideUsFollowupFieldIds.has(id),
                          ).length > 0 &&
                          watchedValues[fieldId] === "yes" && (
                            <SubQuestionContainer>
                              {selfConditionalFieldIds
                                .filter((id) =>
                                  selfTravelOutsideUsFollowupFieldIds.has(id),
                                )
                                .map((conditionalFieldId) => {
                                  const f = personalFields.find(
                                    (fl) => fl.id === conditionalFieldId,
                                  );
                                  if (!f) return null;
                                  return (
                                    <Box key={f.id} sx={{ mb: 2 }}>
                                      <FieldRenderer
                                        field={f}
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

                {selfConditionalFieldIds.map((fieldId) => {
                  if (
                    selfDriversLicenseFollowupFieldIds.has(fieldId) ||
                    selfOutsideUsFollowupFieldIds.has(fieldId) ||
                    selfTravelOutsideUsFollowupFieldIds.has(fieldId)
                  )
                    return null;
                  const field = personalFields.find((f) => f.id === fieldId);
                  if (!field) return null;
                  return (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      control={control}
                      errors={errors}
                    />
                  );
                })}

                {showPhysician && (
                  <Box
                    sx={{
                      backgroundColor: SECTION_SURFACE_BG,
                      borderRadius: 1.5,
                      px: { xs: 2, sm: 2.5 },
                      py: 1.5,
                      mt: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: { xs: 0, sm: 2 },
                      }}
                    >
                      {sectionGroups.selfPhysician
                        .filter((fieldId) => physicianNameRow.has(fieldId))
                        .map((fieldId) => {
                          const field = personalFields.find(
                            (f) => f.id === fieldId,
                          );
                          if (!field) return null;
                          return (
                            <FieldRenderer
                              key={field.id}
                              field={field}
                              control={control}
                              errors={errors}
                            />
                          );
                        })}
                    </Box>
                    {sectionGroups.selfPhysician
                      .filter((fieldId) => fieldId === "physician-phone")
                      .map((fieldId) => {
                        const field = personalFields.find(
                          (f) => f.id === fieldId,
                        );
                        if (!field) return null;
                        return (
                          <FieldRenderer
                            key={field.id}
                            field={field}
                            control={control}
                            errors={errors}
                          />
                        );
                      })}
                    {sectionGroups.selfPhysician
                      .filter((fieldId) => fieldId === "medical-facility-name")
                      .map((fieldId) => {
                        const field = personalFields.find(
                          (f) => f.id === fieldId,
                        );
                        if (!field) return null;
                        return (
                          <FieldRenderer
                            key={field.id}
                            field={field}
                            control={control}
                            errors={errors}
                          />
                        );
                      })}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: { xs: 0, sm: 2 },
                      }}
                    >
                      {sectionGroups.selfPhysician
                        .filter((fieldId) => physicianStreetRow.has(fieldId))
                        .map((fieldId) => {
                          const field = personalFields.find(
                            (f) => f.id === fieldId,
                          );
                          if (!field) return null;
                          return (
                            <FieldRenderer
                              key={field.id}
                              field={field}
                              control={control}
                              errors={errors}
                            />
                          );
                        })}
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                        gap: { xs: 0, sm: 2 },
                      }}
                    >
                      {sectionGroups.selfPhysician
                        .filter((fieldId) =>
                          physicianCityStateZipRow.has(fieldId),
                        )
                        .map((fieldId) => {
                          const field = personalFields.find(
                            (f) => f.id === fieldId,
                          );
                          if (!field) return null;
                          return (
                            <FieldRenderer
                              key={field.id}
                              field={field}
                              control={control}
                              errors={errors}
                            />
                          );
                        })}
                    </Box>
                  </Box>
                )}

                {!showPhysician && sectionGroups.selfPhysician.length > 0 && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowPhysician(true)}
                    sx={{
                      alignSelf: "flex-start",
                      mt: 1,
                      textTransform: "none",
                    }}
                  >
                    + Add physician information (optional)
                  </Button>
                )}
              </ApplicantSection>
            )}

            {/* Spouse personal section */}
            {spouseFieldIds.length > 0 && (
              <ApplicantSection
                applicant="spouse"
                showLabel={shouldShowApplicantLabel("spouse", watchedValues)}
              >
                {spouseFieldIds.map((fieldId) => {
                  const field = personalFields.find((f) => f.id === fieldId);
                  if (!field) return null;
                  return (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      control={control}
                      errors={errors}
                    />
                  );
                })}
                {spouseConditionalFieldIds.map((fieldId) => {
                  const field = personalFields.find((f) => f.id === fieldId);
                  if (!field) return null;
                  return (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      control={control}
                      errors={errors}
                    />
                  );
                })}
              </ApplicantSection>
            )}

            {/* ===== Financial Information Section ===== */}
            {showFinancial && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 700, mb: 1, display: "block" }}
                >
                  Financial information
                </Typography>

                {(selfHasLife || selfHasDisability) && (
                  <ApplicantSection
                    applicant="self"
                    showLabel={shouldShowApplicantLabel("self", watchedValues)}
                  >
                    {renderOtherCoverageContent("self")}
                  </ApplicantSection>
                )}

                {(spouseHasLife || spouseHasDisability) && (
                  <ApplicantSection
                    applicant="spouse"
                    showLabel={shouldShowApplicantLabel(
                      "spouse",
                      watchedValues,
                    )}
                  >
                    {renderOtherCoverageContent("spouse")}
                  </ApplicantSection>
                )}
              </>
            )}
          </>
        );
      }}
    </FormRoutePage>
  );
}
