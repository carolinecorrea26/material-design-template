import { getContent, resolveTemplate } from "../content";

export const pages = [
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
  { id: "health-qd", path: "/health-qd", type: "form", groupId: "health" },
  { id: "health-di", path: "/health-di", type: "form", groupId: "health" },
  { id: "health-cir", path: "/health-cir", type: "form", groupId: "health" },
  { id: "payment", path: "/payment", type: "form", groupId: "payment" },
  { id: "receipt", path: "/receipt", type: "receipt" },
  { id: "resume", path: "/resume", type: "resume" },
  { id: "resume-code", path: "/resume-code", type: "resume" },
  { id: "advisor-login", path: "/advisor-login", type: "form" },
  {
    id: "advisor-send-confirmation",
    path: "/advisor-send-confirmation",
    type: "form",
  },
  { id: "mock-email-preview", path: "/mock-email-preview", type: "receipt" },
  {
    id: "information-architecture",
    path: "/information-architecture",
    type: "internal",
  },
  { id: "profile", path: "/profile", type: "form", groupId: "profile" },
] as const;

export type PageType = "home" | "form" | "receipt" | "resume" | "internal";

export function getPagePath(id: (typeof pages)[number]["id"]) {
  const page = pages.find((page) => page.id === id);

  if (!page) {
    throw new Error(`Missing page path for page id: ${id}`);
  }

  return page.path;
}

export function getPageTitle(id: (typeof pages)[number]["id"]) {
  const contentPage = getContent().pages[id];
  if (contentPage?.title) return resolveTemplate(contentPage.title);

  return id;
}

export function getPageSubhead(id: (typeof pages)[number]["id"]) {
  const contentPage = getContent().pages[id];
  if (contentPage?.subhead) return resolveTemplate(contentPage.subhead);

  return undefined;
}

export function getPageNavTitle(id: (typeof pages)[number]["id"]) {
  const contentPage = getContent().pages[id];
  if (contentPage?.navTitle) return resolveTemplate(contentPage.navTitle);

  return id;
}
