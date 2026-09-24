import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { ApplicationTransitionDefinition, OverwritePolicy } from "./types";

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function shouldWrite(
  currentValue: unknown,
  sourceValue: unknown,
  overwrite: OverwritePolicy = "always",
): boolean {
  if (isEmpty(sourceValue)) return false;
  return overwrite === "always" || isEmpty(currentValue);
}

export function executeApplicationTransition<
  Source extends Record<string, unknown>,
>(
  definition: ApplicationTransitionDefinition<Source>,
  source: Source,
  currentValues: ApplicationFormValues = {},
): ApplicationFormValues {
  const result: ApplicationFormValues = { ...currentValues };

  for (const mapping of definition.fieldMappings) {
    if (mapping.include && !mapping.include(source)) continue;
    const value = source[mapping.source];
    if (shouldWrite(result[mapping.targetFieldId], value, mapping.overwrite)) {
      result[mapping.targetFieldId] = value as ApplicationFormValues[string];
    }
  }

  for (const mapping of definition.structuredMappings ?? []) {
    const value = mapping.resolve(source);
    if (shouldWrite(result[mapping.target], value, mapping.overwrite)) {
      result[mapping.target] = value;
    }
  }

  return result;
}
