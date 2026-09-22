// ---------------------------------------------------------------------------
// Configurations data
//
// Extracted from src/pages/InformationArchitecture.tsx (Configurations
// section). Note: featureStatusDisplay (keyed on FeatureImplementationStatus)
// lives next to configurationsData in the source file, but it describes
// feature-implementation status display, not configuration rows/groups — it
// belongs conceptually with features.ts and was intentionally left in place
// rather than duplicated here.
// ---------------------------------------------------------------------------

export type ConfigurationScope = "Global" | "Client Configurable";

export function getConfigurationGroupAnchor(group: string): string {
  return `configuration-group-${group
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export type ConfigRow = {
  group: string;
  label: string;
  name: string; // code-style key shown as secondary identifier
  description: string;
  sourcePath: string;
  scope: ConfigurationScope;
  usedIn: string;
};

export type ConfigurationPage = {
  /** The registered page used for canonical Site Details ordering. */
  id: string;
  /** The user-facing value shown in the table's Page column. */
  label: string;
};

const CONFIGURATION_PAGE_BY_NAME: Partial<Record<string, ConfigurationPage>> = {
  "ClientConfig.features.homePageVariant": { id: "home", label: "Home" },
  "ClientConfig.features.defaultTemplate": { id: "home", label: "Home" },
  "ClientConfig.features.chat / chatUrl": { id: "home", label: "Home" },
  "ClientConfig.features.scheduleUrl": { id: "home", label: "Home" },
  "ClientConfig.features.linkUrl / linkLabel": { id: "home", label: "Home" },
  "content.home.hero.*": { id: "home", label: "Home" },
  "content.home.clientSection": { id: "home", label: "Home" },
  "content.home.howApplyingWorks / applyingSteps": { id: "home", label: "Home" },
  "content.home.coverageOptions": { id: "home", label: "Home" },
  "content.home.nylCredentials": { id: "home", label: "Home" },
  "ClientConfig.pages.requirements.beneficiary / payment": {
    id: "beneficiary",
    label: "Beneficiary / Payment",
  },
  "ClientConfig.coverages.categories": { id: "coverage", label: "Coverage" },
  "ClientConfig.coverages.categorySectionLabels / allCategoriesExpanded": {
    id: "coverage",
    label: "Coverage",
  },
  "ClientConfig.coverages.additionalCoverageWarning": { id: "coverage", label: "Coverage" },
  "content.coverage.categoryDescriptions": { id: "coverage", label: "Coverage" },
  "categoryMaxAggregateNotes / clientMaxAggregateNoteOverrides": {
    id: "coverage",
    label: "Coverage",
  },
  setCoverageAmount: { id: "coverage", label: "Coverage" },
  setCoverageOrder: { id: "coverage", label: "Coverage" },
  "ClientConfig.coverages.enabled / overrides": { id: "coverage", label: "Coverage" },
  "ranges[productId] (min / max / amountStep / spouse* / child*)": {
    id: "coverage",
    label: "Coverage",
  },
  "overrides[].waitingPeriodOptions / maxBenefitPeriodOptions": {
    id: "coverage",
    label: "Coverage",
  },
  "overrides[].riders": { id: "coverage", label: "Coverage" },
  "ClientConfig.estimatedRateDisplay": { id: "coverage", label: "Coverage" },
  "productEstimatedCostBreakdown / policyFee / childApplicantRider": {
    id: "coverage",
    label: "Coverage",
  },
  "ClientConfig.coverageQuestions": { id: "coverage", label: "Coverage" },
  "ClientConfig.coverages.hideSmokerQuestion": { id: "coverage", label: "Coverage" },
  "ClientConfig.fields.eligibility.extra": { id: "eligibility", label: "Eligibility" },
  setState: { id: "eligibility", label: "Eligibility" },
  "ClientConfig.emailSupport.hideContactBox": {
    id: "mock-email-preview",
    label: "Mock Email Preview",
  },
  "ClientConfig.emailSupport.supportOverride": {
    id: "mock-email-preview",
    label: "Mock Email Preview",
  },
  "ClientConfig.emailSupport.contactOverride": {
    id: "mock-email-preview",
    label: "Mock Email Preview",
  },
};

export function getConfigurationPage(config: Pick<ConfigRow, "name">): ConfigurationPage {
  return CONFIGURATION_PAGE_BY_NAME[config.name] ?? { id: "global", label: "Global" };
}

/**
 * Human-readable values a newly provisioned client receives before applying
 * any client-specific overrides. Keep these concrete: this column documents
 * the shipped template, not whether an override object happens to be absent.
 */
const CONFIGURATION_DEFAULT_DISPLAY: Partial<Record<string, string>> = {
  "ClientConfig.branding": "No shared identity — client name, acronym, logo, and logo alt text are required per client.",
  "ClientConfig.theme": "Primary blue (#0668FF; light #5C94FF; dark #034CBA)",
  "ClientConfig.applicantLabels": "You; Your Spouse; Your Child(ren)",
  "ClientConfig.support.phone / phoneDisplay / phoneHours": "No shared contact details — supplied per client.",
  "ClientConfig.support.email / website / address": "No shared contact details — supplied per client.",
  "ClientConfig.licenseInfo[]": "None",
  "ClientConfig.emailSupport.hideContactBox": "No — show the contact box",
  "ClientConfig.emailSupport.supportOverride": "None — use the client's standard support details",
  "ClientConfig.emailSupport.contactOverride": "None — use the client's standard name and acronym",
  "ClientConfig.features.homePageVariant": "Default — inline quote tool, How Applying Works, and Coverage Options",
  "ClientConfig.features.defaultTemplate": "Multi-step",
  "ClientConfig.features.chat / chatUrl": "Disabled; no chat URL",
  "ClientConfig.features.scheduleUrl": "None — Schedule a call is hidden",
  "ClientConfig.features.linkUrl / linkLabel": "None — custom action is hidden",
  "content.home.hero.*":
    'Tagline: “Simple • Secure • Member-only rates”; title: “Safeguard your financial future.”; subtext: “Coverage designed exclusively for {client name} members. Get started today!”; primary CTA: “Begin application”; secondary CTA: “Learn more”; resume prompt/link: “Already started an application?” / “Continue here”',
  "content.home.clientSection": "None — section is hidden",
  "content.home.howApplyingWorks / applyingSteps":
    '“How does applying work?” / “Three simple steps from application to coverage.”; steps: Apply online in minutes, Answer health questions, Get your decision',
  "content.home.coverageOptions":
    '“Your coverage options” / “Learn more about the coverage available to you.”',
  "content.home.nylCredentials":
    'New York Life Insurance Company — “A trusted name for over 180 years”; A++ / AAA / Aa1 / AA+ ratings; reports as of 09/30/2025',
  "ClientConfig.pages.requirements.beneficiary / payment": "Both pages required",
  formFlow: "Home, Membership, Eligibility, Coverage, Profile, Beneficiary, Contact, Review, E-sign, applicable Health page(s), Payment, Receipt",
  "pages / pageGroups / progressSteps": "Canonical registered-page, page-group, and progress-step definitions",
  "ClientConfig.coverages.categories": "No global enabled-category list — supplied per client",
  "ClientConfig.coverages.categorySectionLabels / allCategoriesExpanded":
    "Life; Accidental Death and Dismemberment; Disability; Office Overhead; Supplemental Health; accordions collapsed",
  "ClientConfig.coverages.additionalCoverageWarning": "Apply for additional coverage",
  "content.coverage.categoryDescriptions": "Shared category descriptions from the global content defaults",
  "categoryMaxAggregateNotes / clientMaxAggregateNoteOverrides":
    "Life: $2,000,000 aggregate maximum for member and spouse; no note for other categories",
  setCoverageAmount: "Not configured — applicant can change the amount",
  setCoverageOrder: "Not configured",
  "ClientConfig.coverages.enabled / overrides": "No global product selection or product overrides — supplied per client",
  "ranges[productId] (min / max / amountStep / spouse* / child*)": "No global ranges — supplied per client/product",
  "overrides[].waitingPeriodOptions / maxBenefitPeriodOptions": "Product defaults; no client override",
  "overrides[].riders": "Product defaults; no client override",
  "ClientConfig.estimatedRateDisplay": "Monthly display; frequency toggle hidden",
  "productEstimatedCostBreakdown / policyFee / childApplicantRider": "Disabled; no supplemental fees",
  "ClientConfig.coverageQuestions": "Shared default personal, work/income, and business question sections",
  "ClientConfig.coverages.hideSmokerQuestion": "No — show smoker/nicotine question when applicable",
  fieldCatalog: "Shared field catalog definitions",
  "ClientConfig.fields[pageId].extra / hidden / required / overrides": "Shared page fields with no client overrides",
  "ClientConfig.fields.eligibility.extra": "None",
  setState: "Not configured — applicant can select state",
  "content.pages[pageId].title / subhead / navTitle / infoNote": "Shared page titles, subheads, navigation titles, and info notes from src/content/defaults/pages.ts",
  "content.pages[pageId].sectionNotes": "None unless defined in shared page content",
  "content.help": "Shared help-panel content from src/content/defaults/help.ts",
  "content.navigation": "Shared transition messages, progress labels, and Back message",
  "content.footer": "Shared New York Life underwriter, ratings, legal copy, Terms of Use, and Privacy Notice content",
  pageSections: "Shared page-section and field mappings",
  "constants / coverageConstants": "Shared application and coverage constants",
  "src/config/clients/ (10 configs)": "No single client config — each site supplies its own configuration object",
  "src/content/defaults/": "Shared home, page, help, navigation, footer, review, receipt, dialog, and status copy",
};

export function getConfigurationDefaultDisplay(config: Pick<ConfigRow, "name">): string {
  return CONFIGURATION_DEFAULT_DISPLAY[config.name] ?? "No global default configured";
}

export const configurationsData: ConfigRow[] = [
  // ── A. Client identity & branding ─────────────────────────────────────────
  {
    group: "Client identity & branding",
    label: "Client branding",
    name: "ClientConfig.branding",
    description:
      "Client name, short acronym, logo asset, and logo alt text. If the logo fails to load, the client name is displayed instead.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "AppHeader, AppShell, email templates",
  },
  {
    group: "Client identity & branding",
    label: "Site theme",
    name: "ClientConfig.theme",
    description:
      "Selects an approved preset (default, teal, purple, dark-blue) or provides one custom primary brand color. The application derives the supporting primary palette; semantic and neutral colors remain global.",
    sourcePath: "src/config/clients/*.ts / src/app/theme.ts",
    scope: "Client Configurable",
    usedIn: "ThemeProvider (global)",
  },
  {
    group: "Client identity & branding",
    label: "Applicant labels",
    name: "ClientConfig.applicantLabels",
    description:
      "Overrides the default Member/Spouse/Child headings across Coverage and applicant sections. Max 20 characters. Does not affect applicant IDs or business logic.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "ApplicantSectionDivider, CoverageQuestions",
  },
  // ── B. Support & contact ──────────────────────────────────────────────────
  {
    group: "Support & contact",
    label: "Support phone & hours",
    name: "ClientConfig.support.phone / phoneDisplay / phoneHours",
    description:
      "Machine-readable support phone, human-readable display version, and optional support hours. When configured, the help banner renders 'Call for help' with optional hours.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "ClientHelpBanner, AppFooter, AppMenu",
  },
  {
    group: "Support & contact",
    label: "Support email, website & address",
    name: "ClientConfig.support.email / website / address",
    description:
      "Support email, client website (full URL or bare domain), and structured mailing address. Each is hidden when absent.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "ClientHelpBanner, AppFooter",
  },
  {
    group: "Support & contact",
    label: "License disclosures",
    name: "ClientConfig.licenseInfo[]",
    description:
      "Array of client licensing disclosure strings shown in the footer or legal area. Rendered in configured order.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "AppFooter",
  },
  {
    group: "Support & contact",
    label: "Hide email contact box",
    name: "ClientConfig.emailSupport.hideContactBox",
    description:
      "When true, suppresses the \"Questions? We're here to help\" contact box in this client's outbound emails (autosave, pending/deletion reminders, submission confirmation, and the advisor-sent application email).",
    sourcePath: "src/config/clients/*.ts / src/utils/mockEmail.ts",
    scope: "Client Configurable",
    usedIn: "Email Templates (Global/Client tabs), outbound mock emails",
  },
  {
    group: "Support & contact",
    label: "Email support override",
    name: "ClientConfig.emailSupport.supportOverride",
    description:
      "Overrides the client-configured phone, email, and website shown in the emails' support box. Unset properties fall back individually to ClientConfig.support.",
    sourcePath: "src/config/clients/*.ts / src/utils/mockEmail.ts",
    scope: "Client Configurable",
    usedIn: "Email Templates (Global/Client tabs), outbound mock emails",
  },
  {
    group: "Support & contact",
    label: "Email contact override",
    name: "ClientConfig.emailSupport.contactOverride",
    description:
      "Overrides the client-configured name and acronym used for the contact shown in the emails' support box. Unset properties fall back individually to ClientConfig.branding.",
    sourcePath: "src/config/clients/*.ts / src/utils/mockEmail.ts",
    scope: "Client Configurable",
    usedIn: "Email Templates (Global/Client tabs), outbound mock emails",
  },
  // ── C. Landing Page behavior ──────────────────────────────────────────────
  {
    group: "Landing Page",
    label: "Landing Page variant",
    name: "ClientConfig.features.homePageVariant",
    description:
      "Selects the Landing Page composition. Three variants: default (inline quote tool + How Applying Works + Coverage Options), hero-image (hero + How Applying Works + Coverage Options, no inline quote), welcome-back (hero image only; How Applying Works and Coverage Options hidden).",
    sourcePath: "src/config/clients/*.ts / src/pages/Home.tsx",
    scope: "Client Configurable",
    usedIn: "Home page",
  },
  {
    group: "Landing Page",
    label: "Default form template",
    name: "ClientConfig.features.defaultTemplate",
    description:
      "Selects the client's default form template ('single' or 'multi', falls back to 'multi'). 'single' forces the whole app into its narrow/mobile-width responsive layout (via createAppTheme's forceMobileLayout option, regardless of actual browser width) and renders Home's hero directly followed by the real Membership page instead of a separate landing step. Overrideable per-session by the ?template= URL parameter. See the URL Parameters 'template' row for full behavior.",
    sourcePath:
      "src/config/clients/*.ts / src/config/template/resolveTemplate.ts / src/app/theme.ts / src/pages/Home.tsx",
    scope: "Client Configurable",
    usedIn: "App theme, Home page",
  },
  {
    group: "Landing Page",
    label: "Chat support",
    name: "ClientConfig.features.chat / chatUrl",
    description:
      "Enables a chat action in the help banner and optionally in the app header. Hidden when false or when no valid URL is configured.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "ClientHelpBanner, AppHeader",
  },
  {
    group: "Landing Page",
    label: "Schedule-a-call support",
    name: "ClientConfig.features.scheduleUrl",
    description:
      "Displays a 'Schedule a call' action in the help banner, opening a scheduling page in a modal.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "ClientHelpBanner",
  },
  {
    group: "Landing Page",
    label: "Custom help/action link",
    name: "ClientConfig.features.linkUrl / linkLabel",
    description:
      "Optional client-defined action link (URL + label) in the help banner. Not displayed when absent or without a valid destination.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "ClientHelpBanner",
  },
  {
    group: "Landing Page",
    label: "Hero copy",
    name: "content.home.hero.*",
    description:
      "Landing Page hero copy: tagline, title, description, CTA label, secondary CTA label, resume prompt/link label, welcome-back title and description. Supports {{clientName}} interpolation.",
    sourcePath: "src/content/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "Home page hero section",
  },
  {
    group: "Landing Page",
    label: "Client-specific homepage section",
    name: "content.home.clientSection",
    description:
      "Optional client informational block on the Landing Page with a tagline and paragraphs array. Rendered only when configured.",
    sourcePath: "src/content/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "Home page",
  },
  {
    group: "Landing Page",
    label: "How Applying Works content",
    name: "content.home.howApplyingWorks / applyingSteps",
    description:
      "Title, description, and step array (title, body, imageSrc, imageAlt) for the How Applying Works section. Present on default and hero-image variants; hidden on welcome-back.",
    sourcePath: "src/content/defaults/home.ts / src/content/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "Home page, How Applying Works modal",
  },
  {
    group: "Landing Page",
    label: "Coverage options introduction",
    name: "content.home.coverageOptions",
    description:
      "Title and description for the Coverage Options section on the Landing Page. Present on default and hero-image variants; hidden on welcome-back.",
    sourcePath: "src/content/defaults/home.ts / src/content/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "Home page",
  },
  {
    group: "Landing Page",
    label: "NYL credentials",
    name: "content.home.nylCredentials",
    description:
      "NYL name, tagline, description, ratings note, and ratings array. Centrally governed — ratings and effective dates are updated globally, not per client.",
    sourcePath: "src/content/defaults/home.ts",
    scope: "Global",
    usedIn: "Home page footer",
  },
  // ── D. Page inclusion & workflow ──────────────────────────────────────────
  {
    group: "Page inclusion & workflow",
    label: "Beneficiary & Payment page mode",
    name: "ClientConfig.pages.requirements.beneficiary / payment",
    description:
      "Controls whether Beneficiary and Payment pages are required, optional, or excluded (none). 'none' removes the page from routing, stepper, breadcrumbs, and Review. 'optional' shows a preliminary Yes/No prompt. The older pages.excluded and pages.optional arrays are deprecated.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "Router, formFlow, ProgressStep, Review",
  },
  {
    group: "Page inclusion & workflow",
    label: "Form flow",
    name: "formFlow",
    description:
      "Ordered page sequence with skip/visibility logic. Determines which pages appear in the resolved flow for a given client and coverage selection.",
    sourcePath: "src/config/formFlow.ts",
    scope: "Global",
    usedIn: "PageNav next/prev, progress calculation",
  },
  {
    group: "Page inclusion & workflow",
    label: "Page registry & progress steps",
    name: "pages / pageGroups / progressSteps",
    description:
      "Page registry (IDs, paths, types, group assignments), logical page groupings for the progress bar, and breadcrumb step definitions mapping stages to page IDs.",
    sourcePath:
      "src/config/pages.ts / src/config/pageGroups.ts / src/config/progressSteps.ts",
    scope: "Global",
    usedIn: "Router, ProgressStep, PageNav",
  },
  // ── E. Coverage categories ────────────────────────────────────────────────
  {
    group: "Coverage categories",
    label: "Enabled categories",
    name: "ClientConfig.coverages.categories",
    description:
      "Array of enabled coverage category IDs (LI, AD, DI, OO, SH) for the client. Display order follows array order. Eligibility may further reduce visible categories.",
    sourcePath: "src/config/clients/*.ts / src/config/coverageCategories.ts",
    scope: "Client Configurable",
    usedIn: "CoverageCategorySelector, ProductCatalog, form flow",
  },
  {
    group: "Coverage categories",
    label: "Category label overrides & expand behavior",
    name: "ClientConfig.coverages.categorySectionLabels / allCategoriesExpanded",
    description:
      "Per-category display label overrides and a boolean controlling whether category accordions start expanded on load.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "ProductCatalog, CoverageCategorySelector",
  },
  {
    group: "Coverage categories",
    label: "Coverage amount basis",
    name: "ClientConfig.coverages.additionalCoverageWarning",
    description:
      "Controls whether applicants enter an additional amount or a total coverage amount. Values: applyForAdditional (default) or applyForTotal.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "ProductCatalog, coverage amount logic",
  },
  {
    group: "Coverage categories",
    label: "Category descriptions",
    name: "content.coverage.categoryDescriptions",
    description:
      "Explanatory copy displayed per coverage category. Shared defaults apply unless overridden per client.",
    sourcePath: "src/content/defaults/coverage.ts / src/content/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "ProductCatalog, CoverageCategorySelector",
  },
  {
    group: "Coverage categories",
    label: "Max aggregate coverage note (info alert)",
    name: "categoryMaxAggregateNotes / clientMaxAggregateNoteOverrides",
    description:
      "Info alert shown at the top of a coverage category's product list stating the maximum aggregate amount available per member/spouse/child across policies (e.g. LI's $2,000,000 cap). Defaults apply per category unless a client override maps the category to a replacement note object or null to suppress it entirely. WAEPA overrides LI with member/spouse-only text (\"The maximum available for a member/spouse is $2,000,000.\"); AVMA overrides LI with member/spouse/child text noting the Basic Protection Package exclusion.",
    sourcePath: "src/config/coverageConstants.ts (getMaxAggregateNotes)",
    scope: "Client Configurable",
    usedIn: "ProductCatalog",
  },
  // ── F. Products & coverage options ───────────────────────────────────────
  {
    group: "Products & coverage options",
    label: "Set coverage amount",
    name: "setCoverageAmount",
    description:
      "Planned configuration. Sets the Coverage page coverage-amount dropdown to a specified amount and disables the control so the applicant cannot change it.",
    sourcePath: "Planned — not yet implemented in prototype",
    scope: "Client Configurable",
    usedIn: "Coverage page coverage amount dropdown",
  },
  {
    group: "Products & coverage options",
    label: "Set coverage amount order",
    name: "setCoverageOrder",
    description:
      "Planned configuration. Controls whether coverage-amount dropdown options are displayed in ascending or descending order.",
    sourcePath: "Planned — not yet implemented in prototype",
    scope: "Client Configurable",
    usedIn: "Coverage page coverage amount dropdown",
  },
  {
    group: "Products & coverage options",
    label: "Enabled products & overrides",
    name: "ClientConfig.coverages.enabled / overrides",
    description:
      "Array of enabled product IDs and per-product overrides: display name, category, description, featured flag, underwriting type (FUW / GI / NA / QD / SI), eligible applicant types, coverage note, product warning, structured content, and per-applicant notes.",
    sourcePath: "src/config/clients/*.ts / src/config/coverages/index.ts",
    scope: "Client Configurable",
    usedIn: "ProductCatalog, QuoteModal, health routing",
  },
  {
    group: "Products & coverage options",
    label: "Coverage amount ranges",
    name: "ranges[productId] (min / max / amountStep / spouse* / child*)",
    description:
      "Per-product coverage amount ranges and step increments for member, spouse, and child applicants. Generated options must not exceed the configured maximum.",
    sourcePath: "src/config/coverages/index.ts → ranges",
    scope: "Client Configurable",
    usedIn: "ProductCatalog, CoverageCart, QuoteModal",
  },
  {
    group: "Products & coverage options",
    label: "Waiting period & benefit period options",
    name: "overrides[].waitingPeriodOptions / maxBenefitPeriodOptions",
    description:
      "Available elimination/waiting periods (label, value, days) and maximum benefit periods for applicable DI/OO products.",
    sourcePath: "src/config/coverages/index.ts → overrides",
    scope: "Client Configurable",
    usedIn: "ProductCatalog",
  },
  {
    group: "Products & coverage options",
    label: "Rider definitions",
    name: "overrides[].riders",
    description:
      "Per-product rider definitions: name, description, hasAmount, min/max amount, premiumFactor, and health-routing rules. Rider IDs must be stable across config changes.",
    sourcePath: "src/config/coverages/index.ts → overrides[].riders",
    scope: "Client Configurable",
    usedIn: "ProductCatalog, form flow health routing",
  },
  // ── I. Premium & estimated cost display ───────────────────────────────────
  {
    group: "Premium & estimated cost",
    label: "Frequency toggle",
    name: "ClientConfig.estimatedRateDisplay",
    description:
      "Controls the monthly/annual frequency toggle and default frequency for estimated cost display.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "CoverageCart, QuoteModal, TotalCostSummary",
  },
  {
    group: "Premium & estimated cost",
    label: "Cost breakdown & supplemental fees",
    name: "productEstimatedCostBreakdown / policyFee / childApplicantRider",
    description:
      "Enables supplemental cost line items beneath product estimates: policy fee (label + monthly/annual amount) and child applicant rider fee.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "ProductCostBreakdown, CoverageCart",
  },
  // ── J. Coverage-question sections ─────────────────────────────────────────
  {
    group: "Coverage question sections",
    label: "Coverage question section rules",
    name: "ClientConfig.coverageQuestions",
    description:
      "Controls which Coverage page question sections appear: always-shown sections, removed default sections, and per-category additional sections. References stable section IDs from the shared pageSections catalog.",
    sourcePath:
      "src/config/clients/*.ts / src/config/pageSections/pageSections.ts",
    scope: "Client Configurable",
    usedIn: "CoverageQuestions",
  },
  {
    group: "Coverage question sections",
    label: "Hide smoker/nicotine question (quote tool)",
    name: "ClientConfig.coverages.hideSmokerQuestion",
    description:
      "When true, suppresses the smoker/nicotine-use question in the standalone quote tool (QuoteModal drawer and the home page's QuoteCalculator) for LI/SH category selections, regardless of category. Does not affect the real Coverage page application flow (useCoverageState), which always asks the smoker question for LI/SH — WAEPA's underwriting still requires it there, only their public quote estimator omits it.",
    sourcePath: "src/config/coverageConstants.ts (getCategoryRequirements)",
    scope: "Client Configurable",
    usedIn: "QuoteModal, QuoteCalculator",
  },
  // ── K. Field configuration ────────────────────────────────────────────────
  {
    group: "Field configuration",
    label: "Field catalog",
    name: "fieldCatalog",
    description:
      "Master field definitions: labels, input types, options, validation rules, format, placeholder, helper text, autoComplete. All field rendering flows through FieldRenderer using these definitions.",
    sourcePath: "src/config/fields/index.ts",
    scope: "Client Configurable",
    usedIn: "FieldRenderer, pageSections, form state",
  },
  {
    group: "Field configuration",
    label: "Per-page field overrides",
    name: "ClientConfig.fields[pageId].extra / hidden / required / overrides",
    description:
      "Per-client, per-page field configuration: add supported fields, hide fields, make fields required, or override supported field properties (label, placeholder, helperText, options). Hidden fields must not be required. Field IDs must exist in the catalog.",
    sourcePath: "src/config/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "FieldRenderer, pageSections",
  },
  {
    group: "Field configuration",
    label: "Client eligibility fields",
    name: "ClientConfig.fields.eligibility.extra",
    description:
      "Client-specific eligibility questions inserted into the Eligibility page. New fields must be created as reusable supported field definitions, not client-only JSX.",
    sourcePath: "src/config/clients/*.ts → clientFields/",
    scope: "Client Configurable",
    usedIn: "Eligibility page, EligibilityFields",
  },
  {
    group: "Field configuration",
    label: "Set state",
    name: "setState",
    description:
      "Planned configuration. Sets the Eligibility page state dropdown to a specified state and disables the control so the applicant cannot change it.",
    sourcePath: "Planned — not yet implemented in prototype",
    scope: "Client Configurable",
    usedIn: "Eligibility page state dropdown",
  },
  // ── L. Page, section & help content ──────────────────────────────────────
  {
    group: "Page & help content",
    label: "Page title, subtitle & info note",
    name: "content.pages[pageId].title / subhead / navTitle / infoNote",
    description:
      "Per-page content: main H1 heading, subtitle, navigation label, and an optional informational note displayed below the title.",
    sourcePath: "src/content/defaults/pages.ts / src/content/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "PageHeader, AppHeader progress, ProgressStep",
  },
  {
    group: "Page & help content",
    label: "Section notes",
    name: "content.pages[pageId].sectionNotes",
    description:
      "Informational notes keyed by section ID, displayed below specific section headings.",
    sourcePath: "src/content/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "Form pages (section rendering)",
  },
  {
    group: "Page & help content",
    label: "Help panel content",
    name: "content.help",
    description:
      "Structured help content for How Applying Works, application review, group insurance, Coverage, beneficiary allocation, field rationale, and payment handling. Client overrides merge at the property level.",
    sourcePath: "src/content/defaults/help.ts / src/content/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "HelpChips, AppMenu, helpContent.tsx",
  },
  {
    group: "Page & help content",
    label: "Navigation & transition messages",
    name: "content.navigation",
    description:
      "Route transition messages (by destination page), progress step labels (by stage ID), and the shared Back navigation message. Pages excluded from the flow must not appear in step labels.",
    sourcePath:
      "src/content/defaults/navigation.ts / src/config/transitionMessages.ts",
    scope: "Global",
    usedIn: "LoadingOverlay, ProgressStep",
  },
  // ── M. Footer, legal & compliance ─────────────────────────────────────────
  {
    group: "Footer, legal & compliance",
    label: "Footer content & ratings",
    name: "content.footer",
    description:
      "Administrator label, underwriter name and address, financial strength ratings with 'as of' date, additional legal lines, and Terms of Use / Privacy Notice links. Ratings and effective date are centrally governed. Terms of Use and Privacy Notice content are fixed and not client-configurable.",
    sourcePath: "src/content/defaults/footer.ts / src/content/clients/*.ts",
    scope: "Client Configurable",
    usedIn: "AppFooter, LegalDocList",
  },
  // ── Shared infrastructure ─────────────────────────────────────────────────
  {
    group: "Shared infrastructure",
    label: "Page sections catalog",
    name: "pageSections",
    description:
      "Section-to-field mappings per page with visibleWhen rules and applicant scoping. Client configuration should reference section IDs only; structural definitions belong here.",
    sourcePath: "src/config/pageSections/pageSections.ts",
    scope: "Client Configurable",
    usedIn: "FieldRenderer, CoverageQuestions, ApplicationDocumentPreview",
  },
  {
    group: "Shared infrastructure",
    label: "Shared constants",
    name: "constants / coverageConstants",
    description:
      "Shared UI constants (YES_NO_OPTIONS, SURFACE_SX, CARD_RADIUS) and coverage-specific constants for amount calculations.",
    sourcePath: "src/config/constants.ts / src/config/coverageConstants.ts",
    scope: "Global",
    usedIn: "FieldRenderer options, layout styles, coverage amount logic",
  },
  {
    group: "Shared infrastructure",
    label: "Client site configs",
    name: "src/config/clients/ (10 configs)",
    description:
      "Full per-client configuration objects combining branding, support, features, pages, coverages, fields, estimatedRateDisplay, and content overrides. Resolved at runtime by getActiveClient().",
    sourcePath: "src/config/clients/",
    scope: "Client Configurable",
    usedIn: "getActiveClient(), all page rendering, theme, routing",
  },
  {
    group: "Shared infrastructure",
    label: "Default content",
    name: "src/content/defaults/",
    description:
      "Shared default content used when a client does not override it: page titles, helper copy, Landing Page content, footer content, navigation messages, receipt/review content.",
    sourcePath: "src/content/defaults/",
    scope: "Global",
    usedIn: "All content-consuming components",
  },
];

/**
 * Distinct `group` values from configurationsData, ordered to roughly follow
 * the application's flow: branding/identity and shared infrastructure first
 * (they underpin everything else), then support & contact, then the Landing
 * Page, then per-page-group configuration in the order those pages/concerns
 * appear in the app flow (page inclusion/workflow → coverage categories →
 * products & coverage options → coverage question sections → premium/cost
 * display → field configuration → page & help content), with footer/legal
 * last since it's compliance/wrap-up content rather than an application step.
 */
export const applicationFlowGroupOrder: string[] = [
  "Client identity & branding",
  "Shared infrastructure",
  "Support & contact",
  "Landing Page",
  "Page inclusion & workflow",
  "Coverage categories",
  "Products & coverage options",
  "Coverage question sections",
  "Premium & estimated cost",
  "Field configuration",
  "Page & help content",
  "Footer, legal & compliance",
];
