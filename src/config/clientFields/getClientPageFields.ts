import { eligibilityFactCollectionFields, isEligibilityFactRequirements } from "../../domain/eligibilityFacts";
import { isContactFieldAvailable } from "../../domain/applicantExperience";
import { getActiveClient } from "../client/getActiveClient";
import type { PageId } from "../../types";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { FieldDefinition } from "../fields/types";
import { resolveVisibleFields } from "../conditions";
import { getResolvedFieldsForSite } from "../fields/resolvedFieldRegistry";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
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
  if (site.associationSelection?.mode === "select") {
    return {
      ...field,
      label: "I am a member of",
      inputType: "searchable-select",
      labelVariant: "standard",
      placeholder: "Search or select association",
      options: associations.map((association) => ({
        label: association.name,
        value: association.id,
      })),
    };
  }
  if (
    site.associationSelection?.mode === "url-parameter" &&
    associationResolution.status === "resolved"
  ) {
    return {
      ...field,
      label: `Are you a member of ${associationResolution.association!.name}?`,
      inputType: "radio",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
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
  const questionnaires = library && ["health-li", "health-di", "health-ci", "health-cir"].includes(pageId) ? (["member", "spouse"] as const).map(applicant => ({ applicant, result: configuredHealthQuestionnaire(library.site, pageId, applicant, values ?? {}) })) : [];
  const experience = getActiveClient().applicantExperience;
  const visibleFields = resolveVisibleFields(
    getResolvedFieldsForSite(pageId, site.id).filter(field => {
      if (pageId !== "coverage" || !Object.values(eligibilityFactCollectionFields).includes(field.id)) return true;
      return library?.site.configuration.products.some(product => Array.isArray(values?.coverageSelections) && values.coverageSelections.includes(product.productKey) && product.eligibilityFacts.some(policy => isEligibilityFactRequirements(policy.value) && policy.value.some(requirement => eligibilityFactCollectionFields[requirement.fact] === field.id))) === true;
    }).filter(field => pageId !== "contact" || isContactFieldAvailable(experience, field.id, Array.isArray(values?.coverageSelections) ? values.coverageSelections.map(String) : [])),
    values ?? {},
  );

  const fields = visibleFields.map(field => experience?.eligibleStatesOnly && ["state-province", "state", "business-state", "mailing-state"].includes(field.id) && field.options ? { ...field, options: field.options.filter(o => experience.eligibleStates?.includes(o.value.replace(/^US-/, ""))) } : field);
  if (questionnaires.some(({ result }) => result.status !== "unassigned")) return questionnaires.flatMap(({ applicant, result }) => applicantParticipatesInPage(pageId, applicant, values ?? {}) ? result.status === "unassigned" ? fields.filter(field => field.id.endsWith("-spouse") === (applicant === "spouse")) : result.fields : []);
  if (pageId !== "membership") return fields;

  const siteAssociations = getAssociationsForSite(site.id);
  const associationResolution = resolveActiveAssociationFromApplication(site.id, values);
  const associationMembershipFields = fields.map((field) =>
    resolveAssociationMembershipField(
      field,
      site,
      siteAssociations,
      associationResolution,
    ),
  );

  return associationMembershipFields;
}
