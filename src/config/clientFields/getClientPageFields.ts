import { activeCoverageApplicantRestriction, resolveAvailableApplicants } from '../client/coverageApplicantScope';
import { buildSelectedCoverageEntries } from '../../utils/coverageDecisions';
import { getActiveClientCoverages } from '../client/getActiveClientCoverages';
import { eligibilityFactCollectionFields, isEligibilityFactRequirements } from "../../domain/eligibilityFacts";
import { filterEligibleStateOptions, isContactFieldAvailable } from "../../domain/applicantExperience";
import { getActiveClient } from "../client/getActiveClient";
import type { PageId } from "../../types";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { FieldDefinition } from "../fields/types";
import { filterFieldsByVisibilityDependencies, resolveVisibleFields } from "../conditions";
import { getResolvedFieldsForSite } from "../fields/resolvedFieldRegistry";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { requirementText } from '../../domain/requirementContent';
import { configuredHealthQuestionnaire } from "../../domain/configuredHealthQuestionnaire";
import { applicantParticipatesInPage } from "../flowGates";
import {
  type ActiveAssociationResolution,
  type Association,
  type Site,
  getActiveSite,
  getAssociationsForSite,
  resolveActiveAssociationFromApplication,
} from "../../data";

export function resolveAssociationMembershipField(
  field: FieldDefinition,
  site: Site,
  associations: Association[],
  associationResolution: ActiveAssociationResolution,
): FieldDefinition {
  if (field.id !== "membership") return field;
  const base = { ...field };
  for (const key of ['options', 'optionSource', 'optionOutcome', 'placeholder', 'labelVariant'] as const) delete base[key];
  if (site.associationSelection?.mode === "select") {
    const configuration = field.configuration === 'association' ? field : field.configurations?.association;
    if (!configuration?.optionOutcome || configuration.optionSource !== 'site-associations') throw new Error('Missing fresh-start association field configuration');
    return {
      ...base,
      ...configuration,
      configuration: 'association',
      options: associations.map((association) => ({
        label: association.name,
        value: association.id,
        outcome: configuration.optionOutcome,
      })),
    };
  }
  if (
    site.associationSelection?.mode === "url-parameter" &&
    associationResolution.status === "resolved"
  ) {
    const configuration = field.configuration === 'yes-no' ? field : field.configurations?.['yes-no'];
    if (!configuration?.options?.length) throw new Error('Missing fresh-start yes/no field configuration');
    return {
      ...base,
      ...configuration,
      configuration: 'yes-no',
      label: requirementText('membership.association.attestation', { associationName: associationResolution.association!.name }),
    };
  }
  return field;
}

export function getClientPageFields(
  pageId: PageId,
  values?: ApplicationFormValues,
) {
  const site = getActiveSite();
  const library = getPrototypeLibrary(site.id);
  const questionnaires = library && ["health-tele", "health-di-supp", "health-cir"].includes(pageId) ? (["member", "spouse"] as const).map(applicant => ({ applicant, result: configuredHealthQuestionnaire(library.site, pageId, applicant, values ?? {}) })) : [];
  const experience = getActiveClient().applicantExperience;
  const contactProductKeys = pageId === 'contact' ? [...new Set(buildSelectedCoverageEntries(values ?? {}, getActiveClientCoverages()).map(entry => entry.coverageId))] : [];
  const configuredFields = getResolvedFieldsForSite(pageId, site.id);
  const coveredPeople = resolveAvailableApplicants(experience?.coveredPeople, activeCoverageApplicantRestriction(site.id));
  const participationFields = pageId === "membership"
    ? configuredFields.map(field => resolveAssociationMembershipField(field, site, getAssociationsForSite(site.id), resolveActiveAssociationFromApplication(site.id, values)))
    : pageId === 'eligibility' && coveredPeople ? configuredFields.filter(field => !field.id.startsWith('spouse-') || coveredPeople.includes('spouse')).map(field => field.id === 'dependents' ? { ...field, options: field.options?.filter(option => coveredPeople.includes(option.value as 'spouse' | 'child')) } : field).filter(field => field.id !== 'dependents' || !!field.options?.length) : configuredFields;
  const visibleFields = resolveVisibleFields(
    participationFields.filter(field => {
      if (pageId !== "coverage" || !Object.values(eligibilityFactCollectionFields).includes(field.id)) return true;
      return library?.site.configuration.products.some(product => Array.isArray(values?.coverageSelections) && values.coverageSelections.includes(product.productKey) && product.eligibilityFacts.some(policy => isEligibilityFactRequirements(policy.value) && policy.value.some(requirement => eligibilityFactCollectionFields[requirement.fact] === field.id))) === true;
    }).filter(field => pageId !== "contact" || isContactFieldAvailable(experience, field.id, contactProductKeys)),
    values ?? {},
  );

  const entries = visibleFields.some(field => field.underwritingVariants || field.coverageCategories || field.optionalForProducts) ? buildSelectedCoverageEntries(values ?? {}, getActiveClientCoverages()) : [];
  const qdApplicants = new Set(entries.filter(entry => (entry.underwriting?.status === 'resolved' ? entry.underwriting.underwritingType : entry.underwriting ? undefined : entry.coverage.underwritingType) === 'QD').map(entry => entry.applicant));
  const fields = visibleFields.flatMap(field => {
    const applicant = field.id.startsWith('spouse-') ? 'spouse' : field.id.startsWith('child-') ? 'child' : 'member';
    if (field.coverageCategories && !entries.some(entry => entry.applicant === applicant && field.coverageCategories!.includes(entry.coverage.categoryId))) return [];
    const active = entries.filter(entry => entry.applicant === applicant);
    const required = field.optionalForProducts && active.length > 0 && active.every(entry => field.optionalForProducts!.includes(entry.coverageId)) ? false : field.required;
    const variant = (qdApplicants.has(applicant) ? field.underwritingVariants?.QD : undefined) ?? field.underwritingVariants?.default;
    return variant?.hidden ? [] : [filterEligibleStateOptions({ ...field, required, ...(variant?.label ? { label: variant.label } : {}) }, experience)];
  });
  if (questionnaires.some(({ result }) => result.status !== "unassigned")) return questionnaires.flatMap(({ applicant, result }) => applicantParticipatesInPage(pageId, applicant, values ?? {}) ? result.status === "unassigned" ? fields.filter(field => field.id.endsWith("-spouse") === (applicant === "spouse")) : result.fields : []);
  return filterFieldsByVisibilityDependencies(fields);
}
