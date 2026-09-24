import type {
  CoverageAmountAssignment,
  CoverageApplicantId,
  CoverageDefinition,
} from "./types";

const scopedRange = (
  applicantType: CoverageApplicantId,
  min: number,
  max: number,
  increment: number,
): CoverageAmountAssignment => ({
  scope: { applicantType },
  selections: [{ type: "range", min, max, increment }],
});

// Codes marked "prototype" below are placeholders until their backend mappings are supplied.

export const coverages: CoverageDefinition[] = [
  {
    id: "li-term",
    code: "TL",
    categoryId: "LI",
    name: "Term Life",
    planCode: { primary: "100" }, // prototype
    definition: "Provides term life coverage for a specified period of time.",
    applicants: ["member", "spouse", "child"],
    underwritingType: "FUW",
    coverageAmounts: [
      scopedRange("member", 25000, 500000, 25000),
      scopedRange("spouse", 10000, 250000, 10000),
      scopedRange("child", 5000, 50000, 5000),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "li-10yr",
    code: "10TL",
    categoryId: "LI",
    name: "10-Year Level Term",
    planCode: { primary: "102" },
    definition: "Provides level term life coverage for 10 years.",
    description:
      "This coverage helps you plan today for the next decade, with no scheduled increases in premium for the initial 10 years of coverage.",
    applicants: ["member", "spouse", "child"],
    underwritingType: "FUW",
    coverageAmounts: [
      scopedRange("member", 25000, 500000, 25000),
      scopedRange("spouse", 10000, 250000, 10000),
      scopedRange("child", 5000, 50000, 5000),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "li-15yr",
    code: "15TL",
    categoryId: "LI",
    name: "15-Year Level Term",
    planCode: { primary: "115" }, // prototype
    definition: "Provides level term life coverage for 15 years.",
    applicants: ["member", "spouse", "child"],
    underwritingType: "FUW",
    coverageAmounts: [
      scopedRange("member", 25000, 500000, 25000),
      scopedRange("spouse", 10000, 250000, 10000),
      scopedRange("child", 5000, 50000, 5000),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "li-20yr",
    code: "20TL",
    categoryId: "LI",
    name: "20-Year Level Term",
    planCode: { primary: "121" },
    definition: "Provides level term life coverage for 20 years.",
    description:
      "A good fit for those in their 30s and 40s with premiums that are expected to remain level for the initial 20 years you are insured.",
    applicants: ["member", "spouse", "child"],
    underwritingType: "FUW",
    coverageAmounts: [
      scopedRange("member", 25000, 500000, 25000),
      scopedRange("spouse", 10000, 250000, 10000),
      scopedRange("child", 5000, 50000, 5000),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "li-50plus",
    code: "50PLUS",
    categoryId: "LI",
    name: "50+ Life",
    planCode: { primary: "150" }, // prototype
    definition:
      "Provides life coverage designed for eligible applicants age 50 and over.",
    applicants: ["member", "spouse"],
    underwritingType: "GI",
    coverageAmounts: [
      scopedRange("member", 10000, 100000, 10000),
      scopedRange("spouse", 5000, 50000, 5000),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "li-add",
    code: "ADD",
    categoryId: "AD",
    name: "Accidental Death and Dismemberment",
    planCode: { primary: "201" }, // prototype
    definition:
      "Provides coverage for accidental death or certain accidental injuries.",
    applicants: ["member", "spouse", "child"],
    underwritingType: "NA",
    coverageAmounts: [
      scopedRange("member", 25000, 500000, 25000),
      scopedRange("spouse", 10000, 250000, 10000),
      scopedRange("child", 5000, 25000, 5000),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "li-preferred",
    code: "PREF",
    categoryId: "LI",
    name: "Preferred Life",
    planCode: { primary: "103" }, // prototype
    definition:
      "Provides life coverage with product terms specific to the preferred offering.",
    applicants: ["member", "spouse"],
    underwritingType: "FUW",
    coverageAmounts: [
      scopedRange("member", 50000, 1000000, 25000),
      scopedRange("spouse", 25000, 500000, 25000),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "li-premier-accident",
    code: "PA",
    categoryId: "AD",
    name: "Premier Accident",
    planCode: { primary: "202" }, // prototype
    definition:
      "Provides accident coverage with benefits for covered accidental injuries.",
    coverageAmounts: [
      scopedRange("member", 50000, 500000, 50000),
      scopedRange("spouse", 25000, 250000, 25000),
      scopedRange("child", 10000, 100000, 10000),
    ],
    applicants: ["member", "spouse", "child"],
    underwritingType: "NA",
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "li-group-term",
    code: "GTL",
    categoryId: "LI",
    name: "Group Term Life",
    planCode: { primary: "101" },
    definition: "Provides group term life coverage for eligible applicants.",
    description:
      "Annually renewable coverage designed to provide protection for both you and your family.",
    applicants: ["member", "spouse", "child"],
    underwritingType: "GI",
    coverageAmounts: [
      scopedRange("member", 10000, 300000, 10000),
      scopedRange("spouse", 5000, 150000, 5000),
      scopedRange("child", 2000, 25000, 1000),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "di-ltd-plus",
    code: "LTDI+",
    categoryId: "DI",
    name: "Long-Term Disability Plus",
    planCode: { primary: "602" }, // prototype
    definition: "Provides long-term disability income protection.",
    applicants: ["member"],
    underwritingType: "FUW",
    options: [
      { id: "amount", type: "amount", choices: [] },
      { id: "benefit-option", type: "benefit-option", choices: [] },
      { id: "waiting-period", type: "waiting-period", choices: [] },
    ],
  },
  {
    id: "di-ltd",
    code: "LTDI",
    categoryId: "DI",
    name: "Long-Term Disability",
    planCode: { primary: "601" },
    definition: "Provides long-term disability income protection.",
    description:
      "Protection for your income if you are disabled from a covered accident or illness.",
    applicants: ["member"],
    underwritingType: "FUW",
    options: [
      { id: "amount", type: "amount", choices: [] },
      { id: "benefit-option", type: "benefit-option", choices: [] },
      { id: "waiting-period", type: "waiting-period", choices: [] },
    ],
  },
  {
    id: "di-mtd",
    code: "MTD",
    categoryId: "DI",
    name: "Mid-Term Disability",
    planCode: { primary: "604" }, // prototype
    definition:
      "Provides disability income protection for a mid-term benefit period.",
    applicants: ["member"],
    underwritingType: "FUW",
    options: [
      { id: "amount", type: "amount", choices: [] },
      { id: "benefit-option", type: "benefit-option", choices: [] },
      { id: "waiting-period", type: "waiting-period", choices: [] },
    ],
  },
  {
    id: "di-step-rated",
    code: "STDI",
    categoryId: "DI",
    name: "Step-Rated Disability",
    planCode: { primary: "606" }, // prototype
    definition:
      "Provides disability income protection with step-rated premium structure.",
    applicants: ["member"],
    underwritingType: "FUW",
    options: [
      { id: "amount", type: "amount", choices: [] },
      { id: "benefit-option", type: "benefit-option", choices: [] },
      { id: "waiting-period", type: "waiting-period", choices: [] },
    ],
  },
  {
    id: "di-level-rated",
    code: "LTDI",
    categoryId: "DI",
    name: "Level-Rated Disability",
    planCode: { primary: "607" }, // prototype
    definition:
      "Provides disability income protection with level premium structure.",
    applicants: ["member"],
    underwritingType: "FUW",
    options: [
      { id: "amount", type: "amount", choices: [] },
      { id: "benefit-option", type: "benefit-option", choices: [] },
      { id: "waiting-period", type: "waiting-period", choices: [] },
    ],
  },
  {
    id: "di-short-term",
    code: "STDI",
    categoryId: "DI",
    name: "Short-Term Disability",
    planCode: { primary: "605" }, // prototype
    definition: "Provides short-term disability income protection.",
    applicants: ["member"],
    underwritingType: "GI",
    options: [
      { id: "amount", type: "amount", choices: [] },
      { id: "benefit-option", type: "benefit-option", choices: [] },
      { id: "waiting-period", type: "waiting-period", choices: [] },
    ],
  },
  {
    id: "oo-professional",
    code: "OO",
    categoryId: "OO",
    name: "Office Overhead",
    planCode: { primary: "603" },
    definition:
      "Helps cover eligible office overhead expenses if the insured becomes disabled.",
    applicants: ["member"],
    underwritingType: "FUW",
    options: [
      { id: "amount", type: "amount", choices: [] },
      { id: "benefit-option", type: "benefit-option", choices: [] },
      { id: "waiting-period", type: "waiting-period", choices: [] },
    ],
  },
  {
    id: "oo-office-overhead",
    code: "OO",
    categoryId: "OO",
    name: "Office Overhead",
    planCode: { primary: "603" },
    definition:
      "Helps cover eligible office overhead expenses if the insured becomes disabled.",
    applicants: ["member"],
    underwritingType: "FUW",
    options: [
      { id: "amount", type: "amount", choices: [] },
      { id: "benefit-option", type: "benefit-option", choices: [] },
      { id: "waiting-period", type: "waiting-period", choices: [] },
    ],
  },
  {
    id: "sh-critical-illness",
    code: "CI",
    categoryId: "SH",
    name: "Critical Illness",
    planCode: { primary: "701" }, // prototype
    definition: "Provides a benefit for covered critical illnesses.",
    applicants: ["member", "spouse", "child"],
    underwritingType: "FUW",
    coverageAmounts: [
      scopedRange("member", 10000, 100000, 10000),
      scopedRange("spouse", 5000, 50000, 5000),
      scopedRange("child", 5000, 25000, 5000),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "sh-hospital-money",
    code: "HI",
    categoryId: "SH",
    name: "Hospital Money",
    planCode: { primary: "702" }, // prototype
    definition: "Provides benefits related to covered hospital stays.",
    applicants: ["member", "spouse", "child"],
    underwritingType: "FUW",
    coverageAmounts: [
      scopedRange("member", 500, 5000, 500),
      scopedRange("spouse", 500, 3000, 500),
      scopedRange("child", 250, 2000, 250),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
  {
    id: "sh-hospital-income",
    code: "HI",
    categoryId: "SH",
    name: "Hospital Income",
    planCode: { primary: "703" }, // prototype
    definition: "Provides benefits related to covered hospital confinement.",
    description:
      "Helps provide extra financial support if you're hospitalized due to a covered illness or injury.",
    applicants: ["member", "spouse", "child"],
    underwritingType: "FUW",
    coverageAmounts: [
      scopedRange("member", 500, 5000, 500),
      scopedRange("spouse", 500, 3000, 500),
      scopedRange("child", 250, 2000, 250),
    ],
    options: [{ id: "amount", type: "amount", choices: [] }],
  },
];
