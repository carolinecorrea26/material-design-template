import type { ClientConfig } from "./types";

export const waepaClient: ClientConfig = {
  id: "waepa",
  themeColor: "dark-blue",
  branding: {
    name: "Worldwide Assurance for Employees of Public Agencies",
    acronym: "WAEPA",
    logo: "/client/waepa/logo.png",
    logoAlt: "WAEPA Logo",
  },
  support: {
    phone: "8003683484",
    phoneDisplay: "800-368-3484",
    phoneHours: "M-Th 8:30am - 6:30pm, F 8:30am - 5:00pm, ET",
    email: "support@waepa.org",
    website: "waepa.org",
    address: {
      street: "2806 N. Parham Road, Suite 200",
      city: "Richmond",
      state: "Virginia",
      zip: "23294",
    },
  },
  pages: {
    requirements: {
      beneficiary: "required",
      payment: "required",
    },
  },
  coverages: {
    categories: ["LI", "DI"],
    enabled: ["li-group-term", "di-short-term"],
    ranges: {
      "li-group-term": { min: 50000, max: 500000 },
      "di-short-term": { min: 1000, max: 4000 },
    },
    descriptions: {
      "li-group-term":
        "Coverage designed to provide protection for both you and your family.",
      "di-short-term":
        "This coverage can help safeguard against the potentially devastating consequences an illness or injury could have on your life.",
    },
    additionalCoverageWarning: "applyForTotal",
    hideSmokerQuestion: true,
    overrides: {
      "li-group-term": {
        name: "Group Term Life Insurance",
        underwritingType: "QD",
        productWarning: {
          severity: "info",
          title: "",
          message: "Optional Chronic Illness Rider available.",
        },
        riders: [
          {
            id: "cir",
            name: "Chronic Illness Rider (CIR)",
            description:
              "Accelerate up to 50% of the portion of your life insurance subject to the Chronic Illness Rider should you be permanently unable to perform 2 out of 6 activities of daily living or require substantial care due to permanent cognitive impairment.",
            premiumFactor: 0.05,
          },
          {
            id: "abi",
            name: "Automatic Benefit Increase Rider (ABI)",
            description:
              "Automatic benefit increase of $25,000 per year for up to 10 years, with no additional medical underwriting required. Subject to increased premium due with each annual increase.",
            premiumFactor: 0.05,
          },
        ],
      },
      "di-short-term": {
        name: "Group Short-Term Disability Income Insurance",
        underwritingType: "QD",
      },
    },
    allCategoriesExpanded: true,
  },
  fields: {
    coverage: {
      hidden: ["average-employees-6-months"],
    },
  },
  licenseInfo: [
    "CA Insurance License: #OH62489",
    "AR Insurance License: #94726",
  ],
};
