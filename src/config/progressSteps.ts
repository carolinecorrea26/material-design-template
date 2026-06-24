import type { PageId } from "../types";
import {
  HowToReg,
  HealthAndSafety,
  Badge,
  FactCheck,
  Draw,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import { shouldSkipPage } from "./formFlow";
import { getContent } from "../content";

export type ProgressStep = {
  id: string;
  label: string;
  pageIds: PageId[];
  icon: SvgIconComponent;
};

/** Pages that belong to the consolidated "Health" breadcrumb */
export const HEALTH_PAGE_IDS: PageId[] = [
  "health-si",
  "health-qd",
  "health-di",
  "health-cir",
];

const progressSteps: ProgressStep[] = (() => {
  const labels = getContent().navigation.progressStepLabels;
  return [
    {
      id: "getting-started",
      label: labels["getting-started"] ?? "Eligibility",
      icon: HowToReg,
      pageIds: ["membership", "eligibility"],
    },
    {
      id: "coverage-options",
      label: labels["coverage-options"] ?? "Coverage",
      icon: HealthAndSafety,
      pageIds: ["coverage"],
    },
    {
      id: "profile",
      label: labels["profile"] ?? "Profile",
      icon: Badge,
      pageIds: ["beneficiary", "contact", "profile"],
    },
    {
      id: "application-review",
      label: labels["application-review"] ?? "Review",
      icon: FactCheck,
      pageIds: [
        "review",
        "health-si",
        "health-qd",
        "health-di",
        "health-cir",
        "payment",
      ],
    },
    {
      id: "esign-submit",
      label: labels["esign-submit"] ?? "E-sign",
      icon: Draw,
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
): ProgressStep[] {
  return progressSteps
    .map((step) => ({
      ...step,
      pageIds: step.pageIds.filter((id) => !shouldSkipPage(id, values)),
    }))
    .filter((step) => step.pageIds.length > 0);
}

/**
 * Returns the index of the active step within filtered progress steps.
 */
export function getActiveProgressStepIndex(
  pageId: PageId,
  values: ApplicationFormValues,
): number {
  const activeSteps = getActiveProgressSteps(values);
  return activeSteps.findIndex((step) => step.pageIds.includes(pageId));
}
