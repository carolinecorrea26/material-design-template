// keep your existing page objects / ids / paths / groupIds exactly as they are
// only replace title values

export const pages = [
  { id: "home", path: "/", type: "home", title: "Home" },
  {
    id: "membership",
    path: "/membership",
    type: "form",
    title: "Let's get started with your insurance application.",
    groupId: "get-started",
  },
  {
    id: "eligibility",
    path: "/eligibility",
    type: "form",
    title: "Check which coverage options you're eligible for.",
    groupId: "get-started",
  },
  {
    id: "coverage",
    path: "/coverage",
    type: "form",
    title: "Great! You have the following coverage options available.",
    groupId: "coverage",
  },
  {
    id: "coverage-questions",
    path: "/coverage-questions",
    type: "form",
    title:
      "Just a few more questions so we can calculate your personalized rate.",
    groupId: "coverage",
  },
  {
    id: "coverage-options",
    path: "/coverage-options",
    type: "form",
    title: "Your personalized coverage options are below.",
    groupId: "coverage",
  },
  {
    id: "beneficiary",
    path: "/beneficiary",
    type: "form",
    title: "Now choose who you'd like as your beneficiaries.",
    groupId: "coverage",
  },
  {
    id: "contact",
    path: "/contact",
    type: "form",
    title:
      "Please provide contact details so we can reach you about your application.",
    groupId: "profile",
  },
  {
    id: "personal",
    path: "/personal",
    type: "form",
    title: "We need a few more details about you to keep going.",
    groupId: "profile",
  },
  {
    id: "financial",
    path: "/financial",
    type: "form",
    title: "Almost there! Do you have any additional insurance policies?",
    groupId: "profile",
  },
  {
    id: "review",
    path: "/review",
    type: "form",
    title:
      "Please review the following important information before continuing.",
    groupId: "review",
  },
  {
    id: "docusign",
    path: "/docusign",
    type: "form",
    title: "Sign your application.",
    groupId: "review",
  },

  // THESE MUST STAY if they already exist in your app
  {
    id: "health-si",
    path: "/health-si",
    type: "form",
    title: "Complete your health information.",
    groupId: "health",
  },
  {
    id: "health-qd",
    path: "/health-qd",
    type: "form",
    title: "Complete your health information.",
    groupId: "health",
  },
  {
    id: "health-di",
    path: "/health-di",
    type: "form",
    title: "Complete your health information.",
    groupId: "health",
  },
  {
    id: "health-cir",
    path: "/health-cir",
    type: "form",
    title: "Complete your health information.",
    groupId: "health",
  },

  {
    id: "payment",
    path: "/payment",
    type: "form",
    title: "Choose how you would like to pay for your coverage.",
    groupId: "payment",
  },
  {
    id: "receipt",
    path: "/receipt",
    type: "receipt",
    title: "Your application has been submitted.",
  },
  {
    id: "resume",
    path: "/resume",
    type: "resume",
    title: "Already started an application?",
  },

  {
    id: "advisor-login",
    path: "/advisor-login",
    type: "form",
    title: "Advisor Login",
  },
  {
    id: "advisor-send-confirmation",
    path: "/advisor-send-confirmation",
    type: "form",
    title: "Application Sent Successfully!",
  },
] as const;

export type PageType = "home" | "form" | "receipt" | "resume";

export function getPagePath(id: (typeof pages)[number]["id"]) {
  const page = pages.find((page) => page.id === id);

  if (!page) {
    throw new Error(`Missing page path for page id: ${id}`);
  }

  return page.path;
}

export function getPageTitle(id: (typeof pages)[number]["id"]) {
  const page = pages.find((page) => page.id === id);

  if (!page) {
    throw new Error(`Missing page title for page id: ${id}`);
  }

  return page.title;
}
