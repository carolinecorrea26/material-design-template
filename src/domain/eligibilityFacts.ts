/** Supported boolean eligibility operands. Policies own the required answer. */
export type BooleanEligibilityFact = "activeMilitary" | "activelyAtWork" | "associationMember";
export type EligibilityFactRequirement = { fact: BooleanEligibilityFact; equals: boolean }
  | { fact: "honorablyDischargedServiceMember"; extendsMaximumAgeTo: number }
  | { fact: "firmMemberCount"; minimum: number; maximum: number; integer: true };

export function isEligibilityFactRequirements(value: unknown): value is EligibilityFactRequirement[] {
  return Array.isArray(value) && value.length > 0 && value.every(row => row && typeof row === "object"
    && (["activeMilitary", "activelyAtWork", "associationMember"].includes(row.fact) && typeof row.equals === "boolean" && Object.keys(row).length === 2
      || row.fact === "honorablyDischargedServiceMember" && Number.isSafeInteger(row.extendsMaximumAgeTo) && row.extendsMaximumAgeTo >= 0 && Object.keys(row).length === 2
      || row.fact === "firmMemberCount" && typeof row.minimum === "number" && Number.isFinite(row.minimum) && Number.isInteger(row.minimum) && row.minimum >= 0
      && typeof row.maximum === "number" && Number.isFinite(row.maximum) && Number.isInteger(row.maximum) && row.maximum >= row.minimum && row.integer === true && Object.keys(row).length === 4))
    && new Set(value.map(row => row.fact)).size === value.length;
}

/** Undefined means missing or malformed evidence, never assumed eligibility. */
export function eligibilityFactSatisfied(requirement: EligibilityFactRequirement, value: unknown): boolean | undefined {
  if ("extendsMaximumAgeTo" in requirement) throw new Error("Age extension requires the age eligibility evaluator");
  if ("equals" in requirement) return typeof value === "boolean" ? value === requirement.equals : undefined;
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value)
    ? value >= requirement.minimum && value <= requirement.maximum : undefined;
}

/** Shared collection mapping; applicability remains on native product assignments. */
export const eligibilityFactCollectionFields: Partial<Record<EligibilityFactRequirement["fact"], string>> = { firmMemberCount: "firm-member-count" };

/** Extensions only request their evidence above the ordinary upper bound. */
export function eligibilityAgeMaximumSatisfied(age: number | undefined, maximum: number, requirements: EligibilityFactRequirement[], facts: { honorablyDischargedServiceMember?: boolean }): boolean | undefined {
  if (age === undefined || !Number.isSafeInteger(age) || age < 0) return undefined;
  if (age <= maximum) return true;
  const extensions = requirements.filter(rule => "extendsMaximumAgeTo" in rule && age <= rule.extendsMaximumAgeTo);
  if (!extensions.length) return false;
  return typeof facts.honorablyDischargedServiceMember === "boolean" ? facts.honorablyDischargedServiceMember : undefined;
}
