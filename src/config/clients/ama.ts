import type { ClientConfig } from "./types";

export const amaClient: ClientConfig = {
  id: "ama",
  themeColor: "dark-blue",
  branding: {
    name: "American Medical Association",
    acronym: "AMA",
    logo: "/client/ama/logo.png",
    logoAlt: "AMA Logo",
  },
  support: {
    phone: "8886275902",
    phoneDisplay: "800-458-5736",
    phoneHours: "M-F 8:00am-5:00pm CT",
    email: "wecare@amainsure.com",
    website: "https://www.amainsure.com",
    address: {
      street: "330 North Wabash Avenue Suite 39300",
      city: "Chicago",
      state: "Illinois",
      zip: "60611",
    },
  },
  pages: {
    excluded: [],
    optional: ["beneficiary", "payment"],
  },
  coverages: {
    categories: ["LI", "AD", "DI", "OO", "SH"],
    enabled: [
      "li-20yr",
      "li-15yr",
      "li-10yr",
      "li-term",
      "li-preferred",
      "li-premier-accident",
      "di-step-rated",
      "di-level-rated",
      "oo-office-overhead",
      "sh-hospital-income",
    ],
    ranges: {
      "li-20yr": { min: 50000, max: 1000000 },
      "li-15yr": { min: 50000, max: 500000 },
      "li-10yr": { min: 50000, max: 500000 },
      "li-term": { min: 50000, max: 500000 },
      "li-preferred": { min: 50000, max: 750000 },
      "li-premier-accident": { min: 25000, max: 500000 },
      "di-step-rated": { min: 1000, max: 5000 },
      "di-level-rated": { min: 1000, max: 5000 },
      "oo-office-overhead": { min: 500, max: 3000 },
      "sh-hospital-income": { min: 100, max: 300 },
    },
    descriptions: {
      "li-20yr": "Longer term protection for extended peace of mind.",
      "li-15yr": "Mid-length term coverage for evolving needs.",
      "li-10yr": "Short-term coverage with stable premiums for a decade.",
      "li-term": "Straightforward term coverage for everyday protection.",
      "li-preferred": "Preferred rates for qualifying applicants.",
      "li-premier-accident": "Accident-focused protection with added benefits.",
      "di-step-rated": "Disability coverage with step-rated premiums.",
      "di-level-rated": "Disability coverage with level, predictable rates.",
      "oo-office-overhead": "Keeps office expenses covered during disability.",
      "sh-hospital-income": "Hospital income coverage for qualifying stays.",
    },
    overrides: {
      "li-20yr": {
        name: "20-Year Level Term Life Insurance",
      },
      "li-15yr": {
        name: "15-Year Level Term Life Insurance",
      },
      "li-10yr": {
        name: "10-Year Level Term Life Insurance",
      },
      "li-term": {
        name: "Term Life Insurance",
        featured: true,
      },
      "li-preferred": {
        name: "Preferred Term Life Insurance",
      },
      "li-premier-accident": {
        name: "Premier Accident Insurance",
      },
      "di-step-rated": {
        name: "Disability Insurance with Step Rated Premiums",
      },
      "di-level-rated": {
        name: "Disability Insurance with Level Rated Premiums",
      },
      "oo-office-overhead": {
        name: "Office Overhead Expense Insurance",
      },
      "sh-hospital-income": {
        name: "Hospital Income Insurance",
      },
    },
    estimatedRateDisplay: {
      showFrequencyToggle: true,
      defaultFrequency: "annual",
    },
  },
  fields: {},
  licenseInfo: [
    "CA Insurance License: #0754707",
    "AR Insurance License: #100105975",
  ],
};
