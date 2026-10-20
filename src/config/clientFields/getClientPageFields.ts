import { isContactFieldAvailable } from "../../domain/applicantExperience";
import { getActiveClient } from "../client/getActiveClient";
import type { PageId } from "../../types";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { FieldDefinition } from "../fields/types";
import { resolveVisibleFields } from "../conditions";
import { getResolvedFieldsForSite } from "../fields/resolvedFieldRegistry";
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
  const experience = getActiveClient().applicantExperience;
  const visibleFields = resolveVisibleFields(
    getResolvedFieldsForSite(pageId, site.id).filter(field => pageId !== "contact" || isContactFieldAvailable(experience, field.id)),
    values ?? {},
  );

  const fields = visibleFields.map(field => experience?.eligibleStatesOnly && ["state-province", "state", "business-state", "mailing-state"].includes(field.id) && field.options ? { ...field, options: field.options.filter(o => experience.eligibleStates?.includes(o.value.replace(/^US-/, ""))) } : field);
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
