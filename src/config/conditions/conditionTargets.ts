import {
  getResolvedFieldRegistry,
  type ResolvedFieldRegistration,
} from "../fields/resolvedFieldRegistry";
import { pageSections } from "../pageSections/pageSections";
import type { FieldId } from "../fields/types";
import type { PageSectionId } from "../pageSections/types";
import type { ApplicantSectionId } from "../formSectionTitle";
import type { PageId } from "../../types";
import type { SiteId } from "../../data/model";
import type { ConditionId } from "./types";

export type ConditionVisibilityTarget =
  | {
      type: "show-section";
      pageId: PageId;
      sectionId: PageSectionId;
      applicant?: ApplicantSectionId;
    }
  | {
      type: "show-fields";
      siteId: SiteId;
      pageId: PageId;
      fieldIds: FieldId[];
    };

/**
 * Derives WHERE a predicate is used. ConditionDefinitions intentionally own
 * only WHEN; executable targets own the visibilityConditionId relationship.
 */
export function getConditionVisibilityTargets(
  conditionId: ConditionId,
  fieldRegistry: ResolvedFieldRegistration[] = getResolvedFieldRegistry(),
): ConditionVisibilityTarget[] {
  const sectionTargets: ConditionVisibilityTarget[] = Object.values(pageSections)
    .flatMap((sections) => sections ?? [])
    .filter((section) => section.visibilityConditionId === conditionId)
    .map((section) => ({
      type: "show-section" as const,
      pageId: section.pageId,
      sectionId: section.id,
      ...(section.applicant ? { applicant: section.applicant } : {}),
    }));

  const fieldsBySiteAndPage = new Map<string, ResolvedFieldRegistration[]>();
  for (const registration of fieldRegistry) {
    if (registration.field.visibilityConditionId !== conditionId) continue;
    const key = `${registration.siteId}\u0000${registration.pageId}`;
    fieldsBySiteAndPage.set(key, [
      ...(fieldsBySiteAndPage.get(key) ?? []),
      registration,
    ]);
  }
  const fieldTargets: ConditionVisibilityTarget[] = [...fieldsBySiteAndPage.values()].map(
    (registrations) => ({
      type: "show-fields" as const,
      siteId: registrations[0].siteId,
      pageId: registrations[0].pageId,
      fieldIds: registrations.map((registration) => registration.fieldId),
    }),
  );

  return [...sectionTargets, ...fieldTargets];
}

export function formatConditionVisibilityTargets(conditionId: ConditionId): string {
  const targets = getConditionVisibilityTargets(conditionId);
  if (targets.length === 0) return "No visibility target";
  return targets
    .map((target) =>
      target.type === "show-section"
        ? `show-section ${target.pageId}.${target.sectionId}${target.applicant ? ` (${target.applicant})` : ""}`
        : `show-fields ${target.siteId}.${target.pageId}: ${target.fieldIds.join(", ")}`,
    )
    .join("; ");
}
