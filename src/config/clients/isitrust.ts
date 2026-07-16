import type { ClientConfig } from "./types";

export const isitrustClient: ClientConfig = {
  id: "isitrust",
  themeColor: "dark-blue",
  branding: {
    name: "Insurance Specialists, Inc.",
    acronym: "ISITRUST",
    logo: "/client/isitrust/logo.png",
    logoAlt: "ISITRUST Logo",
  },
  support: {
    phone: "8884741959",
    phoneDisplay: "888-474-1959 (Sales)",
    email: "sales@isidirect.com",
    website: "www.isi1959.com",
    address: {
      street: "2964 Peachtree Road NW, Ste. 105",
      city: "Atlanta",
      state: "Georgia",
      zip: "30305",
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
      "li-50plus",
      "li-10yr",
      "li-20yr",
      "li-add",
      "di-ltd",
      "di-short-term",
      "oo-professional",
      "sh-critical-illness",
      "sh-hospital-income",
    ],
    ranges: {
      "li-group-term": { min: 50000, max: 500000 },
      "li-50plus": { min: 25000, max: 300000 },
      "li-10yr": { min: 50000, max: 500000 },
      "li-20yr": { min: 50000, max: 1000000 },
      "li-add": { min: 25000, max: 500000 },
      "di-ltd": { min: 1000, max: 10000 },
      "di-short-term": { min: 500, max: 5000 },
      "oo-professional": { min: 1000, max: 10000 },
      "sh-critical-illness": { min: 10000, max: 75000 },
      "sh-hospital-income": { min: 500, max: 3000 },
    },
    descriptions: {
      "li-group-term":
        "Coverage designed to provide protection for both you and your family.",
      "li-50plus":
        "Life coverage designed for eligible applicants age 50 and over.",
      "li-10yr":
        "This coverage helps you plan today for the next decade with no scheduled increases in premium for the initial 10 years of coverage.",
      "li-20yr":
        "A good fit for those in their 30s and 40s with premiums expected to remain level for the initial 20 years you are insured.",
      "li-add":
        "Coverage that can help provide financial support to your family after a covered accidental loss.",
      "di-ltd":
        "Protection for your income if you are disabled from a covered accident or illness.",
      "di-short-term":
        "Coverage to help protect income during short-term covered disabilities.",
      "oo-professional":
        "Coverage to help keep your business open while you are unable to work due to a covered disability.",
      "sh-critical-illness":
        "Coverage that can provide a lump-sum benefit upon diagnosis of covered critical illnesses.",
      "sh-hospital-income":
        "Coverage that can provide extra financial support during covered hospital stays.",
    },
    overrides: {
      "li-group-term": {
        name: "Group Term Life Insurance",
        underwritingType: "FUW",
        featured: true,
      },
      "li-50plus": {
        name: "Group Graded Benefit Term Life Insurance",
        underwritingType: "GI",
      },
      "li-10yr": {
        name: "Group 10-Year Level Term Life Insurance",
        underwritingType: "FUW",
      },
      "li-20yr": {
        name: "Group 20-Year Level Term Life Insurance",
        underwritingType: "FUW",
      },
      "li-add": {
        name: "Group Accidental Death & Dismemberment Insurance",
        underwritingType: "NA",
      },
      "di-ltd": {
        name: "Group Long Term Disability Insurance",
        underwritingType: "FUW",
      },
      "di-short-term": {
        name: "Group Short Term Disability Insurance",
        underwritingType: "GI",
      },
      "oo-professional": {
        name: "Business Overhead Insurance",
        underwritingType: "FUW",
      },
      "sh-critical-illness": {
        name: "Critical Illness",
        underwritingType: "FUW",
      },
      "sh-hospital-income": {
        name: "Hospital Indemnity Insurance",
        underwritingType: "FUW",
      },
    },
  },
  fields: {
    coverage: {
      hidden: ["average-employees-6-months"],
    },
  },
  features: {
    homePageVariant: "default",
  },
  licenseInfo: [
    "Arkansas Insurance License # 100109417",
    "California Insurance License # 0C88526",
  ],
};
