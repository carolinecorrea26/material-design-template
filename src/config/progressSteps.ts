import type { PageId } from "../types/page";
import {
  HowToReg,
  HealthAndSafety,
  Badge,
  FactCheck,
  Draw,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";
import type { ApplicationFormValues } from "../state/ApplicationFormContext";
import { shouldSkipPage } from "./formFlow";
import { isCombinedFlow } from "./testFlow";

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

const expandedProgressSteps: ProgressStep[] = [
  {
    id: "getting-started",
    label: "Eligibility",
    icon: HowToReg,
    pageIds: ["membership", "eligibility"],
  },
  {
    id: "coverage-options",
    label: "Coverage",
    icon: HealthAndSafety,
    pageIds: ["coverage", "coverage-questions", "coverage-options"],
  },
  {
    id: "about-applicant",
    label: "Profile",
    icon: Badge,
    pageIds: ["beneficiary", "contact", "personal", "financial"],
  },
  {
    id: "application-review",
    label: "Review",
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
    label: "E-sign",
    icon: Draw,
    pageIds: ["docusign"],
  },
];

const combinedProgressSteps: ProgressStep[] = [
  {
    id: "getting-started",
    label: "Eligibility",
    icon: HowToReg,
    pageIds: ["membership", "eligibility"],
  },
  {
    id: "coverage-options",
    label: "Coverage",
    icon: HealthAndSafety,
    pageIds: ["coverage-combined"],
  },
  {
    id: "about-applicant",
    label: "Profile",
    icon: Badge,
    pageIds: ["beneficiary", "contact", "about-applicant"],
  },
  {
    id: "application-review",
    label: "Review",
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
    label: "E-sign",
    icon: Draw,
    pageIds: ["docusign"],
  },
];

export const progressSteps: ProgressStep[] = expandedProgressSteps;

function getResolvedProgressSteps(): ProgressStep[] {
  return isCombinedFlow() ? combinedProgressSteps : expandedProgressSteps;
}

export function getProgressStepIndex(pageId: PageId) {
  const steps = getResolvedProgressSteps();
  return steps.findIndex((step) => step.pageIds.includes(pageId));
}

/**
 * Returns progress steps with skipped pages removed.
 * Steps that end up with no active pages are excluded entirely.
 */
export function getActiveProgressSteps(
  values: ApplicationFormValues,
): ProgressStep[] {
  const steps = getResolvedProgressSteps();
  return steps
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
