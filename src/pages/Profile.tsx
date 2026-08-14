import { useMemo } from "react";
import { Alert, Box, Typography } from "@mui/material";
import FormRoutePage, { isSectionVisible } from "../app/RoutePage";
import FieldRenderer from "../components/forms/FieldRenderer";
import ApplicantSectionDivider from "../components/layout/ApplicantSectionDivider";
import { shouldShowApplicantLabel } from "../utils/applicantVisibility";
import ConditionalGroup from "../components/forms/ConditionalGroup";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import DynamicList from "../components/forms/DynamicList";
import SectionDivider from "../components/layout/SectionDivider";
import { sectionLabels } from "../config/pageSections";
import PhysicianInformation from "../components/forms/PhysicianInformation.tsx";
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
        const selfHasDIOver2000 = hasCoverage("member", "DI", 2000);

        const visibleSectionIds = new Set(
          pageSections
            .filter((section) => isSectionVisible(section, watchedValues))
            .map((section) => section.id),
        );

        const selfSectionOrder = [
          "profilePersonalSelf",
          "profilePersonalSelfPhysician",
          "profileFinancialSelf",
          "profileFinancialQuestionnaireSelf",
        ] as const;
        const firstSelfSectionId = selfSectionOrder.find((id) =>
          visibleSectionIds.has(id),
        );

        const spouseSectionOrder = [
          "profilePersonalSpouse",
          "profilePersonalSpousePhysician",
          "profileFinancialSpouse",
        ] as const;
        const firstSpouseSectionId = spouseSectionOrder.find((id) =>
          visibleSectionIds.has(id),
        );

        return (
          <>
            {pageSections.map((section) => {
              if (!isSectionVisible(section, watchedValues)) return null;

              if (section.id === "profilePersonalSelf") {
                return (
                  <div key={section.id}>
                    <ApplicantSectionDivider
                      applicant="self"
                      showLabel={
                        section.id === firstSelfSectionId &&
                        shouldShowApplicantLabel("self", watchedValues)
                      }
                    >
                      <SectionDivider
                        label={
                          section.description ?? sectionLabels.personalInfo
                        }
                        variant="subsection"
                        sx={{ mb: 1 }}
                      />
                      {renderPersonalSelfFields(
                        section.fieldIds,
                        allFields,
                        control,
                        errors,
                        watchedValues,
                      )}
                    </ApplicantSectionDivider>
                  </div>
                );
              }

              if (
                section.id === "profilePersonalSelfDriversLicense" ||
                section.id === "profilePersonalSelfOutsideUs" ||
                section.id === "profilePersonalSelfTravelOutsideUs"
              ) {
                return null;
              }

              if (section.id === "profilePersonalSelfPhysician") {
                return (
                  <div key={section.id}>
                    <ApplicantSectionDivider
                      applicant="self"
                      showLabel={
                        section.id === firstSelfSectionId &&
                        shouldShowApplicantLabel("self", watchedValues)
                      }
                    >
                      <PhysicianInformation
                        fieldIds={section.fieldIds}
                        allFields={allFields}
                        control={control}
                        errors={errors}
                        nameRow={physicianNameRow}
                        streetRow={physicianStreetRow}
                        cityStateZipRow={physicianCityStateZipRow}
                      />
                    </ApplicantSectionDivider>
                  </div>
                );
              }

              if (section.id === "profileFinancialSelf") {
                return (
                  <div key={section.id}>
                    <ApplicantSectionDivider
                      applicant="self"
                      showLabel={
                        section.id === firstSelfSectionId &&
                        shouldShowApplicantLabel("self", watchedValues)
                      }
                    >
                      <SectionDivider
                        label={
                          section.description ?? sectionLabels.financialInfo
                        }
                        variant="subsection"
                        sx={{ mb: 1 }}
                      />
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
                    </ApplicantSectionDivider>
                  </div>
                );
              }

              if (section.id === "profileFinancialQuestionnaireSelf") {
                if (!selfHasDIOver2000) return null;
                return (
                  <div key={section.id}>
                    <ApplicantSectionDivider
                      applicant="self"
                      showLabel={
                        section.id === firstSelfSectionId &&
                        shouldShowApplicantLabel("self", watchedValues)
                      }
                    >
                      <SectionDivider
                        label={
                          section.description ?? "Financial questionnaire"
                        }
                        variant="subsection"
                        sx={{ mb: 1 }}
                      />
                      {renderFinancialQuestionnaireFields(
                        section.fieldIds,
                        allFields,
                        control,
                        errors,
                        watchedValues,
                      )}
                    </ApplicantSectionDivider>
                  </div>
                );
              }

              if (section.id === "profilePersonalSpouse") {
                return (
                  <div key={section.id}>
                    <ApplicantSectionDivider
                      applicant="spouse"
                      showLabel={
                        section.id === firstSpouseSectionId &&
                        shouldShowApplicantLabel("spouse", watchedValues)
                      }
                    >
                      <SectionDivider
                        label={
                          section.description ?? sectionLabels.personalInfo
                        }
                        variant="subsection"
                        sx={{ mb: 1 }}
                      />
                      {renderPersonalSpouseFields(
                        section.fieldIds,
                        allFields,
                        control,
                        errors,
                        watchedValues,
                      )}
                    </ApplicantSectionDivider>
                  </div>
                );
              }

              if (
                section.id === "profilePersonalSpouseDriversLicense" ||
                section.id === "profilePersonalSpouseOutsideUs" ||
                section.id === "profilePersonalSpouseTravelOutsideUs"
              ) {
                return null;
              }

              if (section.id === "profilePersonalSpousePhysician") {
                return (
                  <div key={section.id}>
                    <ApplicantSectionDivider
                      applicant="spouse"
                      showLabel={
                        section.id === firstSpouseSectionId &&
                        shouldShowApplicantLabel("spouse", watchedValues)
                      }
                    >
                      <PhysicianInformation
                        fieldIds={section.fieldIds}
                        allFields={allFields}
                        control={control}
                        errors={errors}
                        nameRow={spousePhysicianNameRow}
                        streetRow={spousePhysicianStreetRow}
                        cityStateZipRow={spousePhysicianCityStateZipRow}
                      />
                    </ApplicantSectionDivider>
                  </div>
                );
              }

              if (section.id === "profileFinancialSpouse") {
                return (
                  <div key={section.id}>
                    <ApplicantSectionDivider
                      applicant="spouse"
                      showLabel={
                        section.id === firstSpouseSectionId &&
                        shouldShowApplicantLabel("spouse", watchedValues)
                      }
                    >
                      <SectionDivider
                        label={
                          section.description ?? sectionLabels.financialInfo
                        }
                        variant="subsection"
                        sx={{ mb: 1 }}
                      />
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
                    </ApplicantSectionDivider>
                  </div>
                );
              }

              return (
                <div key={section.id}>
                  {section.fieldIds.map((fieldId: string) => {
                    const field = allFields.find((f) => f.id === fieldId);
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
  allFields: FieldDefinition[],
  control: unknown,
  errors: unknown,
  watchedValues: Record<string, unknown>,
) {
  const questionFieldIds = new Set([
    "has-drivers-license",
    "intend-live-outside-us",
    "travel-outside-us-six-months",
  ]);

  function renderField(fieldId: string, margin: "none" | "normal" = "normal") {
    const field = allFields.find((f) => f.id === fieldId);
    if (!field) return null;
    return (
      <FieldRenderer
        key={field.id}
        field={field}
        control={control as never}
        errors={errors as never}
        margin={margin}
      />
    );
  }

  return (
    <>
      {/* Height fields side-by-side */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {fieldIds
          .filter((id) => heightFields.has(id))
          .map((fieldId) => renderField(fieldId, "none"))}
      </Box>

      {/* Remaining fields rendered normally */}
      {fieldIds
        .filter((id) => !heightFields.has(id) && !questionFieldIds.has(id))
        .map((fieldId) => renderField(fieldId))}

      {renderField("has-drivers-license")}
      {watchedValues["has-drivers-license"] === "yes" && (
        <ConditionalGroup>
          {renderField("drivers-license-number")}
          {renderField("drivers-license-state")}
        </ConditionalGroup>
      )}

      {renderField("intend-live-outside-us")}
      {watchedValues["intend-live-outside-us"] === "yes" && (
        <ConditionalGroup>
          {renderField("outside-us-months")}
          {renderField("outside-us-country")}
        </ConditionalGroup>
      )}

      {renderField("travel-outside-us-six-months")}
      {watchedValues["travel-outside-us-six-months"] === "yes" && (
        <ConditionalGroup>
          {renderField("travel-outside-us-country")}
        </ConditionalGroup>
      )}
    </>
  );
}

function renderPersonalSpouseFields(
  fieldIds: string[],
  allFields: FieldDefinition[],
  control: unknown,
  errors: unknown,
  watchedValues: Record<string, unknown>,
) {
  const questionFieldIds = new Set([
    "spouse-has-drivers-license",
    "spouse-intend-live-outside-us",
    "spouse-travel-outside-us-six-months",
  ]);

  function renderField(fieldId: string, margin: "none" | "normal" = "normal") {
    const field = allFields.find((f) => f.id === fieldId);
    if (!field) return null;
    return (
      <FieldRenderer
        key={field.id}
        field={field}
        control={control as never}
        errors={errors as never}
        margin={margin}
      />
    );
  }

  return (
    <>
      {/* Height fields side-by-side */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {fieldIds
          .filter((id) => spouseHeightFields.has(id))
          .map((fieldId) => renderField(fieldId, "none"))}
      </Box>

      {/* Remaining fields */}
      {fieldIds
        .filter(
          (id) => !spouseHeightFields.has(id) && !questionFieldIds.has(id),
        )
        .map((fieldId) => renderField(fieldId))}

      {renderField("spouse-has-drivers-license")}
      {watchedValues["spouse-has-drivers-license"] === "yes" && (
        <ConditionalGroup>
          {renderField("spouse-drivers-license-number")}
          {renderField("spouse-drivers-license-state")}
        </ConditionalGroup>
      )}

      {renderField("spouse-intend-live-outside-us")}
      {watchedValues["spouse-intend-live-outside-us"] === "yes" && (
        <ConditionalGroup>
          {renderField("spouse-outside-us-months")}
          {renderField("spouse-outside-us-country")}
        </ConditionalGroup>
      )}

      {renderField("spouse-travel-outside-us-six-months")}
      {watchedValues["spouse-travel-outside-us-six-months"] === "yes" && (
        <ConditionalGroup>
          {renderField("spouse-travel-outside-us-country")}
        </ConditionalGroup>
      )}
    </>
  );
}

function renderFinancialQuestionnaireFields(
  _fieldIds: string[],
  allFields: FieldDefinition[],
  control: unknown,
  errors: unknown,
  watchedValues: Record<string, unknown>,
) {
  function renderField(fieldId: string) {
    const field = allFields.find((f) => f.id === fieldId);
    if (!field) return null;
    return (
      <FieldRenderer
        key={field.id}
        field={field}
        control={control as never}
        errors={errors as never}
      />
    );
  }

  const isSelfEmployed = watchedValues["is-self-employed"] === "yes";
  const isSoleProprietor = watchedValues["is-sole-proprietor"] === true;
  const isProfessionalCorporation =
    watchedValues["is-professional-corporation"] === true;
  const hasSelfEmploymentSource = isSoleProprietor || isProfessionalCorporation;
  const hasWorkOutsideHome =
    watchedValues["has-work-location-outside-home"] === "yes";

  return (
    <>
      {renderField("total-net-worth")}
      {renderField("total-annual-unearned-income")}
      {renderField("is-self-employed")}
      {isSelfEmployed && (
        <ConditionalGroup>
          {renderField("is-sole-proprietor")}
          {renderField("is-professional-corporation")}
          {isSoleProprietor && (
            <>
              {renderField("sole-proprietor-gross-income")}
              {renderField("sole-proprietor-gross-earnings")}
              {renderField("sole-proprietor-business-expenses")}
            </>
          )}
          {isProfessionalCorporation && (
            <>
              {renderField("professional-corporation-annual-salary")}
              {renderField("professional-corporation-s-corp-distribution")}
              {renderField("professional-corporation-dividends")}
              {renderField("professional-corporation-bonus")}
              {renderField("bonus-payment-frequency")}
              {renderField("professional-corporation-commission")}
              {renderField("commission-payment-frequency")}
              {renderField("professional-corporation-benefits-cost")}
            </>
          )}
          {hasSelfEmploymentSource && (
            <>
              {renderField("years-self-employed")}
              {renderField("work-from-home")}
              {renderField("has-work-location-outside-home")}
              {hasWorkOutsideHome && renderField("work-location-details")}
            </>
          )}
        </ConditionalGroup>
      )}
    </>
  );
}

function renderFinancialFields(
  applicant: "self" | "spouse",
  fieldIds: string[],
  allFields: FieldDefinition[],
  control: unknown,
  errors: unknown,
  watchedValues: Record<string, unknown>,
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
    const field = allFields.find((f) => f.id === fieldId);
    if (!field) return null;
    return (
      <FieldRenderer
        key={field.id}
        field={field}
        control={control as never}
        errors={errors as never}
      />
    );
  }

  function renderDisabilityCompanySummary(item: Record<string, string>) {
    return (
      <>
        <Typography variant="subtitle2">{item.company || "Company"}</Typography>
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
            <ConditionalGroup>
              {fieldIds
                .filter((id) => followupSet.has(id))
                .map((id) => renderField(id))}
            </ConditionalGroup>
          )}
          {renderField(pendingLifeAppsId)}
          {watchedValues[pendingLifeAppsId] === "yes" && (
            <ConditionalGroup>
              {fieldIds
                .filter((id) => pendingFollowupSet.has(id))
                .map((id) => renderField(id))}
            </ConditionalGroup>
          )}
        </>
      )}

      {hasDisability && (
        <Box sx={{ mt: hasLife ? 2 : 0 }}>
          {renderField(hasDiId)}
          {watchedValues[hasDiId] === "yes" && (
            <ConditionalGroup>
              <Box sx={{ mt: 1, mb: 2 }}>
                <DynamicList
                  control={control as never}
                  name={disabilityListName}
                  label="Company"
                  mapping={disabilityCompanyMapping}
                  renderItem={renderDisabilityCompanySummary}
                />
              </Box>
              {renderField(replacingDiId)}
              {watchedValues[replacingDiId] === "yes" &&
                renderField(replacingDiAmountId)}
            </ConditionalGroup>
          )}
        </Box>
      )}
    </>
  );
}
