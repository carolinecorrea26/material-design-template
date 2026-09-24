import type { PageId } from "../types";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import type { CoverageCategoryId } from "./coverages/types";
import { coverageQuestionRequirements } from "./coverageQuestionRequirements";
import { resolvePageParticipation } from "./flowGates";

export { getSelectedCategoryIds } from "./flowGates";

export const formFlow: PageId[] = [
  "membership",
  "eligibility",
  "coverage",
  "beneficiary",
  "contact",
  "profile",
  "review",
  "health-si",
  "health-li",
  "health-qd",
  "health-di",
  "health-cir",
  "payment",
  "docusign",
  "receipt",
];

/** Returns the active form flow. */
export function getResolvedFormFlow(): PageId[] {
  return formFlow;
}

/** Coverage-category IDs that require follow-up questions. */
export const categoriesRequiringQuestions: CoverageCategoryId[] =
  (Object.keys(coverageQuestionRequirements) as CoverageCategoryId[]).filter(
    (categoryId) =>
      (coverageQuestionRequirements[categoryId].self?.length ?? 0) > 0 ||
      (coverageQuestionRequirements[categoryId].spouse?.length ?? 0) > 0,
  );

/** True when a page should be skipped given the current form values. */
export function shouldSkipPage(
  pageId: PageId,
  values: ApplicationFormValues,
): boolean {
  return !resolvePageParticipation(pageId, values);
}

export function isFormPage(pageId: PageId) {
  const flow = getResolvedFormFlow();
  return flow.includes(pageId);
}

export function getNextFormPageId(
  pageId: PageId,
  values?: ApplicationFormValues,
) {
  const flow = getResolvedFormFlow();
  const currentIndex = flow.indexOf(pageId);

  if (currentIndex === -1 || currentIndex === flow.length - 1) {
    return null;
  }

  let nextIndex = currentIndex + 1;

  while (
    values &&
    nextIndex < flow.length &&
    shouldSkipPage(flow[nextIndex], values)
  ) {
    nextIndex++;
  }

  return nextIndex < flow.length ? flow[nextIndex] : null;
}

export function getPreviousFormPageId(
  pageId: PageId,
  values?: ApplicationFormValues,
) {
  const flow = getResolvedFormFlow();
  const currentIndex = flow.indexOf(pageId);

  if (currentIndex <= 0) {
    return null;
  }

  let prevIndex = currentIndex - 1;

  while (values && prevIndex >= 0 && shouldSkipPage(flow[prevIndex], values)) {
    prevIndex--;
  }

  return prevIndex >= 0 ? flow[prevIndex] : null;
}

export function getFormPageIndex(pageId: PageId) {
  const flow = getResolvedFormFlow();
  return flow.indexOf(pageId);
}

export function getActiveFormFlow(values?: ApplicationFormValues): PageId[] {
  const flow = getResolvedFormFlow();
  if (!values) return flow;
  return flow.filter((id) => !shouldSkipPage(id, values));
}

export function getFormProgressPercent(
  pageId: PageId,
  _values?: ApplicationFormValues,
) {
  void _values;
  const flow = getResolvedFormFlow();
  const staticFlowNoReceipt = flow.filter((id) => id !== "receipt");

  if (pageId === "receipt") {
    return 99;
  }

  const currentIndex = staticFlowNoReceipt.indexOf(pageId);

  if (currentIndex === -1) {
    return 0;
  }

  const last = staticFlowNoReceipt.length - 1;
  // Map first page → 1%, last page → 99%.
  return last === 0 ? 1 : 1 + (currentIndex / last) * 98;
}
