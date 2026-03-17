import {
  VolunteerActivismRounded,
  GppGoodRounded,
  AccessibleForwardRounded,
  ApartmentRounded,
  LocalHospitalRounded,
} from "@mui/icons-material";
import type { CoverageCat } from "../validation/eligibility";

export type ApplicantType = "Self" | "Spouse" | "Child";

export type CoverageProductConfig = {
  id: string;
  name: string;
  coverageCategory: CoverageCat;
  applicants: ApplicantType[];
  monthlyEstimate?: string;
  coverageDescription?: string;
  coverageHighlight?: string;
  quickDecision?: boolean;
};

export type CoverageCardConfig = {
  id: CoverageCat;
  title: string;
  description: string;
  icon: typeof VolunteerActivismRounded;
  products: CoverageProductConfig[];
};

export const APPLICANT_OPTIONS: ApplicantType[] = ["Self", "Spouse", "Child"];

export const COVERAGE_CARDS: CoverageCardConfig[] = [
  {
    id: "LI",
    title: "Group Life Insurance",
    description:
      "Protect your family or business with level term options tailored for attorneys.",
    icon: VolunteerActivismRounded,
    products: [
      {
        id: "li-term10",
        name: "10-Year Level Term Life Insurance",
        coverageCategory: "LI",
        applicants: ["Self", "Spouse"],
        monthlyEstimate: "$20–$45/mo",
        coverageDescription:
          "Budget-friendly term coverage with predictable premiums.",
        coverageHighlight: "$500K of protection",
        quickDecision: true,
      },
      {
        id: "li-term20",
        name: "20-Year Level Term Life Insurance",
        coverageCategory: "LI",
        applicants: ["Self", "Spouse"],
        monthlyEstimate: "$32–$60/mo",
        coverageDescription: "Longer term protection for growing families.",
        coverageHighlight: "$1M of protection",
      },
    ],
  },
  {
    id: "AD",
    title: "Accidental Death & Dismemberment",
    description:
      "Extra protection that pays benefits for covered accidental injury or loss.",
    icon: GppGoodRounded,
    products: [
      {
        id: "li-adt",
        name: "Accidental Death & Dismemberment",
        coverageCategory: "AD",
        applicants: ["Self", "Spouse", "Child"],
        monthlyEstimate: "$5–$12/mo",
        coverageDescription: "Benefit for covered accidental injury or loss.",
        coverageHighlight: "$300K AD&D benefit",
      },
    ],
  },
  {
    id: "DI",
    title: "Group Disability Insurance",
    description:
      "Replace lost income and keep your practice running if an illness or injury sidelines you.",
    icon: AccessibleForwardRounded,
    products: [
      {
        id: "di-basic",
        name: "LTD 70% Monthly Benefit",
        coverageCategory: "DI",
        applicants: ["Self", "Spouse"],
        monthlyEstimate: "$55–$110/mo",
        coverageDescription:
          "Core income protection for full-time professionals.",
        coverageHighlight: "70% income replacement",
        quickDecision: true,
      },
      {
        id: "di-student",
        name: "Resident & Fellow Disability",
        coverageCategory: "DI",
        applicants: ["Self"],
        monthlyEstimate: "$28–$65/mo",
        coverageDescription: "Designed for residents and fellows in training.",
        coverageHighlight: "$5K/mo benefit",
      },
      {
        id: "di-premium",
        name: "Own-Occupation Disability",
        coverageCategory: "DI",
        applicants: ["Self", "Spouse"],
        monthlyEstimate: "$80–$150/mo",
        coverageDescription: "Own-occupation coverage for specialized roles.",
        coverageHighlight: "$12K/mo own-occ benefit",
      },
    ],
  },
  {
    id: "OO",
    title: "Office Overhead Expense",
    description:
      "Cover rent, payroll, and other business expenses during a prolonged disability.",
    icon: ApartmentRounded,
    products: [
      {
        id: "oo-10k",
        name: "$10K Monthly Expense Benefit",
        coverageCategory: "OO",
        applicants: ["Self"],
        monthlyEstimate: "$65–$95/mo",
        coverageDescription: "Helps cover rent and payroll during recovery.",
        coverageHighlight: "$10K office overhead",
        quickDecision: true,
      },
      {
        id: "oo-20k",
        name: "$20K Monthly Expense Benefit",
        coverageCategory: "OO",
        applicants: ["Self"],
        monthlyEstimate: "$110–$160/mo",
        coverageDescription:
          "Higher overhead support for established practices.",
        coverageHighlight: "$20K office overhead",
      },
    ],
  },
  {
    id: "SH",
    title: "Supplemental Health",
    description:
      "Cash benefits to offset hospital stays, critical illness, or recovery costs.",
    icon: LocalHospitalRounded,
    products: [
      {
        id: "sh-hospital",
        name: "Hospital Income Plan",
        coverageCategory: "SH",
        applicants: ["Self", "Spouse", "Child"],
        monthlyEstimate: "$18–$35/mo",
        coverageDescription: "Daily cash payments for covered hospital stays.",
        coverageHighlight: "$300/day hospital cash",
        quickDecision: true,
      },
      {
        id: "sh-critical",
        name: "Critical Illness Benefit",
        coverageCategory: "SH",
        applicants: ["Self", "Spouse"],
        monthlyEstimate: "$22–$48/mo",
        coverageDescription: "Lump-sum support after a covered diagnosis.",
        coverageHighlight: "$50K lump sum",
      },
    ],
  },
];

export const PRODUCT_LOOKUP = COVERAGE_CARDS.flatMap(
  (card) => card.products,
).reduce<Record<string, CoverageProductConfig>>((acc, product) => {
  acc[product.id] = product;
  return acc;
}, {});
