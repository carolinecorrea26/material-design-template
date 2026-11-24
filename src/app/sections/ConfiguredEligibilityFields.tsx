import type { ComponentProps } from "react";
import EligibilityFields, { validateEligibility as validate, type EligibilityValues } from "../../components/forms/EligibilityFields";
import { getSurfaceFields } from "../../config/fields/storedSurfaces";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { getActiveClient } from "../../config/client/getActiveClient";
import { filterEligibleStateOptions } from "../../domain/applicantExperience";
import { withRequirementFields } from "../../domain/requirementFields";
import { quoteFollowUps } from "../workflows/quoteFollowUps";
import { resolveSiteId } from "../../data/activeSite";
/** Installed pages and detached examples consume the same compiled field surface. */
export function quoteEligibilityPresentation(library = getPrototypeLibrary()) {
  const experience = (library?.client ?? getActiveClient()).applicantExperience;
  const surface = library?.fieldSurfaces.quoteInputs;
  if (library && !surface) throw new Error('Missing stored field surface: quoteInputs');
  const fields = surface
    ? surface.mapping.fields.map(field => ({ ...field, id: surface.mapping.fieldToKey[field.id] }))
    : withRequirementFields(getSurfaceFields("quoteInputs"), { component: "quote-calculator" }, resolveSiteId(), quoteFollowUps);
  return { fields: fields.map(field => filterEligibleStateOptions(field, experience)), eligibleStatesOnly: experience?.eligibleStatesOnly, maxAge: library ? null : 80 };
}
export function validateEligibility(values: EligibilityValues) { return validate(values, quoteEligibilityPresentation()); }
export type { EligibilityValues };
export default function ConfiguredEligibilityFields(props: ComponentProps<typeof EligibilityFields>) {
  return <EligibilityFields {...quoteEligibilityPresentation()} {...props} />;
}
