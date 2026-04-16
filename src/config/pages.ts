// keep your existing page objects / ids / paths / groupIds exactly as they are
// only replace title values

export const pages = [
  { id: "home", path: "/", type: "home", title: "Home" },
  {
    id: "membership",
    path: "/membership",
    type: "form",
    title: "Start your insurance application below.",
    groupId: "get-started",
  },
  {
    id: "eligibility",
    path: "/eligibility",
    type: "form",
    title: "Check your eligibility for coverage.",
    groupId: "get-started",
  },
  {
    id: "coverage",
    path: "/coverage",
    type: "form",
    title: "Add the coverage you want to apply for.",
    groupId: "coverage",
  },
  {
    id: "coverage-questions",
    path: "/coverage-questions",
    type: "form",
    title: "We need some more information to continue.",
    groupId: "coverage",
  },
  {
    id: "coverage-options",
    path: "/coverage-options",
    type: "form",
    title: "Choose your coverage options below.",
    groupId: "coverage",
  },
  {
    id: "beneficiary",
    path: "/beneficiary",
    type: "form",
    title: "Add beneficiaries for each product you selected.",
    groupId: "coverage",
  },
  {
    id: "contact",
    path: "/contact",
    type: "form",
    title:
      "Enter your contact details so we can reach you about your application.",
    groupId: "profile",
  },
  {
    id: "personal",
    path: "/personal",
    type: "form",
    title: "Tell us about yourself so we can continue your application.",
    groupId: "profile",
  },
  {
    id: "financial",
    path: "/financial",
    type: "form",
    title: "Tell us about your finances and any existing coverage.",
    groupId: "profile",
  },
  {
    id: "review",
    path: "/review",
    type: "form",
    title:
      "Review your application and provide your consent and authorization to continue.",
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
    title: "Enter your email to resume your application.",
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
