import type { PageId } from "../types";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import { getResolvedFormFlow, shouldSkipPage } from "./formFlow";
import { getContent } from "../content";

export type ProgressStep = {
  id: string;
  label: string;
  pageIds: PageId[];
};

/** Pages that belong to the consolidated "Health" breadcrumb */
export const HEALTH_PAGE_IDS: PageId[] = [
  "health-si",
  "health-li",
  "health-qd",
  "health-di",
  "health-ci", "health-cir",
];

export const progressSteps: ProgressStep[] = (() => {
  const labels = getContent().navigation.progressStepLabels;
  return [
    {
      id: "getting-started",
      label: labels["getting-started"] ?? "Eligibility",
      pageIds: ["membership", "eligibility"],
    },
    {
      id: "coverage-options",
      label: labels["coverage-options"] ?? "Coverage",
      pageIds: ["coverage"],
    },
    {
      id: "profile",
      label: labels["profile"] ?? "Profile",
      pageIds: ["beneficiary", "contact", "profile"],
    },
    {
      id: "application-review",
      label: labels["application-review"] ?? "Review",
      pageIds: [
        "review",
        "health-si",
        "health-li",
        "health-qd",
        "health-di",
        "health-ci", "health-cir",
        "payment",
      ],
    },
    {
      id: "esign-submit",
      label: labels["esign-submit"] ?? "E-sign",
      pageIds: ["docusign"],
    },
  ];
})();

export function getProgressStepIndex(pageId: PageId) {
  return progressSteps.findIndex((step) => step.pageIds.includes(pageId));
}

/**
 * Returns progress steps with skipped pages removed.
 * Steps that end up with no active pages are excluded entirely.
 */
export function getActiveProgressSteps(
  values: ApplicationFormValues,
  currentPageId?: PageId,
): ProgressStep[] {
  const journey = getResolvedFormFlow();
  return progressSteps
    .map((step) => ({
      ...step,
      pageIds: step.pageIds.filter(id => journey.includes(id) && (id === currentPageId || !shouldSkipPage(id, values))).sort((a, b) => journey.indexOf(a) - journey.indexOf(b)),
    }))
    .filter((step) => step.pageIds.length > 0)
    .sort((a, b) => journey.indexOf(a.pageIds[0]) - journey.indexOf(b.pageIds[0]));
}

/**
 * Returns the index of the active step within filtered progress steps.
 */
export function getActiveProgressStepIndex(
  pageId: PageId,
  values: ApplicationFormValues,
): number {
  const activeSteps = getActiveProgressSteps(values, pageId);
  return activeSteps.findIndex((step) => step.pageIds.includes(pageId));
}
