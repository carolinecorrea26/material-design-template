import type { CoverageId } from "./identities";
export type CoverageCategoryId = "LI" | "AD" | "DI" | "OO" | "SH";

export type CoverageApplicantId = "member" | "spouse" | "child";

/** A reusable selector for applicant- and client-defined-class-specific values. */
export type CoverageScope = {
  applicantType?: CoverageApplicantId;
  applicantClassId?: string;
};

export type ScopedValue<T> = {
  scope?: CoverageScope;
  value: T;
};

export type ProductIdentifierSet = {
  primary?: string;
  dummy?: string;
  xml?: string;
  pdf?: string;
};

export type PlanCodeIdentifierSet = {
  primary: string;
  dummy?: string;
};

/** Default identifiers plus optional applicant/class-specific variants. */
export type ScopedIdentifierSet<T extends ProductIdentifierSet> = T & {
  scoped?: ScopedValue<T>[];
};

export type CoverageAmountSelection =
  | { type: "range"; min: number; max: number; increment: number }
  | { type: "amountList"; values: number[] }
  | {
      type: "optionList";
      options: Array<{ value: string; label: string }>;
    };

export type DerivedCoverageCalculation =
  | { type: "percentage"; value: number }
  | { type: "fixed"; value: number };

export type CoverageAmountAssignment = {
  scope?: CoverageScope;
  /** Multiple entries allow disjoint ranges with different increments. */
  selections?: CoverageAmountSelection[];
  /** Used when this applicant's coverage is derived rather than selected independently. */
  derivedFrom?: {
    applicantType: "member" | "spouse";
    applicantClassId?: string;
    calculation: DerivedCoverageCalculation;
  };
};

export type CoverageUnderwritingType =
  | "NCGI"
  | "UNRESOLVED"
  | "FUW"
  | "GI"
  | "NA"
  | "QD"
  | "SI"
  | "TELE";

export type RiderDefinition = {
  /** Applicants who may elect this rider without requesting new base coverage. */
  riderOnlyApplicants?: CoverageApplicantId[];
  /** Beneficiary role can differ from the base election owner. */
  dependentApplicant?: "spouse" | "child";
  defaultSelected?: boolean;
  included?: boolean;
  defaultAmount?: number;
  amountLabel?: string;
  displayAsProduct?: boolean;
  referenceRateTable?: import("./ratePresentation").ReferenceRateTable;
  id: string;
  name: string;
  description: string;
  /** If true, the rider also has a coverage amount selection */
  hasAmount?: boolean;
  coverageAmounts?: CoverageAmountAssignment[];
  applicants?: CoverageApplicantId[];
  /** Multiplier applied to the base premium when this rider is selected (e.g. 0.05 = +5%) */
  premiumFactor: number;
};

export type WaitingPeriodOption = {
  label: string;
  value: string;
  days: number;
};

export type MaxBenefitPeriodOption = {
  label: string;
  value: string;
};

/** Declarative requirements survive source-to-database resolution unchanged. */
export type CoverageRequirements = {
  /** Exclusions apply to the whole application, across applicant roles. */
  exclusiveProducts?: string[];
  unresolved?: Array<{ id: string; description: string; source: string }>;
  eligibility?: Array<{
    applicantType: CoverageApplicantId;
    minimumAgeDays?: number;
    minimumAgeYears?: number;
    maximumAgeYears?: number;
    fullTimeStudentMaximumAgeYears?: number;
    minimumWorkHoursPerWeek?: number;
    factRequirements?: import("./eligibilityFacts").EligibilityFactRequirement[];
  }>;
  dependencies?: Array<{ applicantType: CoverageApplicantId; requiresApplicant: CoverageApplicantId; categoryId: CoverageCategoryId; sameProduct: boolean }>;
  maximumPlans?: Array<{ applicantType: CoverageApplicantId; categoryId: CoverageCategoryId; count: number }>;
  benefitLimit?: {
    applicantType: CoverageApplicantId;
    incomeFraction: number;
    defaultMaximum: number;
    caps: Array<{ when: { minimumAgeYears?: number; maximumAgeYears?: number; selfEmployedLessThanYears?: number }; maximum: number; requiredWaitingPeriod?: string; requiredBenefitPeriod?: string }>;
  };
};
export type CoverageUnderwritingBand = {
  scope: CoverageScope;
  minimumAgeYears: number;
  maximumAgeYears: number;
  minimumAmount: number;
  maximumAmount: number;
  underwritingType?: CoverageUnderwritingType;
  label: string;
  minimumAmountExclusive?: boolean;
  status: "documented" | "underwriting-unspecified";
};

export type CoverageDefinition = {
  requirements?: CoverageRequirements;
  underwritingBands?: CoverageUnderwritingBand[];
  underwritingBandsStatus?: "requires-age-reconciliation" | "confirmed";
  id: string;
  code: string;
  categoryId: CoverageCategoryId;
  name: string;
  /** Backend product identifiers; scoped variants override the default for matching applicants/classes. */
  gNumber?: ScopedIdentifierSet<ProductIdentifierSet>;
  planCode: ScopedIdentifierSet<PlanCodeIdentifierSet>;
  /** Policy-issuing jurisdiction; independent from residency availability rules. */
  groupPolicySitus?: string;
  /** External product brochure or certificate URL. */
  brochureUrl?: string;
  featured?: boolean;
  underwritingType: CoverageUnderwritingType;
  definition: string;
  description?: string;
  /** Note displayed per-applicant inside the product card (supports {maxAmount} placeholder) */
  coverageNote?: string;
  /** Per-applicant info notes displayed above the applicant fields */
  applicantNotes?: Partial<Record<CoverageApplicantId, string>>;
  /** Product-level alert displayed below the product description */
  productWarning?: {
    severity: "warning" | "info";
    title?: string;
    message: string;
  };
  /** Structured content block displayed below the product warning */
  productContent?: Array<
    | { type: "heading"; text: string }
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[] }
    | { type: "section"; heading: string; body: string[] }
  >;
  applicants: CoverageApplicantId[];
  coverageAmounts?: CoverageAmountAssignment[];
  options: {
    id: string;
    type: string;
    label?: string;
    choices: unknown[];
  }[];
  riders?: RiderDefinition[];
  waitingPeriodOptions?: WaitingPeriodOption[];
  waitingPeriodOptionsByApplicant?: Partial<
    Record<CoverageApplicantId, WaitingPeriodOption[]>
  >;
  maxBenefitPeriodOptions?: MaxBenefitPeriodOption[];
  maxBenefitPeriodOptionsByApplicant?: Partial<
    Record<CoverageApplicantId, MaxBenefitPeriodOption[]>
  >;
};

export type CoverageCategoryEntityId = string;
export type RiderId = string;
export type CoverageCategory = { id: CoverageCategoryEntityId; label: string };
export type CoverageProduct = { id: CoverageId; categoryId: CoverageCategoryEntityId; name: string };
export type Rider = { id: RiderId; name: string };
