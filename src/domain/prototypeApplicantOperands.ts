import { numericFact } from "../utils/applicantFacts";
import type { PrototypeLibrary } from "./prototypeLibrary";
import type { CoverageApplicantId } from "./coverage";

/** Read the Site-owned form mapping before the product/applicant fallback field. */
export function prototypeApplicantOperand(library: PrototypeLibrary, productKey: string, applicant: CoverageApplicantId, values: Record<string, unknown>, name: string) {
  const source = library.client.applicantExperience?.factSources?.[name];
  if (source) {
    if ('value' in source) return source.value;
    const number = numericFact(values[source.field]);
    return number === undefined ? undefined : number / source.divisor;
  }
  const mapping = library.client.applicantExperience?.factMappings?.[name];
  return mapping ? mapping.values[String(values[mapping.field])] : values[`prototype-fact:${productKey}:${applicant}:${name}`];
}
