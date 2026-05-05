import { Alert, Box, Typography } from "@mui/material";
import { useMemo } from "react";
import FormRoutePage, {
  isSectionVisible,
} from "../components/form/FormRoutePage";
import FieldRenderer from "../components/form/FieldRenderer";
import ApplicantSection from "../components/form/ApplicantSection";
import { shouldShowApplicantLabel } from "../components/form/applicantVisibility";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import AddList from "../components/form/AddList";
import type { FieldDefinition } from "../config/fields/types";

const otherCoverageInfoNote =
  "Please indicate if you currently hold an active insurance policy with any carrier, including through your employer. Other insurance you have today can impact the amount of coverage you may be approved for.";

const disabilityCompanyFields: FieldDefinition[] = [
  {
    id: "di-company-name",
    label: "Company",
    inputType: "text",
    labelVariant: "floating",
  },
  {
    id: "di-company-monthly-benefit",
    label: "Monthly Benefit Amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
    tooltip:
      "You can find your current coverage amount in your recent statement from your carrier.",
  },
  {
    id: "di-company-benefit-period",
    label: "Benefit Period",
    inputType: "text",
    placeholder: "Age 65 or older, 1-5 year, etc.",
    labelVariant: "floating",
  },
  {
    id: "di-company-waiting-period",
    label: "Waiting Period",
    inputType: "text",
    placeholder: "30 days, 60 days, etc",
    labelVariant: "floating",
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
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const digitsOnly = value.replace(/[^\d.-]/g, "");
    const parsed = Number(digitsOnly);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeApplicantId(rawApplicantId: string) {
  if (rawApplicantId === "self") return "member";
  return rawApplicantId;
}

export default function Financial() {
  const coverages = useMemo(() => getActiveClientCoverages(), []);

  return (
    <FormRoutePage pageId="financial">
      {({ control, errors, watchedValues, allFields, pageSections }) => {
        const storedAmounts = getStoredCoverageAmounts(watchedValues);
        const selectedCoverageIds = Array.isArray(
          watchedValues.coverageSelections,
        )
          ? watchedValues.coverageSelections
          : [];

        const selectedCoverages = coverages.filter((coverage) =>
          selectedCoverageIds.includes(coverage.id),
        );

        const hasCoverage = (
          applicantId: "member" | "spouse",
          categoryId: "LI" | "DI",
          minimumAmount = 0,
        ) => {
          const selectedCoverageIdSet = new Set(
            selectedCoverageIds.map((id) => String(id).trim()),
          );
          const coverageIdSet = new Set(
            coverages.map((coverage) => coverage.id),
          );
          const selectedCoveragesById = new Map(
            selectedCoverages.map((coverage) => [coverage.id, coverage]),
          );

          function parseCoverageAmountKey(key: string) {
            const [firstPart, secondPart] = key
              .split(":")
              .map((part) => part.trim());

            if (!firstPart || !secondPart) {
              return null;
            }

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

          return Object.entries(storedAmounts).some(([key, rawAmount]) => {
            const parsedKey = parseCoverageAmountKey(key);
            if (!parsedKey) {
              return false;
            }

            const { coverageId, applicant } = parsedKey;

            if (applicant !== applicantId) {
              return false;
            }

            if (
              selectedCoverageIdSet.size > 0 &&
              !selectedCoverageIdSet.has(coverageId)
            ) {
              return false;
            }

            const coverage = selectedCoveragesById.get(coverageId);
            if (!coverage || coverage.categoryId !== categoryId) {
              return false;
            }

            return toNumericAmount(rawAmount) > minimumAmount;
          });
        };

        const selfHasLife = hasCoverage("member", "LI");
        const selfHasDisability = hasCoverage("member", "DI");
        const spouseHasLife = hasCoverage("spouse", "LI");
        const spouseHasDisability = hasCoverage("spouse", "DI");
        const showSelfFinancialProfile = hasCoverage("member", "DI", 3000);

        function renderFieldById(fieldId: string) {
          const field = allFields.find((candidate) => candidate.id === fieldId);
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
              <Alert severity="info" sx={{ mb: 1.5 }}>
                {otherCoverageInfoNote}
              </Alert>

              {hasLife ? (
                <>
                  {renderFieldById(hasOtherLifeInsuranceFieldId)}

                  {watchedValues[hasOtherLifeInsuranceFieldId] === "yes"
                    ? [
                        renderFieldById(existingLifeAmountFieldId),
                        renderFieldById(replacingLifeFieldId),
                      ]
                    : null}

                  {renderFieldById(pendingLifeAppsFieldId)}

                  {watchedValues[pendingLifeAppsFieldId] === "yes"
                    ? [
                        renderFieldById(pendingLifeAmountFieldId),
                        renderFieldById(pendingLifeCompanyFieldId),
                      ]
                    : null}
                </>
              ) : null}

              {hasDi ? (
                <Box sx={{ mt: hasLife ? 2 : 0 }}>
                  {renderFieldById(hasDiFieldId)}

                  {watchedValues[hasDiFieldId] === "yes" ? (
                    <>
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

                      {watchedValues[replacingDiFieldId] === "yes"
                        ? renderFieldById(replacingDiAmountFieldId)
                        : null}
                    </>
                  ) : null}
                </Box>
              ) : null}
            </>
          );
        }

        function getVisibleFieldIds(sectionId: string, fieldIds: string[]) {
          switch (sectionId) {
            case "financialSelfOtherCoverage": {
              const visibleFieldIds: string[] = [];

              if (selfHasLife) {
                visibleFieldIds.push("has-other-life-insurance");

                if (watchedValues["has-other-life-insurance"] === "yes") {
                  visibleFieldIds.push(
                    "existing-life-insurance-amount",
                    "is-replacing-life-insurance",
                  );
                }

                visibleFieldIds.push("has-pending-life-insurance-applications");

                if (
                  watchedValues["has-pending-life-insurance-applications"] ===
                  "yes"
                ) {
                  visibleFieldIds.push(
                    "pending-life-insurance-amount",
                    "pending-life-insurance-company",
                  );
                }
              }

              if (selfHasDisability) {
                visibleFieldIds.push("has-disability-insurance");

                if (watchedValues["has-disability-insurance"] === "yes") {
                  visibleFieldIds.push("is-replacing-disability-insurance");

                  if (
                    watchedValues["is-replacing-disability-insurance"] === "yes"
                  ) {
                    visibleFieldIds.push("disability-replacement-amount");
                  }
                }
              }

              return visibleFieldIds;
            }

            case "financialSelfFinancialProfile":
              return showSelfFinancialProfile ? fieldIds : [];

            case "financialSelfEmploymentDetails":
              return watchedValues["is-self-employed"] === "yes"
                ? fieldIds
                : [];

            case "financialSpouseOtherCoverage": {
              const visibleFieldIds: string[] = [];

              if (spouseHasLife) {
                visibleFieldIds.push("spouse-has-other-life-insurance");

                if (
                  watchedValues["spouse-has-other-life-insurance"] === "yes"
                ) {
                  visibleFieldIds.push(
                    "spouse-existing-life-insurance-amount",
                    "spouse-is-replacing-life-insurance",
                  );
                }

                visibleFieldIds.push(
                  "spouse-has-pending-life-insurance-applications",
                );

                if (
                  watchedValues[
                    "spouse-has-pending-life-insurance-applications"
                  ] === "yes"
                ) {
                  visibleFieldIds.push(
                    "spouse-pending-life-insurance-amount",
                    "spouse-pending-life-insurance-company",
                  );
                }
              }

              if (spouseHasDisability) {
                visibleFieldIds.push("spouse-has-disability-insurance");

                if (
                  watchedValues["spouse-has-disability-insurance"] === "yes"
                ) {
                  visibleFieldIds.push(
                    "spouse-is-replacing-disability-insurance",
                  );

                  if (
                    watchedValues[
                      "spouse-is-replacing-disability-insurance"
                    ] === "yes"
                  ) {
                    visibleFieldIds.push(
                      "spouse-disability-replacement-amount",
                    );
                  }
                }
              }

              return visibleFieldIds;
            }

            default:
              return fieldIds;
          }
        }

        const visibleSections = pageSections
          .filter((section) => isSectionVisible(section, watchedValues))
          .map((section) => ({
            ...section,
            visibleFieldIds: getVisibleFieldIds(section.id, section.fieldIds),
          }))
          .filter((section) => section.visibleFieldIds.length > 0);

        const selfSections = visibleSections.filter(
          (section) => section.applicant === "self",
        );
        const spouseSections = visibleSections.filter(
          (section) => section.applicant === "spouse",
        );

        function renderApplicantSections(
          applicant: "self" | "spouse",
          sections: typeof visibleSections,
        ) {
          if (sections.length === 0) {
            return null;
          }

          return (
            <ApplicantSection
              applicant={applicant}
              showLabel={shouldShowApplicantLabel(applicant, watchedValues)}
            >
              {sections.map((section, index) => {
                return (
                  <Box key={section.id} sx={{ mt: index === 0 ? 0 : 3 }}>
                    {section.id === "financialSelfOtherCoverage"
                      ? renderOtherCoverageContent("self")
                      : section.id === "financialSpouseOtherCoverage"
                        ? renderOtherCoverageContent("spouse")
                        : section.visibleFieldIds.map((fieldId) =>
                            renderFieldById(fieldId),
                          )}
                  </Box>
                );
              })}
            </ApplicantSection>
          );
        }

        return (
          <>
            {renderApplicantSections("self", selfSections)}
            {renderApplicantSections("spouse", spouseSections)}
          </>
        );
      }}
    </FormRoutePage>
  );
}
