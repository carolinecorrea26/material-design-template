import type { CoverageCategoryId } from "../coverageCategories";
import type { CoverageId } from "../../types";
import type { PageId } from "../../types";
import type { ClientId } from "../../types";
import type { FieldDefinition } from "../fields/types";
import type { PageSectionId } from "../pageSections/types";

export type FieldId = string;

export type ClientBranding = {
  name: string;
  acronym: string;
  logo: string;
  logoAlt: string;
};

export type ClientSupport = {
  phone?: string;
  phoneDisplay?: string;
  phoneHours?: string;
  email?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
};

export type ClientPages = {
  excluded?: PageId[];
  optional?: PageId[];
};

export type ClientRiderConfig = {
  id: string;
  name: string;
  description: string;
  hasAmount?: boolean;
  minAmount?: number;
  maxAmount?: number;
  premiumFactor: number;
};

export type ClientWaitingPeriodConfig = {
  label: string;
  value: string;
  days: number;
};

export type ClientMaxBenefitPeriodConfig = {
  label: string;
  value: string;
};

export type ClientCoverageRangeConfig = {
  min?: number;
  max?: number;
  amountStep?: number;
  spouseMin?: number;
  spouseMax?: number;
  spouseAmountStep?: number;
  childMin?: number;
  childMax?: number;
  childAmountStep?: number;
};

export type CoverageApplicantNotes = Partial<
  Record<"member" | "spouse" | "child", string>
>;

export type CoverageProductWarning = {
  severity: "warning" | "info";
  /** Bold title line (rendered separately, 16px bold) */
  title?: string;
  message: string;
};

export type ProductContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "section"; heading: string; body: string[] };

export type ClientCoverageOverrides = {
  name?: string;
  categoryId?: CoverageCategoryId;
  riders?: ClientRiderConfig[];
  waitingPeriodOptions?: ClientWaitingPeriodConfig[];
  maxBenefitPeriodOptions?: ClientMaxBenefitPeriodConfig[];
  applicants?: ("member" | "spouse" | "child")[];
  coverageNote?: string;
  featured?: boolean;
  underwritingType?: "FUW" | "GI" | "NA" | "QD" | "SI";
  /** Per-applicant info notes displayed above the applicant fields */
  applicantNotes?: CoverageApplicantNotes;
  /** Product-level alert displayed below the product description */
  productWarning?: CoverageProductWarning;
  /** Structured content block displayed below the product warning */
  productContent?: ProductContentBlock[];
};

export type EstimatedRateFrequency = "monthly" | "annual";

export type ClientEstimatedRateDisplay = {
  showFrequencyToggle?: boolean;
  defaultFrequency?: EstimatedRateFrequency;
};

export type ClientCoverages = {
  categories?: CoverageCategoryId[];
  enabled?: CoverageId[];
  ranges?: Partial<Record<CoverageId, ClientCoverageRangeConfig>>;
  descriptions?: Partial<Record<CoverageId, string>>;
  overrides?: Partial<Record<CoverageId, ClientCoverageOverrides>>;
  /** When true, all coverage category accordions are expanded by default. Otherwise only the first is expanded. */
  allCategoriesExpanded?: boolean;
  estimatedRateDisplay?: ClientEstimatedRateDisplay;
};

export type ClientFields = Partial<
  Record<
    PageId,
    {
      extra?: FieldId[];
      hidden?: FieldId[];
      required?: FieldId[];
      overrides?: Partial<Record<FieldId, Partial<FieldDefinition>>>;
    }
  >
>;

export type ClientContent = {
  global?: {
    banners?: string[];
    disclaimers?: string[];
  };
  pages?: Partial<
    Record<
      PageId,
      {
        intro?: string;
        help?: string[];
        banners?: string[];
        disclaimers?: string[];
      }
    >
  >;
};

export type HomePageVariant = "default" | "hero-image" | "welcome-back";

export type ThemeColorId = "default" | "teal" | "purple" | "dark-blue";

export type ClientFeatures = {
  chat?: boolean;
  homePageVariant?: HomePageVariant;
};

/**
 * Defines how coverage question sections are shown per category.
 *
 * The default behavior uses hardcoded section sets in CoverageQuestions
 * (defaultPersonalSections, defaultWorkIncomeSections, defaultBusinessSections).
 * Clients can layer on top of defaults in three ways:
 *
 * - `always`: sections always shown when any category is selected (additive)
 * - `removeDefaults`: section IDs to suppress from the default sets entirely
 * - Per-category arrays: additional sections shown when that category is selected (additive)
 */
export type ClientCoverageQuestions = {
  /** Sections always shown when any category is selected. */
  always?: PageSectionId[];
  /** Section IDs to remove from the default section sets for all categories. */
  removeDefaults?: PageSectionId[];
} & Partial<Record<CoverageCategoryId, PageSectionId[]>>;

export type ClientConfig = {
  id: ClientId;
  branding: ClientBranding;
  support: ClientSupport;
  pages: ClientPages;
  coverages: ClientCoverages;
  fields: ClientFields;
  /** @deprecated Content is now managed in src/content/. This field is unused. */
  content?: ClientContent;
  features?: ClientFeatures;
  themeColor?: ThemeColorId;
  licenseInfo?: string[];
  coverageQuestions?: ClientCoverageQuestions;
};
