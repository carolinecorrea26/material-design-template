import { getActiveClient } from "../client/getActiveClient";

const clientAcronym = getActiveClient().branding.acronym;

export const STEP_LABELS: Record<string, string> = {
  "getting-started": "Getting started",
  "coverage-options": "Choose your coverage",
  "about-applicant": "Your application profile",
  "application-review": "Review your application",
  "esign-submit": "E-sign and submit",
};

export const pages = [
  { id: "home", path: "/", type: "home", title: "Home", navTitle: "Home" },
  {
    id: "membership",
    path: "/membership",
    type: "form",
    title: "Start your insurance application",
    subhead: `This application is for ${clientAcronym}-sponsored group insurance.`,
    navTitle: "Start",
    groupId: "get-started",
  },
  {
    id: "eligibility",
    path: "/eligibility",
    type: "form",
    title: "Check your eligibility",
    subhead:
      "Answer a few questions to confirm which coverage options are available to you.",
    navTitle: "Check eligibility",
    groupId: "get-started",
  },
  {
    id: "coverage",
    path: "/coverage",
    type: "form",
    title: "Choose your coverage",
    subhead:
      "Explore the coverage options available to you based on your eligibility.",
    navTitle: "Add coverage",
    groupId: "coverage",
  },
  {
    id: "coverage-questions",
    path: "/coverage-questions",
    type: "form",
    title: "Some follow-up questions",
    subhead: "We need a few more details based on the coverage you selected.",
    navTitle: "Follow-up questions",
    groupId: "coverage",
  },
  {
    id: "coverage-options",
    path: "/coverage-options",
    type: "form",
    title: "Customize your coverage",
    subhead:
      "Tailor your coverage to enhance your protection based on your needs.",
    navTitle: "Customize coverage",
    groupId: "coverage",
  },
  {
    id: "beneficiary",
    path: "/beneficiary",
    type: "form",
    title: "Add your beneficiaries",
    subhead: "Tell us who should receive benefits if a claim is paid.",
    navTitle: "Beneficiary",
    groupId: "coverage",
  },
  {
    id: "contact",
    path: "/contact",
    type: "form",
    title: "Your preferred contact",
    subhead: "Provide the best way for us to reach you about your application.",
    navTitle: "Contact",
    groupId: "profile",
  },
  {
    id: "personal",
    path: "/personal",
    type: "form",
    title: "About you",
    subhead: "Share the personal details needed to complete your application.",
    navTitle: "Personal information",
    groupId: "profile",
  },
  {
    id: "financial",
    path: "/financial",
    type: "form",
    title: "Your financial information",
    subhead:
      "Provide income and financial details required for your selected coverage.",
    navTitle: "Financial information",
    groupId: "profile",
  },
  {
    id: "review",
    path: "/review",
    type: "form",
    title: "Review your application",
    subhead: "Check your answers before submitting your application.",
    navTitle: "Review",
    groupId: "review",
  },
  {
    id: "docusign",
    path: "/docusign",
    type: "form",
    title: "Review and sign your application.",
    subhead: "Review and sign your application documents electronically.",
    navTitle: "E-sign",
    groupId: "review",
  },
  {
    id: "health-si",
    path: "/health-si",
    type: "form",
    title:
      "Please answer the following health questions to the best of your ability.",
    subhead: "Answer health questions required for your selected coverage.",
    navTitle: "Health",
    groupId: "health",
  },
  {
    id: "health-qd",
    path: "/health-qd",
    type: "form",
    title: "About your health",
    subhead: "Answer health questions required for your selected coverage.",
    navTitle: "Health",
    groupId: "health",
  },
  {
    id: "health-di",
    path: "/health-di",
    type: "form",
    title: "About your health",
    subhead: "Answer health questions required for your selected coverage.",
    navTitle: "Health",
    groupId: "health",
  },
  {
    id: "health-cir",
    path: "/health-cir",
    type: "form",
    title: "About your health",
    subhead: "Answer health questions required for your selected coverage.",
    navTitle: "Health",
    groupId: "health",
  },
  {
    id: "payment",
    path: "/payment",
    type: "form",
    title: "Choose your payment method",
    subhead: "Select how you would like to pay for your coverage.",
    navTitle: "Payment",
    groupId: "payment",
  },
  {
    id: "receipt",
    path: "/receipt",
    type: "receipt",
    title: "Your application has been submitted!",
    subhead:
      "Your application has been received, and we'll guide you through any next steps.",
    navTitle: "Receipt",
  },
  {
    id: "resume",
    path: "/resume",
    type: "resume",
    title: "Already started an application?",
    subhead: "Enter your information to continue a saved application.",
    navTitle: "Resume application",
  },
  {
    id: "advisor-login",
    path: "/advisor-login",
    type: "form",
    title: "Advisor Login",
    subhead:
      "Enter your advisor code to start or resume an application for a client.",
    navTitle: "Advisor login",
  },
  {
    id: "advisor-send-confirmation",
    path: "/advisor-send-confirmation",
    type: "form",
    title: "Application Sent Successfully!",
    subhead:
      "The applicant can now review, sign, and submit their application.",
    navTitle: "Sent confirmation",
  },
  {
    id: "mock-email-preview",
    path: "/mock-email-preview",
    type: "receipt",
    title: "Mock Email Preview",
    navTitle: "Mock email preview",
  },
  {
    id: "information-architecture",
    path: "/information-architecture",
    type: "internal",
    title: "Information Architecture",
    navTitle: "Information architecture",
  },
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
  const client = getActiveClient();
  const clientOverride = client.pages?.overrides?.[id]?.title;
  if (clientOverride) return clientOverride;

  const page = pages.find((page) => page.id === id);

  if (!page) {
    throw new Error(`Missing page title for page id: ${id}`);
  }

  return page.title;
}

export function getPageSubhead(id: (typeof pages)[number]["id"]) {
  const client = getActiveClient();
  const clientOverride = client.pages?.overrides?.[id];

  // Client can override subhead or explicitly show/hide it
  if (clientOverride?.subhead !== undefined) return clientOverride.subhead;
  if (clientOverride?.showSubhead === false) return undefined;

  const page = pages.find((page) => page.id === id);

  if (!page) {
    throw new Error(`Missing page subhead for page id: ${id}`);
  }

  if (!("subhead" in page)) return undefined;

  // showSubhead must be explicitly true on the page to display
  return "showSubhead" in page && page.showSubhead ? page.subhead : undefined;
}

export function getPageNavTitle(id: (typeof pages)[number]["id"]) {
  const page = pages.find((page) => page.id === id);

  if (!page) {
    throw new Error(`Missing page nav title for page id: ${id}`);
  }

  return page.navTitle;
}
