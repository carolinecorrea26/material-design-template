import type { CoverageCategoryId } from "./coverage";
import type {
  CoverageAmountAssignment,
  CoverageApplicantId,
  CoverageUnderwritingType,
  PlanCodeIdentifierSet,
  ProductIdentifierSet,
  ScopedIdentifierSet,
} from "./coverage";
import type { CoverageId } from "./identities";
import type { PageId } from "./identities";
import type { ClientId } from "./identities";
import type { FieldDefinition } from "./fields";
import type { PageSectionId } from "../config/pageSections/types";
import type { FormTemplate } from "../config/template/resolveTemplate";
import type { FlowDefinition, FlowId } from "./flows";

export type FieldId = string;

export type ClientBranding = {
  name: string;
  acronym: string;
  logo: string;
  logoAlt: string;
  /** Optional client artwork; missing assets use the standard portal icon. */
  icons?: { quickDecision?: string; categories?: Partial<Record<CoverageCategoryId, string>> };
};

export type ClientSupportContact = {
  contactName?: string;
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

export type ClientSupport = ClientSupportContact & {
  /** A separately sourced phone for the help ribbon and coverage breakdown. */
  helpPhone?: { phone: string; phoneDisplay: string };
  /** Preserve sales contacts separately from the program administrator. */
  salesContact?: ClientSupportContact;
};

export type ClientPages = {
  /** Derived compatibility view; authored participation lives in sitePages. */
  participationSource?: "sitePages";
  requirements?: Partial<Record<PageId, ClientPageRequirement>>;
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
  requirements?: import("./coverage").CoverageRequirements;
  rateInputs?: import("./rateInputPolicy").RateInputPolicy;
  underwritingBands?: import("./coverage").CoverageUnderwritingBand[];
  underwritingBandsStatus?: "requires-age-reconciliation" | "confirmed";
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
  amountSelection?: {
    order?: "minimum-to-maximum" | "maximum-to-minimum";
    defaultMode?: "minimum" | "specified";
    defaultValue?: number;
    locked?: boolean;
  };
  /** Product order within category; omitted products inherit the global JSON order. */
  productOrder?: CoverageId[];
  /** Display order override; omitted categories follow the canonical default order. */
  categoryOrder?: CoverageCategoryId[];
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

export type ClientThemeConfig = (
  | {
      type: "preset";
      preset: ThemeColorId;
      primary?: never;
    }
  | {
      type: "custom";
      primary: `#${string}`;
      preset?: never;
    }
) & {
  /** Optional filled-primary-button override; omitted buttons use the theme's primary color. */
  primaryAction?: { main: `#${string}`; tone: "light" | "dark" };
  /** Normal buttons use the shared shape radius unless pill is selected. */
  buttonShape?: "standard" | "pill";
};

/** Single labeled source for ThemeColorId, so a new theme value only needs updating here and in theme.ts. */
export const themeColorLabels: Record<ThemeColorId, string> = {
  default: "Default",
  teal: "Teal",
  purple: "Purple",
  "dark-blue": "Dark Blue",
};

export type ClientFeatures = {
  /** Prototype verification trigger expressed as fact matches. */
  memberVerificationMatchFacts?: Record<string, string>;
  chat?: boolean;
  chatUrl?: string;
  scheduleUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  homePageVariant?: HomePageVariant;
  applyingStepsPresentation?: "image" | "animated";
  /** Optional decorative scene, used only by the single-page template. */
  singlePageArtwork?: "none" | "clouds-cat-umbrella";
  defaultTemplate?: FormTemplate;
};

/**
 * Defines how coverage question sections are shown per category.
 *
 * The default behavior is resolved centrally by
 * resolveCoverageQuestionSections.
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
  applicantExperience?: import("./applicantExperience").ApplicantExperience;
  id: ClientId;
  branding: ClientBranding;
  support: ClientSupport;
  pages: ClientPages;
  coverages: ClientCoverages;
  /** Stable client-owned labels referenced by scoped coverage configuration. */
  applicantClassifications?: ApplicantClassification[];
  fields: ClientFields;
  /** Ordered notice/field blocks, rendered before Review navigation. */
  reviewPolicy?: import("./reviewPolicy").ReviewPolicy;
  /** Client-specific flow overrides; global flows remain the baseline source of truth. */
  flows?: ClientFlows;
  /** Client-owned TPA policy; prototype records stand in for API responses. */
  tpaIntegration?: {
    mode: "coverage-verification" | "membership-auto-approval";
    lookupFields: string[];
    requireAddressBeforeVerification?: boolean;
    prototypeRecords?: Array<{ facts: Record<string, string>; activeCoverage: boolean }>;
  };
  /** Per-client configuration for the "Questions? We're here to help" contact box in outbound emails. */
  emailSupport?: ClientEmailSupport;
  /** @deprecated Content is now managed in src/content/. This field is unused. */
  content?: ClientContent;
  features?: ClientFeatures;
  /** Site-level theme palette, including brand, semantic, background and text colors. */
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

export type ConfigurationId = `config-${string}`;
export type ConfigurationDefinition = { id: ConfigurationId; name: string; scope: string };
