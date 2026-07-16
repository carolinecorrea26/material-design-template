export type CoverageCategoryId = "LI" | "AD" | "DI" | "OO" | "SH";

export type CoverageApplicantId = "member" | "spouse" | "child";

export type CoverageUnderwritingType = "FUW" | "GI" | "NA" | "QD" | "SI";

export type RiderDefinition = {
  id: string;
  name: string;
  description: string;
  /** If true, the rider also has a coverage amount selection */
  hasAmount?: boolean;
  minAmount?: number;
  maxAmount?: number;
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
  minAmount?: number;
  maxAmount?: number;
  amountStep?: number;
  spouseMinAmount?: number;
  spouseMaxAmount?: number;
  spouseAmountStep?: number;
  childMinAmount?: number;
  childMaxAmount?: number;
  childAmountStep?: number;
  options: {
    id: string;
    type: string;
    choices: unknown[];
  }[];
  riders?: RiderDefinition[];
  waitingPeriodOptions?: WaitingPeriodOption[];
  maxBenefitPeriodOptions?: MaxBenefitPeriodOption[];
};
