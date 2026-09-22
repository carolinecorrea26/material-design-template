import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { SectionVisibilityRule } from "./types";

/**
 * Evaluates a set of visibility rules (equals/notEquals/includes) against
 * form values. Extracted from RoutePage.tsx's isSectionVisible so the same
 * rule language can gate more than just pageSections — e.g. a client's
 * conditionally-visible extra fields (ClientPageFieldConfig.extraFields).
 */
export function evaluateVisibilityRules(
  rules: SectionVisibilityRule[] | undefined,
  values: ApplicationFormValues,
): boolean {
  if (!rules || rules.length === 0) return true;

  return rules.every((rule) => {
    const value = values[rule.fieldId];

    if ("equals" in rule) return value === rule.equals;
    if ("notEquals" in rule) return value !== rule.notEquals;
    if ("includes" in rule) {
      return Array.isArray(value) && value.includes(rule.includes);
    }

    return true;
  });
}
