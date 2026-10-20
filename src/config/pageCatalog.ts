// Authored defaults are compiled into stored page definitions and Site assignments.
// Runtime consumers use the saved catalog once a Library revision is installed.
export const defaultApplicationOrder = [
  "home", "membership", "eligibility", "coverage", "beneficiary", "contact", "profile", "review",
  "health-si", "health-li", "health-qd", "health-di", "health-cir", "payment", "docusign", "receipt",
] as const;
export type PageFlow = "application" | "resume" | "advisor" | "internal";

const definitions = [
  { id: "home", path: "/", type: "home" },
  {
    id: "membership",
    path: "/membership",
    type: "form",
    groupId: "get-started",
  },
  {
    id: "eligibility",
    path: "/eligibility",
    type: "form",
    groupId: "get-started",
  },
  { id: "coverage", path: "/coverage", type: "form", groupId: "coverage" },
  {
    id: "beneficiary",
    path: "/beneficiary",
    type: "form",
    groupId: "coverage",
  },
  { id: "contact", path: "/contact", type: "form", groupId: "profile" },
  { id: "review", path: "/review", type: "form", groupId: "review" },
  { id: "docusign", path: "/docusign", type: "form", groupId: "review" },
  { id: "health-si", path: "/health-si", type: "form", groupId: "health" },
  { id: "health-li", path: "/health-li", type: "form", groupId: "health" },
  { id: "health-qd", path: "/health-qd", type: "form", groupId: "health" },
  { id: "health-di", path: "/health-di", type: "form", groupId: "health" },
  { id: "health-cir", path: "/health-cir", type: "form", groupId: "health" },
  { id: "payment", path: "/payment", type: "form", groupId: "payment" },
  { id: "receipt", path: "/receipt", type: "receipt" },
  { id: "resume", path: "/resume", type: "resume" },
  { id: "resume-method", path: "/resume-method", type: "resume" },
  { id: "resume-code", path: "/resume-code", type: "resume" },
  { id: "advisor-login", path: "/advisor-login", type: "form" },
  {
    id: "advisor-send-confirmation",
    path: "/advisor-send-confirmation",
    type: "form",
  },
  {
    id: "application-edit-confirmation",
    path: "/application-edit-confirmation",
    type: "form",
  },
  { id: "mock-email-preview", path: "/mock-email-preview", type: "internal" },
  {
    id: "site-features",
    path: "/portal-admin/site-features",
    type: "internal",
  },
  {
    id: "site-details",
    path: "/site-details",
    type: "internal",
  },
  {
    id: "design-system",
    path: "/design-system",
    type: "internal",
  },
  {
    id: "portal-admin",
    path: "/portal-admin",
    type: "internal",
  },
  {
    id: "cms",
    path: "/portal-admin/cms",
    type: "internal",
  },
  {
    id: "portal-template-project",
    path: "/portal-template-project",
    type: "internal",
  },
  {
    id: "portal-requirements-project",
    path: "/portal-requirements-project",
    type: "internal",
  },
  { id: "profile", path: "/profile", type: "form", groupId: "profile" },
] as const;


export const defaultPages = definitions.map(page => ({
  ...page,
  flow: (page.type === "internal" ? "internal" : page.type === "resume" ? "resume"
    : ["advisor-login", "advisor-send-confirmation", "application-edit-confirmation"].includes(page.id) ? "advisor" : "application") as PageFlow,
})).sort((a, b) => {
  const flows: PageFlow[] = ["application", "resume", "advisor", "internal"];
  return flows.indexOf(a.flow) - flows.indexOf(b.flow)
    || (a.flow === "application" ? defaultApplicationOrder.indexOf(a.id as typeof defaultApplicationOrder[number]) - defaultApplicationOrder.indexOf(b.id as typeof defaultApplicationOrder[number]) : 0);
});
