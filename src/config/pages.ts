export type PageId =
  | "landing"
  | "membership"
  | "eligibility"
  | "addCoverage"
  | "coverageQuestions"
  | "coverageOptions"
  | "beneficiary"
  | "getStarted"
  | "contact"
  | "personalInformation"
  | "financialInformation"
  | "applicationReview"
  | "healthInformationSI"
  | "healthInformationQD"
  | "healthInformationDisability"
  | "healthInformationCIR"
  | "paymentInformation"
  | "decision"
  | "docusign"
  | "receipt"
  | "resume";

export interface AppPage {
  id: PageId;
  path: string;
  title: string;
  // optional: feature flags, guards, or section tags
  section?: "application" | "system" | "post-submit";
  /** Feature flag key to check if page should be shown */
  requiresFeature?: keyof import("./clients").ClientFeatures;
}

export const PAGES: AppPage[] = [
  { id: "landing", path: "/", title: "Landing", section: "system" },
  {
    id: "getStarted",
    path: "/get-started",
    title: "Get Started",
    section: "application",
  },
  {
    id: "membership",
    path: "/membership",
    title: "Membership",
    section: "application",
  },
  {
    id: "eligibility",
    path: "/eligibility",
    title: "Check Eligibility",
    section: "application",
  },
  {
    id: "addCoverage",
    path: "/add-coverage",
    title: "Add Coverage",
    section: "application",
  },
  {
    id: "coverageQuestions",
    path: "/coverage-questions",
    title: "Coverage Questions",
    section: "application",
  },
  {
    id: "coverageOptions",
    path: "/coverage-options",
    title: "Coverage Options",
    section: "application",
  },
  {
    id: "beneficiary",
    path: "/beneficiary",
    title: "Add Beneficiary",
    section: "application",
  },
  {
    id: "contact",
    path: "/contact",
    title: "Contact Information",
    section: "application",
  },
  {
    id: "personalInformation",
    path: "/personal-information",
    title: "Personal Information",
    section: "application",
  },
  {
    id: "financialInformation",
    path: "/financial-information",
    title: "Financial Information",
    section: "application",
  },
  {
    id: "applicationReview",
    path: "/application-review",
    title: "Application Review",
    section: "application",
  },
  { id: "docusign", path: "/docusign", title: "Sign", section: "application" },
  {
    id: "healthInformationSI",
    path: "/health-information",
    title: "Health Information (Simplified Issue)",
    section: "application",
  },
  {
    id: "healthInformationQD",
    path: "/health-information-quickdecision",
    title: "Health Information (quickdecisionSM)",
    section: "application",
  },
  {
    id: "healthInformationDisability",
    path: "/health-information-disability",
    title: "Health Information (Disability)",
    section: "application",
  },
  {
    id: "healthInformationCIR",
    path: "/health-information-chronic-illness-rider",
    title: "Health Information (Chronic Illness Rider)",
    section: "application",
  },
  {
    id: "decision",
    path: "/decision",
    title: "Application Decision",
    section: "application",
  },
  {
    id: "paymentInformation",
    path: "/payment-information",
    title: "Payment Information",
    section: "application",
  },
  { id: "receipt", path: "/receipt", title: "Receipt", section: "post-submit" },
  { id: "resume", path: "/resume", title: "Resume", section: "system" },
];
