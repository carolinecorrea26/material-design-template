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
): boolean {
  return target.visibilityConditionId
    ? evaluateConditionDefinition(target.visibilityConditionId, values)
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
  return fields.filter((field) => resolveVisibilityCondition(field, values));
}
