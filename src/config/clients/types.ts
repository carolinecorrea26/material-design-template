import type { CoverageCategoryId } from "../coverageCategories";
import type {
  CoverageAmountAssignment,
  CoverageApplicantId,
  CoverageUnderwritingType,
  PlanCodeIdentifierSet,
  ProductIdentifierSet,
  ScopedIdentifierSet,
} from "../coverages/types";
import type { CoverageId } from "../../types";
import type { PageId } from "../../types";
import type { ClientId } from "../../types";
import type { FieldDefinition } from "../fields/types";
import type { PageSectionId } from "../pageSections/types";
import type { FormTemplate } from "../template/resolveTemplate";
import type { FlowDefinition, FlowId } from "../../content/docs/flows/types";

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
    organization?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
};

export type ClientPages = {
  requirements?: Partial<
    Record<"beneficiary" | "payment", ClientPageRequirement>
  >;
  /** @deprecated Use requirements with mode "none" instead. */
  excluded?: PageId[];
  /** @deprecated Use requirements with mode "optional" instead. */
  optional?: PageId[];
};

export type ClientPageRequirement = "required" | "optional" | "none";

export type ClientRiderConfig = {
  id: string;
  name: string;
  description: string;
  hasAmount?: boolean;
  coverageAmounts?: CoverageAmountAssignment[];
  applicants?: ("member" | "spouse" | "child")[];
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
  /** External product brochure or certificate URL. */
  brochureUrl?: string;
  categoryId?: CoverageCategoryId;
  gNumber?: ScopedIdentifierSet<ProductIdentifierSet>;
  planCode?: ScopedIdentifierSet<PlanCodeIdentifierSet>;
  groupPolicySitus?: string;
  riders?: ClientRiderConfig[];
  waitingPeriodOptions?: ClientWaitingPeriodConfig[];
  waitingPeriodOptionsByApplicant?: Partial<
    Record<"member" | "spouse" | "child", ClientWaitingPeriodConfig[]>
  >;
  maxBenefitPeriodOptions?: ClientMaxBenefitPeriodConfig[];
  maxBenefitPeriodOptionsByApplicant?: Partial<
    Record<"member" | "spouse" | "child", ClientMaxBenefitPeriodConfig[]>
  >;
  applicants?: ("member" | "spouse" | "child")[];
  coverageNote?: string;
  featured?: boolean;
  underwritingType?: CoverageUnderwritingType;
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

export type ClientAmountByFrequency = {
  monthly?: number;
  annual?: number;
};

export type ClientProductEstimatedCostBreakdown = {
  enabled?: boolean;
  policyFee?: {
    label?: string;
    amount: ClientAmountByFrequency;
  };
  childApplicantRider?: {
    enabled?: boolean;
    label?: string;
    amount?: ClientAmountByFrequency;
  };
};

export type ClientCoverages = {
  categories?: CoverageCategoryId[];
  enabled?: CoverageId[];
  /** Replaces global amount assignments with the same exact scope; unmatched scopes are inherited. */
  coverageAmounts?: Partial<Record<CoverageId, CoverageAmountAssignment[]>>;
  descriptions?: Partial<Record<CoverageId, string>>;
  overrides?: Partial<Record<CoverageId, ClientCoverageOverrides>>;
  /** When true, all coverage category accordions are expanded by default. */
  allCategoriesExpanded?: boolean;
  estimatedRateDisplay?: ClientEstimatedRateDisplay;
  /**
   * Controls the wording of the "apply for additional coverage" warning on the Coverage page.
   * "applyForAdditional" (default): "...apply only for the additional coverage you want."
   * "applyForTotal": "...apply for the total amount of coverage you want (amount you currently have + amount you're requesting)."
   */
  additionalCoverageWarning?: "applyForAdditional" | "applyForTotal";
  /** Product-card estimated cost breakdown config (optional per client). */
  productEstimatedCostBreakdown?: ClientProductEstimatedCostBreakdown;
  /** Override the default coverage category section header labels (e.g. "Office Overhead Expense"). */
  categorySectionLabels?: Partial<Record<CoverageCategoryId, string>>;
  /** When true, the quote tool and coverage questions skip the smoker/nicotine question for this client. */
  hideSmokerQuestion?: boolean;
};

export type ApplicantClassification = {
  id: string;
  label: string;
  applicantType: CoverageApplicantId;
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

export type HomePageVariant =
  | "default"
  | "hero-image"
  | "welcome-back"
  | "quoteFirst";

export type ThemeColorId = "default" | "teal" | "purple" | "dark-blue";

export type ClientThemeConfig =
  | {
      type: "preset";
      preset: ThemeColorId;
      primary?: never;
    }
  | {
      type: "custom";
      primary: `#${string}`;
      preset?: never;
    };

/** Single labeled source for ThemeColorId, so a new theme value only needs updating here and in theme.ts. */
export const themeColorLabels: Record<ThemeColorId, string> = {
  default: "Default",
  teal: "Teal",
  purple: "Purple",
  "dark-blue": "Dark Blue",
};

export type ClientFeatures = {
  chat?: boolean;
  chatUrl?: string;
  scheduleUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  homePageVariant?: HomePageVariant;
  defaultTemplate?: FormTemplate;
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

export type ClientApplicantLabels = {
  member?: string;
  spouse?: string;
  child?: string;
};

export type ClientSiteUrls = {
  testing?: string;
  preProduction?: string;
  production?: string;
};


export type ClientFlows = {
  /** Client-specific replacements for global flow definitions. Resolved through resolveClientFlows. */
  overrides?: Partial<Record<FlowId, FlowDefinition>>;
};

export type ClientEmailSupportOverride = {
  phone?: string;
  email?: string;
  website?: string;
};

export type ClientEmailContactOverride = {
  name?: string;
  acronym?: string;
};

export type ClientEmailSupport = {
  /** When true, suppresses the "Questions? We're here to help" contact box in this client's outbound emails. */
  hideContactBox?: boolean;
  /** Overrides the client-configured phone/email/website shown in the email support box. */
  supportOverride?: ClientEmailSupportOverride;
  /** Overrides the client-configured name/acronym used for the contact shown in the email support box. */
  contactOverride?: ClientEmailContactOverride;
};

export type ClientConfig = {
  id: ClientId;
  /**
   * Groups multiple ClientConfig entries as sites of one logical client for
   * site-selection UI (e.g. Site Details' client picker). Defaults to `id`
   * when omitted, i.e. every client is its own single-site group unless
   * stated otherwise. See src/config/clients/clientGroups.ts.
   */
  clientGroupId?: string;
  /** Short label distinguishing this site within its clientGroupId (e.g. "Multi-step (default)"). */
  siteLabel?: string;
  branding: ClientBranding;
  support: ClientSupport;
  pages: ClientPages;
  coverages: ClientCoverages;
  /** Stable client-owned labels referenced by scoped coverage configuration. */
  applicantClassifications?: ApplicantClassification[];
  fields: ClientFields;
  /** Client-specific flow overrides; global flows remain the baseline source of truth. */
  flows?: ClientFlows;
  /** Per-client configuration for the "Questions? We're here to help" contact box in outbound emails. */
  emailSupport?: ClientEmailSupport;
  /** @deprecated Content is now managed in src/content/. This field is unused. */
  content?: ClientContent;
  features?: ClientFeatures;
  /** Site-level brand color input. Semantic and neutral colors remain application-controlled. */
  theme?: ClientThemeConfig;
  licenseInfo?: string[];
  coverageQuestions?: ClientCoverageQuestions;
  /** Override default applicant section header labels. Max 20 chars each. */
  applicantLabels?: ClientApplicantLabels;
  /** Deployment environment links for this client's site. Unset until provisioned. */
  siteUrls?: ClientSiteUrls;
  /** Query-string parameters (from src/content/docs/urlParameters.ts) this client actually uses in live URLs. Unset/empty until confirmed. */
  urlParametersInUse?: string[];
};
