export type PageId =
  | "landing"
  | "membership"
  | "eligibility"
  | "coverage"
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
  requiresFeature?: keyof import('./clients').ClientFeatures;
}

export const PAGES: AppPage[] = [
  { id: "landing",     path: "/",              title: "Landing",        section: "system" },
  { id: "membership",  path: "/membership",    title: "Membership",     section: "application" },
  { id: "eligibility", path: "/eligibility",   title: "Eligibility",    section: "application" },
  { id: "coverage",    path: "/coverage",      title: "Coverage",       section: "application" },
  { id: "contact",     path: "/contact",       title: "Contact",        section: "application" },
  { id: "profile",     path: "/profile",       title: "Profile",        section: "application" },
  { id: "healthHistory", path: "/health-history", title: "Health",     section: "application" },
  { id: "preview",     path: "/preview",      title: "Review",         section: "application" },
  { id: "consent",     path: "/consent",      title: "Authorize",      section: "application" },
  { id: "docusign",    path: "/docusign",     title: "Sign",           section: "post-submit" },
  { id: "receipt",     path: "/receipt",      title: "Receipt",        section: "post-submit" },
  { id: "resume",      path: "/resume",        title: "Resume",         section: "system" }
];
