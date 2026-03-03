export type Applicant = "self" | "spouse" | "child";
export type CoverageCategory = "LI" | "AD" | "DI" | "OO" | "SH"; // Life, Accidental Death & Dismemberment, Disability, Office Overhead, Supplemental Health

export interface Product {
  id: string;
  name: string;
  category: CoverageCategory;
  eligibleApplicants: Applicant[]; // who may apply
  amounts: number[]; // allowed coverage amounts
  quickDecision?: boolean; // doc-flagged items (display only)
}

export interface SelectedItem {
  productId: string;
  applicant: Applicant;
  amount: number;
  estMonthly: number; // MOCK rate computed client- or server-side
  riders?: Record<string, boolean | number>; // optional riders with boolean or amount values
}

export interface EligibilityDefaults {
  categories: CoverageCategory[]; // which categories are generally available (doc-based later)
  applicants: Applicant[]; // default applicant types to show
}

export interface RateQuoteRequest {
  productId: string;
  applicant: Applicant;
  amount: number;
  smoker?: boolean; // optional; include if doc says
  age?: number; // optional; include if doc says
}

export interface RateQuoteResponse {
  monthly: number;
}
