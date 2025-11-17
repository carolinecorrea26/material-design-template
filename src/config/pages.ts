export type PageId =
  | "landing"
  | "eligibility"
  | "coverage"
  | "contact"
  | "profile"
  | "preview"
  | "payment"     // doc = section; expose as page optionally
  | "receipt"
  | "resume";

export interface AppPage {
  id: PageId;
  path: string;
  title: string;
  // optional: feature flags, guards, or section tags
  section?: "application" | "system" | "post-submit";
}

export const PAGES: AppPage[] = [
  { id: "landing",     path: "/",              title: "Landing",        section: "system" },
  { id: "eligibility", path: "/eligibility",   title: "Eligibility",    section: "application" },
  { id: "coverage",    path: "/coverage",      title: "Coverage",       section: "application" },
  { id: "contact",     path: "/contact",       title: "Contact",        section: "application" },
  { id: "profile",     path: "/profile",       title: "Profile",        section: "application" },
  { id: "preview",     path: "/preview",       title: "Review",        section: "application" },
  // If you prefer to keep Payment embedded, comment this out and render it within Preview/Consent as needed.
  { id: "payment",     path: "/payment",       title: "Authorize",      section: "application" },
  { id: "receipt",   path: "/receipt",     title: "Receipt",      section: "post-submit" },
  { id: "resume",      path: "/resume",        title: "Resume",         section: "system" }
];
