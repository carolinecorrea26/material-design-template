import { profileFinancialTotal, profileCalculationApplies, type ProfileFinancialCalculations } from '../../domain/profileFinancialCalculations';
import { requirementText } from "../../domain/requirementContent";
import { Alert, Box, Typography } from "@mui/material";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import type { ClientApplicantLabels } from "../../config/clients/types";
import type { ApplicantExperience } from "../../domain/applicantExperience";
import type { ResolvedFieldCollection } from "../../domain/fieldCollections";
import type { FieldDefinition } from "../../config/fields/types";
import FieldRenderer from "../forms/FieldRenderer";
import ConditionalGroup from "../forms/ConditionalGroup";
import DynamicList from "../forms/DynamicList";
import PhysicianInformation from "../forms/PhysicianInformation";
import ApplicantSectionDivider from "../layout/ApplicantSectionDivider";
import SectionDivider from "../layout/SectionDivider";
import ProfilePersonalInformation from "./ProfilePersonalInformation";

export function renderDisabilityCompanySummary(item: Record<string, string>) {
  return (
    <>
      <Typography variant="subtitle2">{item.company || requirementText("application.ui.company")}</Typography>
      <Typography variant="caption" color="text.secondary">
        {`${item.monthlyBenefitAmount || requirementText("application.ui.zero-amount")} | ${item.benefitPeriod || requirementText("application.ui.benefit-period-not-provided")} | ${item.waitingPeriod || requirementText("application.ui.waiting-period-not-provided")}`}
      </Typography>
    </>
  );
}

export type ProfileSectionsProps = Pick<FormRouteRenderProps, "control" | "errors" | "watchedValues" | "allFields" | "pageSections"> & {
  selfHasLife: boolean;
  selfHasDisability: boolean;
  spouseHasLife: boolean;
  spouseHasDisability: boolean;
  applicantLabels?: ClientApplicantLabels;
  showApplicantLabels?: Partial<Record<"self" | "spouse", boolean>>;
  financialCalculations?: ProfileFinancialCalculations;
  lifeReplacementNotice?: NonNullable<ApplicantExperience["profile"]>["lifeReplacementNotice"];
  disabilityCollections?: Partial<Record<"self" | "spouse", ResolvedFieldCollection>>;
  sectionNotes?: Record<string, string | undefined>;
};

const physicianNameRow = new Set([
  "physician-first-name",
  "physician-last-name",
]);
const physicianAddressFieldIds = {
  "street-address": "medical-facility-street-address",
  "apt-suite": "medical-facility-apt-suite",
  city: "medical-city",
  state: "medical-state",
  "zip-code": "medical-zip-code",
};
const spousePhysicianNameRow = new Set([
  "spouse-physician-first-name",
  "spouse-physician-last-name",
]);
const spousePhysicianAddressFieldIds = {
  "street-address": "spouse-medical-facility-street-address",
  "apt-suite": "spouse-medical-facility-apt-suite",
  city: "spouse-medical-city",
  state: "spouse-medical-state",
  "zip-code": "spouse-medical-zip-code",
};

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

