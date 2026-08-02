import type { ClientConfig } from "./types";

export const amaClient: ClientConfig = {
  id: "ama",
  // themeColor: "dark-blue",
  themeColor: "default",
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
    requirements: {
      beneficiary: "required",
      payment: "required",
    },
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
      "di-level-rated",
      "oo-office-overhead",
      "sh-hospital-income",
    ],
    ranges: {
      "li-20yr": { min: 100000, max: 4000000, amountStep: 25000 },
      "li-15yr": { min: 100000, max: 4000000, amountStep: 25000 },
      "li-10yr": { min: 100000, max: 4000000, amountStep: 25000 },
      "li-term": { min: 100000, max: 1000000, amountStep: 25000 },
      "li-preferred": { min: 25000, max: 3000000, amountStep: 25000 },
      "li-premier-accident": {
        min: 500000,
        max: 1000000,
        amountStep: 250000,
        spouseMin: 200000,
        spouseMax: 500000,
        spouseAmountStep: 25000,
      },
      "di-level-rated": { min: 100, max: 15000, amountStep: 100 },
      "oo-office-overhead": { min: 1000, max: 20000, amountStep: 1000 },
      "sh-hospital-income": {
        min: 100,
        max: 600,
        amountStep: 100,
        spouseMin: 100,
        spouseMax: 600,
        spouseAmountStep: 100,
      },
    },
    descriptions: {
      "li-20yr":
        "Level term life coverage with a 20-year initial premium period.",
      "li-15yr":
        "Level term life coverage with a 15-year initial premium period.",
      "li-10yr":
        "Level term life coverage with a 10-year initial premium period.",
      "li-term":
        "Straightforward term life insurance with core disability protection options available.",
      "li-preferred":
        "Preferred term life insurance for qualifying applicants.",
      "li-premier-accident":
        "Accident insurance with separate self and spouse benefit options.",
      "di-level-rated":
        "Disability income protection with level-rated premiums.",
      "oo-office-overhead":
        "Office overhead protection for covered business expenses during disability.",
      "sh-hospital-income":
        "Hospital income protection for covered confinement.",
    },
    overrides: {
      "li-20yr": {
        name: "20-Year Level Term Life Insurance",
        applicants: ["member"],
        riders: [
          {
            id: "add",
            name: "Accidental Death & Dismemberment",
            description:
              "If you die as a result of an accident, the life insurance company will double the original death benefit of your policy.",
            premiumFactor: 0.05,
          },
          {
            id: "wop",
            name: "Waiver of Premium Rider",
            description:
              "Waives your premium payments should you become totally disabled before age 60; see brochure/certificate for details.",
            premiumFactor: 0.05,
          },
        ],
      },
      "li-15yr": {
        name: "15-Year Level Term Life Insurance",
        applicants: ["member"],
        riders: [
          {
            id: "add",
            name: "Accidental Death & Dismemberment",
            description:
              "If you die as a result of an accident, the life insurance company will double the original death benefit of your policy.",
            premiumFactor: 0.05,
          },
          {
            id: "wop",
            name: "Waiver of Premium Rider",
            description:
              "Waives your premium payments should you become totally disabled before age 60; see brochure/certificate for details.",
            premiumFactor: 0.05,
          },
        ],
      },
      "li-10yr": {
        name: "10-Year Level Term Life Insurance",
        applicants: ["member"],
        riders: [
          {
            id: "add",
            name: "Accidental Death & Dismemberment",
            description:
              "If you die as a result of an accident, the life insurance company will double the original death benefit of your policy.",
            premiumFactor: 0.05,
          },
          {
            id: "wop",
            name: "Waiver of Premium Rider",
            description:
              "Waives your premium payments should you become totally disabled before age 60; see brochure/certificate for details.",
            premiumFactor: 0.05,
          },
        ],
      },
      "li-term": {
        name: "Term Life Insurance",
        featured: true,
        underwritingType: "QD",
        applicants: ["member"],
        riders: [
          {
            id: "wop",
            name: "Waiver of Premium Rider",
            description:
              "Waives your premium payments should you become totally disabled before age 60; see brochure/certificate for details.",
            premiumFactor: 0.05,
          },
        ],
      },
      "li-preferred": {
        name: "Preferred Term Life Insurance",
        applicants: ["member"],
        riders: [
          {
            id: "add",
            name: "Accidental Death & Dismemberment (AD&D) Rider",
            description:
              "If you die as a result of an accident, the life insurance company will double the original death benefit of your policy.",
            premiumFactor: 0.05,
          },
          {
            id: "wop",
            name: "Waiver of Premium Rider",
            description:
              "Waives your premium payments should you become totally disabled before age 60; see brochure/certificate for details.",
            premiumFactor: 0.05,
          },
        ],
      },
      "li-premier-accident": {
        name: "Premier Accident Insurance",
        applicants: ["member", "spouse"],
      },
      "di-level-rated": {
        name: "Disability Insurance with Level Rated Premiums",
        applicants: ["member"],
        waitingPeriodOptions: [
          { label: "60 days", value: "60", days: 60 },
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
          { label: "365 days", value: "365", days: 365 },
        ],
        riders: [
          {
            id: "true-own-specialty",
            name: "True Own-Specialty Disability Definition Rider",
            description:
              "Coverage with a true own-specialty definition of disability pays full benefits if you cannot perform the work of your medical specialty even if you are gainfully employed in another occupation.",
            premiumFactor: 0.05,
          },
          {
            id: "cola",
            name: "Cost of Living Adjustment (COLA)",
            description:
              "Provides that on the anniversary of a continuing disability, the monthly benefit for the next 12 months is increased to reflect changes in the CPI-U for the previous 12 months, subject to a maximum increase for a single disability.",
            premiumFactor: 0.05,
          },
          {
            id: "catastrophic",
            name: "Catastrophic Disability Benefit",
            description:
              "Provides additional monthly benefits for certain conditions that require extra care.",
            premiumFactor: 0.05,
          },
        ],
      },
      "oo-office-overhead": {
        name: "Office Overhead Expense Insurance",
        applicants: ["member"],
        waitingPeriodOptions: [
          { label: "30 days", value: "30", days: 30 },
          { label: "60 days", value: "60", days: 60 },
          { label: "90 days", value: "90", days: 90 },
        ],
        maxBenefitPeriodOptions: [
          { label: "6 months", value: "6" },
          { label: "12 months", value: "12" },
          { label: "24 months", value: "24" },
          { label: "36 months", value: "36" },
        ],
      },
      "sh-hospital-income": {
        name: "Hospital Income Insurance",
        applicants: ["member", "spouse"],
      },
    },
    estimatedRateDisplay: {
      showFrequencyToggle: true,
      defaultFrequency: "annual",
    },
    productEstimatedCostBreakdown: {
      enabled: true,
      policyFee: {
        label: "Non-AMA Member Policy Fee",
        amount: { annual: 45 },
      },
      childApplicantRider: {
        enabled: true,
        label: "Child Applicant Coverage",
        amount: { annual: 12 },
      },
    },
  },
  fields: {
    coverage: {
      hidden: ["average-employees-6-months"],
    },
  },
  features: {
    scheduleUrl: "https://calendly.com/ama-advisor/30min",
  },
  licenseInfo: [
    "CA Insurance License: #0754707",
    "AR Insurance License: #100105975",
  ],
};
