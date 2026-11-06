import type { ComponentProps } from "react";
import EligibilityFields, { validateEligibility as validate, type EligibilityValues } from "../../components/forms/EligibilityFields";
import { getSurfaceFields } from "../../config/fields/storedSurfaces";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { getActiveClient } from "../../config/client/getActiveClient";
import { filterEligibleStateOptions } from "../../domain/applicantExperience";
import { withRequirementFields } from "../../domain/requirementFields";
import { quoteFollowUps } from "../workflows/quoteFollowUps";
import { resolveSiteId } from "../../data/activeSite";
export function quoteEligibilityPresentation() {
  const experience = getActiveClient().applicantExperience;
  return { fields: withRequirementFields(getSurfaceFields("quoteInputs"), { component: "quote-calculator" }, resolveSiteId(), quoteFollowUps).map(field => filterEligibleStateOptions(field, experience)), eligibleStatesOnly: experience?.eligibleStatesOnly, maxAge: getPrototypeLibrary() ? null : 80 };
}
export function validateEligibility(values: EligibilityValues) { return validate(values, quoteEligibilityPresentation()); }
export type { EligibilityValues };
export default function ConfiguredEligibilityFields(props: ComponentProps<typeof EligibilityFields>) {
  return <EligibilityFields {...quoteEligibilityPresentation()} {...props} />;
}
