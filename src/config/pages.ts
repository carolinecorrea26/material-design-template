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
  | "profile"
  | "healthHistory"
  | "preview"
  | "consent"
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
    title: "Beneficiary",
    section: "application",
  },
  { id: "contact", path: "/contact", title: "Contact", section: "application" },
  { id: "profile", path: "/profile", title: "Profile", section: "application" },
  {
    id: "healthHistory",
    path: "/health-history",
    title: "Health",
    section: "application",
  },
  { id: "preview", path: "/preview", title: "Review", section: "application" },
  {
    id: "consent",
    path: "/consent",
    title: "Authorize",
    section: "application",
  },
  { id: "docusign", path: "/docusign", title: "Sign", section: "post-submit" },
  { id: "receipt", path: "/receipt", title: "Receipt", section: "post-submit" },
  { id: "resume", path: "/resume", title: "Resume", section: "system" },
];
