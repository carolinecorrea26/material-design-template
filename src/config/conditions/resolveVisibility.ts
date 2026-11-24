import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { FieldDefinition } from "../fields/types";
import { getPageSections } from "../pageSections/getPageSections";
import type { PageId } from "../../types";
import { evaluateConditionDefinition } from "./evaluateConditions";
import type { ConditionId } from "./types";

export type VisibilityConditionTarget = {
  visibilityConditionId?: ConditionId;
};

/** Resolves the canonical WHEN referenced by a Field or PageSection target. */
export function resolveVisibilityCondition(
  target: VisibilityConditionTarget,
  values: ApplicationFormValues,
  fields?: FieldDefinition[],
): boolean {
  return target.visibilityConditionId
    ? evaluateConditionDefinition(target.visibilityConditionId, values, fields)
    : true;
}

export function resolveVisiblePageSections(
  pageId: PageId,
  values: ApplicationFormValues,
) {
  return getPageSections(pageId).filter((section) =>
    resolveVisibilityCondition(section, values),
  );
}

export function resolveVisibleFields<T extends FieldDefinition>(
  fields: T[],
  values: ApplicationFormValues,
): T[] {
  return filterFieldsByVisibilityDependencies(fields.filter((field) => resolveVisibilityCondition(field, values, fields))).map(field => {
    const excluded = new Set((field.optionExclusions ?? []).filter(rule => evaluateConditionDefinition(rule.conditionId, values, fields)).flatMap(rule => rule.values));
    return excluded.size === 0 ? field : { ...field, options: field.options?.filter(option => !excluded.has(option.value)) };
  });
}

/** Resolve transitive availability without changing retained saved answers. */
export function filterFieldsByVisibilityDependencies<T extends FieldDefinition>(fields: T[]): T[] {
  let available = fields;
  while (true) {
    const ids = new Set(available.map(field => field.id));
    const next = available.filter(field => !field.visibilityDependencies?.some(id => !ids.has(id)));
    if (next.length === available.length) return available;
    available = next;
  }
}
