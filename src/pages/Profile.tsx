import { useMemo, useState } from "react";
import { Alert, Box, Button, Divider, Typography } from "@mui/material";
import FormRoutePage, { isSectionVisible } from "../components/page/RoutePage";
import FieldRenderer from "../components/fields/FieldRenderer";
import ApplicantSection from "../components/fields/ApplicantSection";
import { shouldShowApplicantLabel } from "../utils/applicantVisibility";
import { SECTION_SURFACE_BG } from "../app/theme";
import SubQuestionContainer from "../components/fields/ConditionalGroup";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import AddList from "../components/fields/DynamicList";
import type { FieldDefinition } from "../config/fields/types";

// Layout groupings — fields that render side-by-side in grids
const heightFields = new Set(["height-feet", "height-inches"]);
const spouseHeightFields = new Set([
  "spouse-height-feet",
  "spouse-height-inches",
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
const spousePhysicianNameRow = new Set([
  "spouse-physician-first-name",
  "spouse-physician-last-name",
]);
const spousePhysicianStreetRow = new Set([
  "spouse-medical-facility-street-address",
  "spouse-medical-facility-apt-suite",
]);
const spousePhysicianCityStateZipRow = new Set([
  "spouse-medical-city",
  "spouse-medical-state",
  "spouse-medical-zip-code",
]);

// Financial conditional sub-question groups
const lifeInsuranceFollowup = new Set([
  "existing-life-insurance-amount",
  "is-replacing-life-insurance",
]);
const pendingLifeFollowup = new Set([
  "pending-life-insurance-amount",
  "pending-life-insurance-company",
]);
const spouseLifeInsuranceFollowup = new Set([
  "spouse-existing-life-insurance-amount",
  "spouse-is-replacing-life-insurance",
]);
const spousePendingLifeFollowup = new Set([
  "spouse-pending-life-insurance-amount",
  "spouse-pending-life-insurance-company",
]);

// Dynamic list field definitions for disability insurance companies
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

const otherCoverageInfoNote =
  "Please indicate if you currently hold an active insurance policy with any carrier, including through your employer. Other insurance you have today can impact the amount of coverage you may be approved for.";

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

export default function Profile() {
  const [showPhysician, setShowPhysician] = useState(false);
  const coverages = useMemo(() => getActiveClientCoverages(), []);

  return (
    <FormRoutePage pageId="profile">
      {({ control, errors, watchedValues, allFields, pageSections }) => {
        const selectedCoverageIds = Array.isArray(
          watchedValues["coverageSelections"],
        )
          ? watchedValues["coverageSelections"]
          : [];
        const selectedCoverageIdSet = new Set(selectedCoverageIds);

        // Determine which coverage types the member/spouse have
        const storedAmounts = getStoredCoverageAmounts(watchedValues);
        const selectedCoverages = coverages.filter((c) =>
          selectedCoverageIdSet.has(c.id),
        );
        const coverageIdSet = new Set(coverages.map((c) => c.id));
        const selectedCoveragesById = new Map(
          selectedCoverages.map((c) => [c.id, c]),
        );

        function parseCoverageAmountKey(key: string) {
          const [firstPart, secondPart] = key.split(":").map((p) => p.trim());
          if (!firstPart || !secondPart) return null;
          if (coverageIdSet.has(firstPart))
            return {
              coverageId: firstPart,
              applicant: normalizeApplicantId(secondPart),
            };
          if (coverageIdSet.has(secondPart))
            return {
              coverageId: secondPart,
              applicant: normalizeApplicantId(firstPart),
            };
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
        const showFinancial =
          selfHasLife ||
          selfHasDisability ||
          spouseHasLife ||
          spouseHasDisability;

        return (
          <>
            {pageSections.map((section) => {
              if (!isSectionVisible(section, watchedValues)) return null;

              // --- Personal self section ---
              if (section.id === "profilePersonalSelf") {
                return (
                  <div key={section.id}>
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ fontWeight: 700, mb: 1, display: "block" }}
                    >
                      {section.description}
                    </Typography>
                    <ApplicantSection
                      applicant="self"
                      showLabel={shouldShowApplicantLabel(
                        "self",
                        watchedValues,
                      )}
                    >
                      {renderPersonalSelfFields(
                        section.fieldIds,
                        allFields,
                        control,
                        errors,
                        watchedValues,
                      )}
                    </ApplicantSection>
                  </div>
                );
              }

              // --- Personal self conditional sections (rendered as sub-questions) ---
              if (
                section.id === "profilePersonalSelfDriversLicense" ||
                section.id === "profilePersonalSelfOutsideUs" ||
                section.id === "profilePersonalSelfTravelOutsideUs"
              ) {
                return (
                  <SubQuestionContainer key={section.id}>
                    {section.fieldIds.map((fieldId: string) => {
                      const field = allFields.find(
                        (f: any) => f.id === fieldId,
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
                  </SubQuestionContainer>
                );
              }

              // --- Physician section (self) ---
              if (section.id === "profilePersonalSelfPhysician") {
                return (
                  <div key={section.id}>
                    {showPhysician ? (
                      <Box
                        sx={{
                          backgroundColor: SECTION_SURFACE_BG,
                          borderRadius: 1.5,
                          px: { xs: 2, sm: 2.5 },
                          py: 1.5,
                          mt: 1,
                        }}
                      >
                        {renderPhysicianFields(
                          section.fieldIds,
                          allFields,
                          control,
                          errors,
                          physicianNameRow,
                          physicianStreetRow,
                          physicianCityStateZipRow,
                        )}
                      </Box>
                    ) : (
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
                  </div>
                );
              }

              // --- Personal spouse section ---
              if (section.id === "profilePersonalSpouse") {
                return (
                  <div key={section.id}>
                    <ApplicantSection
                      applicant="spouse"
                      showLabel={shouldShowApplicantLabel(
                        "spouse",
                        watchedValues,
                      )}
                    >
                      {renderPersonalSpouseFields(
                        section.fieldIds,
                        allFields,
                        control,
                        errors,
                        watchedValues,
                      )}
                    </ApplicantSection>
                  </div>
                );
              }

              // --- Spouse conditional sections ---
              if (
                section.id === "profilePersonalSpouseDriversLicense" ||
                section.id === "profilePersonalSpouseOutsideUs" ||
                section.id === "profilePersonalSpouseTravelOutsideUs"
              ) {
                return (
                  <SubQuestionContainer key={section.id}>
                    {section.fieldIds.map((fieldId: string) => {
                      const field = allFields.find(
                        (f: any) => f.id === fieldId,
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
                  </SubQuestionContainer>
                );
              }

              // --- Spouse physician section ---
              if (section.id === "profilePersonalSpousePhysician") {
                return (
                  <div key={section.id}>
                    <Box
                      sx={{
                        backgroundColor: SECTION_SURFACE_BG,
                        borderRadius: 1.5,
                        px: { xs: 2, sm: 2.5 },
                        py: 1.5,
                        mt: 1,
                      }}
                    >
                      {renderPhysicianFields(
                        section.fieldIds,
                        allFields,
                        control,
                        errors,
                        spousePhysicianNameRow,
                        spousePhysicianStreetRow,
                        spousePhysicianCityStateZipRow,
                      )}
                    </Box>
                  </div>
                );
              }

              // --- Financial self section ---
              if (section.id === "profileFinancialSelf") {
                if (!showFinancial) return null;
                return (
                  <div key={section.id}>
                    <Divider sx={{ my: 3 }} />
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ fontWeight: 700, mb: 1, display: "block" }}
                    >
                      {section.description}
                    </Typography>
                    <ApplicantSection
                      applicant="self"
                      showLabel={shouldShowApplicantLabel(
                        "self",
                        watchedValues,
                      )}
                    >
                      {renderFinancialFields(
                        "self",
                        section.fieldIds,
                        allFields,
                        control,
                        errors,
                        watchedValues,
                        selfHasLife,
                        selfHasDisability,
                      )}
                    </ApplicantSection>
                  </div>
                );
              }

              // --- Financial spouse section ---
              if (section.id === "profileFinancialSpouse") {
                if (!showFinancial) return null;
                return (
                  <div key={section.id}>
                    <ApplicantSection
                      applicant="spouse"
                      showLabel={shouldShowApplicantLabel(
                        "spouse",
                        watchedValues,
                      )}
                    >
                      {renderFinancialFields(
                        "spouse",
                        section.fieldIds,
                        allFields,
                        control,
                        errors,
                        watchedValues,
                        spouseHasLife,
                        spouseHasDisability,
                      )}
                    </ApplicantSection>
                  </div>
                );
              }

              // Default: render fields in section
              return (
                <div key={section.id}>
                  {section.fieldIds.map((fieldId: string) => {
                    const field = allFields.find((f: any) => f.id === fieldId);
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
                </div>
              );
            })}
          </>
        );
      }}
    </FormRoutePage>
  );
}

// --- Helper render functions ---

function renderPersonalSelfFields(
  fieldIds: string[],
  allFields: any[],
  control: any,
  errors: any,
  _watchedValues: any,
) {
  return (
    <>
      {/* Height fields side-by-side */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {fieldIds
          .filter((id) => heightFields.has(id))
          .map((fieldId) => {
            const field = allFields.find((f: any) => f.id === fieldId);
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

      {/* Remaining fields rendered normally */}
      {fieldIds
        .filter((id) => !heightFields.has(id))
        .map((fieldId) => {
          const field = allFields.find((f: any) => f.id === fieldId);
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
    </>
  );
}

function renderPersonalSpouseFields(
  fieldIds: string[],
  allFields: any[],
  control: any,
  errors: any,
  _watchedValues: any,
) {
  return (
    <>
      {/* Height fields side-by-side */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {fieldIds
          .filter((id) => spouseHeightFields.has(id))
          .map((fieldId) => {
            const field = allFields.find((f: any) => f.id === fieldId);
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

      {/* Remaining fields */}
      {fieldIds
        .filter((id) => !spouseHeightFields.has(id))
        .map((fieldId) => {
          const field = allFields.find((f: any) => f.id === fieldId);
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
    </>
  );
}

function renderPhysicianFields(
  fieldIds: string[],
  allFields: any[],
  control: any,
  errors: any,
  nameRow: Set<string>,
  streetRow: Set<string>,
  cityStateZipRow: Set<string>,
) {
  const phoneField = fieldIds.find(
    (id) => id.includes("physician-phone") || id.includes("-phone"),
  );
  const facilityField = fieldIds.find((id) => id.includes("facility-name"));

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: { xs: 0, sm: 2 },
        }}
      >
        {fieldIds
          .filter((id) => nameRow.has(id))
          .map((fieldId) => {
            const field = allFields.find((f: any) => f.id === fieldId);
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
      {phoneField &&
        (() => {
          const field = allFields.find((f: any) => f.id === phoneField);
          if (!field) return null;
          return (
            <FieldRenderer
              key={field.id}
              field={field}
              control={control}
              errors={errors}
            />
          );
        })()}
      {facilityField &&
        (() => {
          const field = allFields.find((f: any) => f.id === facilityField);
          if (!field) return null;
          return (
            <FieldRenderer
              key={field.id}
              field={field}
              control={control}
              errors={errors}
            />
          );
        })()}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: { xs: 0, sm: 2 },
        }}
      >
        {fieldIds
          .filter((id) => streetRow.has(id))
          .map((fieldId) => {
            const field = allFields.find((f: any) => f.id === fieldId);
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
        {fieldIds
          .filter((id) => cityStateZipRow.has(id))
          .map((fieldId) => {
            const field = allFields.find((f: any) => f.id === fieldId);
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
    </>
  );
}

function renderFinancialFields(
  applicant: "self" | "spouse",
  fieldIds: string[],
  allFields: any[],
  control: any,
  errors: any,
  watchedValues: any,
  hasLife: boolean,
  hasDisability: boolean,
) {
  const isSelf = applicant === "self";

  const hasOtherLifeId = isSelf
    ? "has-other-life-insurance"
    : "spouse-has-other-life-insurance";
  const pendingLifeAppsId = isSelf
    ? "has-pending-life-insurance-applications"
    : "spouse-has-pending-life-insurance-applications";
  const hasDiId = isSelf
    ? "has-disability-insurance"
    : "spouse-has-disability-insurance";
  const replacingDiId = isSelf
    ? "is-replacing-disability-insurance"
    : "spouse-is-replacing-disability-insurance";
  const replacingDiAmountId = isSelf
    ? "disability-replacement-amount"
    : "spouse-disability-replacement-amount";
  const followupSet = isSelf
    ? lifeInsuranceFollowup
    : spouseLifeInsuranceFollowup;
  const pendingFollowupSet = isSelf
    ? pendingLifeFollowup
    : spousePendingLifeFollowup;
  const disabilityListName = isSelf
    ? "selfDisabilityCompanies"
    : "spouseDisabilityCompanies";

  function renderField(fieldId: string) {
    const field = allFields.find((f: any) => f.id === fieldId);
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

  return (
    <>
      <Alert severity="info" icon={false} sx={{ mb: 1.5 }}>
        {otherCoverageInfoNote}
      </Alert>

      {hasLife && (
        <>
          {renderField(hasOtherLifeId)}
          {watchedValues[hasOtherLifeId] === "yes" && (
            <SubQuestionContainer>
              {fieldIds
                .filter((id) => followupSet.has(id))
                .map((id) => renderField(id))}
            </SubQuestionContainer>
          )}
          {renderField(pendingLifeAppsId)}
          {watchedValues[pendingLifeAppsId] === "yes" && (
            <SubQuestionContainer>
              {fieldIds
                .filter((id) => pendingFollowupSet.has(id))
                .map((id) => renderField(id))}
            </SubQuestionContainer>
          )}
        </>
      )}

      {hasDisability && (
        <Box sx={{ mt: hasLife ? 2 : 0 }}>
          {renderField(hasDiId)}
          {watchedValues[hasDiId] === "yes" && (
            <SubQuestionContainer>
              <Box sx={{ mt: 1, mb: 2 }}>
                <AddList
                  control={control}
                  name={disabilityListName}
                  label="Company"
                  mapping={disabilityCompanyMapping}
                  renderItem={renderDisabilityCompanySummary}
                />
              </Box>
              {renderField(replacingDiId)}
              {watchedValues[replacingDiId] === "yes" &&
                renderField(replacingDiAmountId)}
            </SubQuestionContainer>
          )}
        </Box>
      )}
    </>
  );
}
