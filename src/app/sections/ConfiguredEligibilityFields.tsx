import type { ComponentProps } from "react";
import EligibilityFields, { validateEligibility as validate, type EligibilityValues } from "../../components/forms/EligibilityFields";
import { getSurfaceFields } from "../../config/fields/storedSurfaces";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { getActiveClient } from "../../config/client/getActiveClient";
export function quoteEligibilityPresentation() {
  return { fields: getSurfaceFields("quoteInputs"), eligibleStatesOnly: getActiveClient().applicantExperience?.eligibleStatesOnly, maxAge: getPrototypeLibrary() ? null : 80 };
}
export function validateEligibility(values: EligibilityValues) { return validate(values, quoteEligibilityPresentation()); }
export type { EligibilityValues };
export default function ConfiguredEligibilityFields(props: ComponentProps<typeof EligibilityFields>) {
  return <EligibilityFields {...quoteEligibilityPresentation()} {...props} />;
}