/** Profile content in supplied section order; the page resolves Site participation and coverage policy. */
export default function ProfileSections({ control, errors, watchedValues, allFields, pageSections,
  selfHasLife, selfHasDisability, spouseHasLife, spouseHasDisability, applicantLabels,
  showApplicantLabels = {}, financialCalculations, lifeReplacementNotice, disabilityCollections, sectionNotes = {} }: ProfileSectionsProps) {
  const selfSections = new Set([
    "profilePersonalSelf",
    "profilePersonalSelfPhysician",
    "profileFinancialSelf",
    "profileFinancialQuestionnaireSelf",
  ]);
  const firstSelfSectionId = pageSections.find(section => selfSections.has(section.id))?.id;

  const spouseSections = new Set([
    "profilePersonalSpouse",
    "profilePersonalSpousePhysician",
    "profileFinancialSpouse",
  ]);
  const firstSpouseSectionId = pageSections.find(section => spouseSections.has(section.id))?.id;

  return (
    <>
      {pageSections.map((section) => {

        if (section.id === "profilePersonalSelf") {
          return (
            <div key={section.id}>
              <ApplicantSectionDivider
                applicant="self" labels={applicantLabels}
                showLabel={
                  section.id === firstSelfSectionId &&
                  showApplicantLabels.self === true
                }
              >
                <SectionDivider
                  label={
                    section.description ?? requirementText('profile.section.personal')
                  }
                  variant="subsection"
                  sx={{ mb: 1 }}
                >
                  <ProfilePersonalInformation applicant="self" fieldIds={section.fieldIds}
                    allFields={allFields} control={control} errors={errors} watchedValues={watchedValues} />
                </SectionDivider>
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
                applicant="self" labels={applicantLabels}
                showLabel={
                  section.id === firstSelfSectionId &&
                  showApplicantLabels.self === true
                }
              >
                <PhysicianInformation
                  title={section.description}
                  fieldIds={section.fieldIds}
                  allFields={allFields}
                  control={control}
                  errors={errors}
                  nameRow={physicianNameRow}
                  addressFieldIds={physicianAddressFieldIds}
                />
              </ApplicantSectionDivider>
            </div>
          );
        }

        if (section.id === "profileFinancialSelf") {
          if (!selfHasLife && !selfHasDisability) return null;
          return (
            <div key={section.id}>
              <ApplicantSectionDivider
                applicant="self" labels={applicantLabels}
                showLabel={
                  section.id === firstSelfSectionId &&
                  showApplicantLabels.self === true
                }
              >
                <SectionDivider
                  label={
                    section.description ?? requirementText('profile.section.other-coverage')
                  }
                  variant="subsection"
                  sx={{ mb: 1 }}
                  note={sectionNotes[section.id] && <Alert severity="info" icon={false} sx={{ mb: 1.5 }}>{sectionNotes[section.id]}</Alert>}
                >
                  {renderFinancialFields(
                    "self",
                    section.fieldIds,
                    allFields,
                    control,
                    errors,
                    watchedValues,
                    selfHasLife,
                    selfHasDisability, lifeReplacementNotice, disabilityCollections?.self,
                  )}
                </SectionDivider>
              </ApplicantSectionDivider>
            </div>
          );
        }

        if (section.id === "profileFinancialQuestionnaireSelf") {
          return (
            <div key={section.id}>
              <ApplicantSectionDivider
                applicant="self" labels={applicantLabels}
                showLabel={
                  section.id === firstSelfSectionId &&
                  showApplicantLabels.self === true
                }
              >
                <SectionDivider
                  label={
                    section.description ?? requirementText('profile.section.financial-questionnaire')
                  }
                  variant="subsection"
                  sx={{ mb: 1 }}
                >
                  {renderFinancialQuestionnaireFields(
                    section.fieldIds,
                    allFields,
                    control,
                    errors,
                    watchedValues, financialCalculations,
                  )}
                </SectionDivider>
              </ApplicantSectionDivider>
            </div>
          );
        }

        if (section.id === "profilePersonalSpouse") {
          return (
            <div key={section.id}>
              <ApplicantSectionDivider
                applicant="spouse" labels={applicantLabels}
                showLabel={
                  section.id === firstSpouseSectionId &&
                  showApplicantLabels.spouse === true
                }
              >
                <SectionDivider
                  label={
                    section.description ?? requirementText('profile.section.personal')
                  }
                  variant="subsection"
                  sx={{ mb: 1 }}
                >
                  <ProfilePersonalInformation applicant="spouse" fieldIds={section.fieldIds}
                    allFields={allFields} control={control} errors={errors} watchedValues={watchedValues} />
                </SectionDivider>
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
                applicant="spouse" labels={applicantLabels}
                showLabel={
                  section.id === firstSpouseSectionId &&
                  showApplicantLabels.spouse === true
                }
              >
                <PhysicianInformation
                  title={section.description}
                  fieldIds={section.fieldIds}
                  allFields={allFields}
                  control={control}
                  errors={errors}
                  nameRow={spousePhysicianNameRow}
                  addressFieldIds={spousePhysicianAddressFieldIds}
                />
              </ApplicantSectionDivider>
            </div>
          );
        }

        if (section.id === "profileFinancialSpouse") {
          if (!spouseHasLife && !spouseHasDisability) return null;
          return (
            <div key={section.id}>
              <ApplicantSectionDivider
                applicant="spouse" labels={applicantLabels}
                showLabel={
                  section.id === firstSpouseSectionId &&
                  showApplicantLabels.spouse === true
                }
              >
                <SectionDivider
                  label={
                    section.description ?? requirementText('profile.section.other-coverage')
                  }
                  variant="subsection"
                  sx={{ mb: 1 }}
                  note={sectionNotes[section.id] && <Alert severity="info" icon={false} sx={{ mb: 1.5 }}>{sectionNotes[section.id]}</Alert>}
                >
                  {renderFinancialFields(
                    "spouse",
                    section.fieldIds,
                    allFields,
                    control,
                    errors,
                    watchedValues,
                    spouseHasLife,
                    spouseHasDisability, lifeReplacementNotice, disabilityCollections?.spouse,
                  )}
                </SectionDivider>
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
}

function renderFinancialQuestionnaireFields(
  fieldIds: string[],
  allFields: FieldDefinition[],
  control: unknown,
  errors: unknown,
  watchedValues: Record<string, unknown>,
  calculations?: ProfileFinancialCalculations,
) {
  if (!calculations) throw new Error("Missing fresh-start Profile financial calculations");
  const policy = calculations;
  function renderField(fieldId: string) {
    if (!fieldIds.includes(fieldId)) return null;
    const field = allFields.find((f) => f.id === fieldId);
    if (!field) return null;
    return (
      <div key={field.id}>
        <FieldRenderer field={field} control={control as never} errors={errors as never} />
        {policy.calculations.filter(row => row.afterField === field.id && profileCalculationApplies(row, watchedValues)).map(row =>
          <Typography key={row.id} role="status" sx={{ my: 1 }}>{requirementText(row.label)}: <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: policy.currency }).format(profileFinancialTotal(policy, row.id, watchedValues))}</strong></Typography>)}
      </div>
    );
  }

  const isSelfEmployed = watchedValues["is-self-employed"] === "yes";
  const isSoleProprietor = watchedValues["is-sole-proprietor"] === true;
  const isProfessionalCorporation =
    watchedValues["is-professional-corporation"] === true;
  const worksFromHome = watchedValues["work-from-home"] === "yes";
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
          {isSelfEmployed && (
            <>
              {renderField("years-self-employed")}
              {renderField("work-from-home")}
              {worksFromHome && <ConditionalGroup>
                {renderField("has-work-location-outside-home")}
                {hasWorkOutsideHome && renderField("work-location-details")}
              </ConditionalGroup>}
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
  notice: ProfileSectionsProps["lifeReplacementNotice"],
  collection: ResolvedFieldCollection | undefined,
) {
  const isSelf = applicant === "self";
  const replacementId = isSelf ? "is-replacing-life-insurance" : "spouse-is-replacing-life-insurance";
  const jurisdiction = String(watchedValues["state-province"] || watchedValues.state || "").replace(/^US-/, "").toUpperCase();

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


  function renderDisabilityCompanies() {
    if (!collection) throw new Error(`Missing configured disability collection for ${applicant}`);
    return <DynamicList control={control as never} name={collection.name} label={collection.label} maxItems={collection.maxItems} mapping={collection.mapping} renderItem={renderDisabilityCompanySummary} />;
  }

  return (
    <>
      {hasLife && (
        <>
          {renderField(hasOtherLifeId)}
          {allFields.some(field => field.id === hasOtherLifeId) && watchedValues[hasOtherLifeId] === "yes" && (
            <ConditionalGroup>
              {fieldIds
                .filter((id) => followupSet.has(id))
                .map((id) => renderField(id))}
              {allFields.some(field => field.id === replacementId) && watchedValues[replacementId] === "yes" && notice?.jurisdictions.includes(jurisdiction) && (
                <Typography data-testid={`${applicant}-life-replacement-notice`} sx={{ fontSize: `${notice.fontSizePt}pt`, fontWeight: notice.bold ? "bold" : "normal", my: 2 }}>{notice.text}</Typography>
              )}
            </ConditionalGroup>
          )}
          {renderField(pendingLifeAppsId)}
          {allFields.some(field => field.id === pendingLifeAppsId) && watchedValues[pendingLifeAppsId] === "yes" && (
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
          {allFields.some(field => field.id === hasDiId) && watchedValues[hasDiId] === "yes" && (
            <ConditionalGroup>
              <Box sx={{ mt: 1, mb: 2 }}>
                {renderDisabilityCompanies()}
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
