import type { ClientConfig } from "./types";
import { rangeAssignments } from "../coverages/amounts";

export const abeClient: ClientConfig = {
  id: "abe",
  theme: { type: "preset", preset: "default" },
  branding: {
    name: "American Bar Endowment",
    acronym: "ABE",
    logo: "/client/abe/logo.png",
    logoAlt: "ABE Logo",
  },
  support: {
    phone: "8006218981",
    phoneDisplay: "(800) 621-8981",
    email: "information@abendowment.org",
    website: "abendowment.org",
    address: {
      street: "321 North Clark Street, 14th Floor",
      city: "Chicago",
      state: "Illinois",
      zip: "60654-7648",
    },
  },
  pages: {
    requirements: {
      beneficiary: "optional",
      payment: "required",
    },
  },
  coverages: {
    categories: ["LI", "AD", "DI", "OO", "SH"],
    categorySectionLabels: {
      OO: "Professional Overhead Expense Disability",
    },
    enabled: [
      "li-term",
      "li-10yr",
      "li-20yr",
      "li-50plus",
      "li-add",
      "di-ltd-plus",
      "di-ltd",
      "di-mtd",
      "oo-professional",
      "sh-critical-illness",
      "sh-hospital-money",
    ],
    coverageAmounts: {
      "li-term": rangeAssignments({ member: [50000, 500000] }),
      "li-10yr": rangeAssignments({ member: [50000, 500000] }),
      "li-20yr": rangeAssignments({ member: [50000, 1000000] }),
      "li-50plus": rangeAssignments({ member: [50000, 500000] }),
      "li-add": rangeAssignments({ member: [25000, 500000] }),
      "di-ltd-plus": rangeAssignments({ member: [1000, 5000] }),
      "di-ltd": rangeAssignments({ member: [1000, 5000] }),
      "di-mtd": rangeAssignments({ member: [1000, 4000] }),
      "oo-professional": rangeAssignments({ member: [500, 3000] }),
      "sh-critical-illness": rangeAssignments({ member: [10000, 50000] }),
      "sh-hospital-money": rangeAssignments({ member: [100, 500] }),
    },
    overrides: {
      "li-term": {
        featured: true,
        underwritingType: "QD",
        riders: [
          {
            id: "cir",
            name: "Chronic Illness Rider (CIR)",
            description:
              "Accelerate up to 50% of the portion of your life insurance subject to the Chronic Illness Rider should you be permanently unable to perform 2 out of 6 activities of daily living or require substantial care due to permanent cognitive impairment.",
            premiumFactor: 0.05,
          },
        ],
      },
      "li-10yr": {
        underwritingType: "QD",
      },
      "li-20yr": {
        underwritingType: "QD",
      },
      "li-50plus": {
        underwritingType: "TELE",
      },
      "di-ltd-plus": {
        applicants: ["member", "spouse"],
        waitingPeriodOptions: [
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
        ],
      },
      "di-ltd": {
        underwritingType: "SI",
        applicants: ["member", "spouse"],
        waitingPeriodOptions: [
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
        ],
      },
      "di-mtd": {
        underwritingType: "TELE",
        applicants: ["member", "spouse"],
        waitingPeriodOptions: [
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
        ],
      },
      "oo-professional": {
        waitingPeriodOptions: [
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
        ],
        maxBenefitPeriodOptions: [{ label: "12 months", value: "12" }],
      },
    },
  },
  fields: {
    coverage: {
      hidden: ["average-employees-6-months"],
    },
    eligibility: {
      overrides: {
        "spouse-membership": {
          label:
            "Is your spouse also an active member of a State, Local, or Specialty Bar Association?",
        },
      },
    },
  },
  licenseInfo: [],
};
