import type { PageId } from "../types";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import type { CoverageCategoryId, CoverageDefinition } from "./coverages/types";
import { getActiveClientCoverages } from "./client/getActiveClientCoverages";
import { getClientPageRequirement } from "./client/getClientPageRequirement";

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
export const categoriesRequiringQuestions: CoverageCategoryId[] = [
  "LI",
  "DI",
  "OO",
];

/**
 * Field IDs for category-level questions keyed by the coverage category
 * that triggers them. Only categories that actually require questions are listed.
 */
export const categoryQuestionFields: Partial<
  Record<CoverageCategoryId, string[]>
> = {
  LI: ["smoker", "tobacco-last-used", "tobacco-products"],
  DI: ["average-monthly-income", "hours-worked-per-week"],
  OO: ["monthly-business-expenses", "business-expense-responsibility"],
};

export const categoryQuestionFieldsSpouse: Partial<
  Record<CoverageCategoryId, string[]>
> = {
  LI: ["spouse-smoker", "spouse-tobacco-last-used", "spouse-tobacco-products"],
  DI: ["spouse-average-monthly-income", "spouse-hours-worked-per-week"],
};

/** Resolve which coverage category IDs the user actually selected. */
export function getSelectedCategoryIds(
  values: ApplicationFormValues,
): CoverageCategoryId[] {
  const selectedIds = Array.isArray(values.coverageSelections)
    ? values.coverageSelections
    : [];

  if (selectedIds.length === 0) return [];

  const coverages = getActiveClientCoverages();
  const categories = new Set<CoverageCategoryId>();

  for (const coverage of coverages) {
    if (selectedIds.includes(coverage.id)) {
      categories.add(coverage.categoryId);
    }
  }

  return [...categories];
}

function getSelectedCoverages(values: ApplicationFormValues) {
  const selectedIds = Array.isArray(values.coverageSelections)
    ? new Set(values.coverageSelections)
    : new Set<string>();

  if (selectedIds.size === 0) {
    return [];
  }

  return getActiveClientCoverages().filter((coverage) =>
    selectedIds.has(coverage.id),
  );
}

function hasSelectedUnderwritingType(
  values: ApplicationFormValues,
  underwritingTypes: string[],
) {
  const underwritingTypeSet = new Set(
    underwritingTypes.map((id) => id.toUpperCase()),
  );

  return getSelectedCoverages(values).some((coverage) =>
    underwritingTypeSet.has(coverage.underwritingType.toUpperCase()),
  );
}

function hasSelectedCirRider(values: ApplicationFormValues): boolean {
  const riders =
    values.coverageRiders != null &&
    typeof values.coverageRiders === "object" &&
    !Array.isArray(values.coverageRiders)
      ? (values.coverageRiders as Record<string, boolean>)
      : {};

  return Object.entries(riders).some(
    ([key, enabled]) => enabled && key.includes(":cir:"),
  );
}

/**
 * Coverage-level mirror of shouldSkipPage's health-* branches: true when
 * selecting this single coverage (with its CIR rider enabled, for
 * health-cir) would be enough to unlock the given page. Used to find a
 * coverage (possibly from a different client's catalog) that can satisfy a
 * gated page, rather than checking only the currently active client.
 */
export function coverageUnlocksPage(
  pageId: PageId,
  coverage: CoverageDefinition,
): boolean {
  switch (pageId) {
    case "health-si":
      return coverage.underwritingType === "SI";
    case "health-qd":
      return coverage.underwritingType === "QD";
    case "health-li":
      return (
        coverage.categoryId === "LI" && coverage.underwritingType === "TELE"
      );
    case "health-di":
      return (
        coverage.categoryId === "DI" && coverage.underwritingType === "TELE"
      );
    case "health-cir":
      return Boolean(coverage.riders?.some((r) => r.id === "cir"));
    default:
      return false;
  }
}

/** True when a page should be skipped given the current form values. */
export function shouldSkipPage(
  pageId: PageId,
  values: ApplicationFormValues,
): boolean {
  if (getClientPageRequirement(pageId) === "none") {
    return true;
  }

  if (pageId === "beneficiary") {
    const selectedCategories = getSelectedCategoryIds(values);
    return !selectedCategories.some((cat) => cat === "LI" || cat === "AD");
  }

  if (pageId === "health-si") {
    return !hasSelectedUnderwritingType(values, ["SI"]);
  }

  if (pageId === "health-li") {
    // Show when LI coverage with underwriting type TELE is selected
    const selectedCoverages = getSelectedCoverages(values);
    return !selectedCoverages.some(
      (c) => c.categoryId === "LI" && c.underwritingType === "TELE",
    );
  }

  if (pageId === "health-qd") {
    return !hasSelectedUnderwritingType(values, ["QD"]);
  }

  if (pageId === "health-di") {
    // Show when DI coverage with underwriting type TELE is selected
    const selectedCoverages = getSelectedCoverages(values);
    return !selectedCoverages.some(
      (c) => c.categoryId === "DI" && c.underwritingType === "TELE",
    );
  }

  if (pageId === "health-cir") {
    return !hasSelectedCirRider(values);
  }

  return false;
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
