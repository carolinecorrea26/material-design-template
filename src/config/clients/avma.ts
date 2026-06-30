import type { ClientConfig } from "./types";

export const avmaClient: ClientConfig = {
  id: "avma",
  branding: {
    name: "American Veterinary Medical Association",
    acronym: "AVMA",
    logo: "/client/avma/logo.png",
    logoAlt: "AVMA Logo",
  },
  support: {
    phone: "8002287548",
    phoneDisplay: "(800) 228-7548",
    email: "support@avmainsuranceservices.com",
    website: "https://AVMAInsuranceServices.com",
    address: {
      street: "1200 E. Glen Avenue",
      city: "Peoria Heights",
      state: "Illinois",
      zip: "61616",
    },
  },
  pages: {
    excluded: [],
    optional: ["beneficiary", "payment"],
  },
  coverages: {
    categories: ["LI", "AD", "DI", "OO", "SH"],
    enabled: [
      "li-group-term",
      "li-10yr",
      "li-20yr",
      "li-50plus",
      "li-add",
      "di-ltd",
      "di-short-term",
      "di-ltd-plus",
      "li-term",
      "oo-professional",
      "sh-hospital-income",
      "sh-critical-illness",
    ],
    ranges: {
      "li-group-term": { min: 50000, max: 500000 },
      "li-10yr": { min: 50000, max: 500000 },
      "li-20yr": { min: 50000, max: 1000000 },
      "li-50plus": { min: 25000, max: 300000 },
      "li-add": { min: 50000, max: 1000000 },
      "di-ltd": { min: 1000, max: 10000 },
      "di-short-term": { min: 500, max: 5000 },
      "di-ltd-plus": { min: 500, max: 3000 },
      "li-term": { min: 25000, max: 250000 },
      "oo-professional": { min: 1000, max: 10000 },
      "sh-hospital-income": { min: 500, max: 3000 },
      "sh-critical-illness": { min: 10000, max: 75000 },
    },
    overrides: {
      "li-group-term": {
        featured: true,
      },
      "li-50plus": {
        underwritingType: "GI",
      },
      "li-add": {
        underwritingType: "NA",
      },
      "di-ltd": {
        applicants: ["member", "spouse"],
        waitingPeriodOptions: [
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
        ],
      },
      "di-short-term": {
        applicants: ["member"],
        waitingPeriodOptions: [
          { label: "30 days", value: "30", days: 30 },
          { label: "60 days", value: "60", days: 60 },
        ],
      },
      "di-ltd-plus": {
        applicants: ["member"],
        waitingPeriodOptions: [
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
        ],
      },
      "oo-professional": {
        waitingPeriodOptions: [
          { label: "30 days", value: "30", days: 30 },
          { label: "60 days", value: "60", days: 60 },
          { label: "90 days", value: "90", days: 90 },
        ],
        maxBenefitPeriodOptions: [
          { label: "12 months", value: "12" },
          { label: "24 months", value: "24" },
        ],
      },
    },
  },
  fields: {},
  features: {
    homePageVariant: "welcome-back",
  },
  licenseInfo: [
    "Arkansas Insurance License: #1322",
    "California Insurance License: #0F76076",
  ],
};
