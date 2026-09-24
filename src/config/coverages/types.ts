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
  | "FUW"
  | "GI"
  | "NA"
  | "QD"
  | "SI"
  | "TELE";

export type RiderDefinition = {
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

export type CoverageDefinition = {
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
