import type { ClientConfig } from "./types";

export const cseaClient: ClientConfig = {
  id: "csea",
  themeColor: "dark-blue",
  branding: {
    name: "CSEA Group Sponsored Insurance Program",
    acronym: "CSEA",
    logo: "/client/csea/logo.png",
    logoAlt: "CSEA Logo",
  },
  support: {
    phone: "8778472732",
    phoneDisplay: "(877) 847-2732",
    email: "cseainsurance@pearlinsurance.com",
    website: "cseainsurance.com",
    address: {
      street: "13 Airline Drive",
      city: "Albany",
      state: "New York",
      zip: "12205",
    },
  },
  pages: {
    requirements: {
      beneficiary: "required",
      payment: "required",
    },
  },
  coverages: {
    categories: ["DI"],
    enabled: ["di-ltd"],
    ranges: {
      "di-ltd": { min: 1000, max: 10000 },
    },
    descriptions: {
      "di-ltd":
        "Protection for your income if you are disabled from a covered accident or illness.",
    },
    overrides: {
      "di-ltd": {
        name: "Disability Income Insurance",
        applicants: ["member"],
        underwritingType: "FUW",
        waitingPeriodOptions: [
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
        ],
      },
    },
  },
  fields: {
    coverage: {
      hidden: ["average-employees-6-months"],
    },
  },
  features: {
    homePageVariant: "hero-image",
  },
  coverageQuestions: {
    always: ["selfCoverageWorkIncome"],
  },
};
