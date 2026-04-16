import type { PageId } from "../types/page";
import {
  HowToReg,
  HealthAndSafety,
  Badge,
  FactCheck,
  Draw,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";

export type ProgressStep = {
  id: string;
  label: string;
  pageIds: PageId[];
  icon: SvgIconComponent;
};

export const progressSteps: ProgressStep[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: HowToReg,
    pageIds: ["membership", "eligibility"],
  },
  {
    id: "coverage-options",
    label: "Coverage Options",
    icon: HealthAndSafety,
    pageIds: ["coverage", "coverage-questions", "coverage-options"],
  },
  {
    id: "about-applicant",
    label: "About Applicant",
    icon: Badge,
    pageIds: ["beneficiary", "contact", "personal", "financial"],
  },
  {
    id: "application-review",
    label: "Application Review",
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
    label: "E-sign and Submit",
    icon: Draw,
    pageIds: ["docusign"],
  },
];

export function getProgressStepIndex(pageId: PageId) {
  return progressSteps.findIndex((step) => step.pageIds.includes(pageId));
}
