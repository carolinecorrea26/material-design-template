// ---------------------------------------------------------------------------
// URL parameters data
//
// Extracted from src/pages/InformationArchitecture.tsx (URL Parameters section).
// ---------------------------------------------------------------------------

export type UrlParamStatus = "Migrated" | "Modified" | "Removed" | "New" | "TBD";

export const urlParamStatusColor: Record<
  UrlParamStatus,
  "success" | "info" | "default" | "primary" | "warning"
> = {
  Migrated: "success",
  Modified: "info",
  Removed: "default",
  New: "primary",
  TBD: "warning",
};

export type UrlParameterEntry = {
  parameter: string;
  currentValues: string[];
  currentBehavior: string[];
  status: UrlParamStatus;
  newValues: string[];
  newBehavior: string[];
  notes: string;
};

// Current-template parameter inventory: migrated / modified / removed / TBD
// status in the new template. Transcribed from
// New_Template_URL_Parameters_Spec_Full.md ("Parameter Requirements").
export const urlParameters: UrlParameterEntry[] = [
  {
    parameter: "form",
    currentValues: ["advisor", "pageName"],
    currentBehavior: [
      "Directs to advisor login page.",
      "Directs to specified page (e.g. launchScreen, membershipForm, eligibility, resumeEmailConfirmation, advisor)",
    ],
    status: "Migrated",
    newValues: ["advisor", "pageName"],
    newBehavior: [
      "advisor: Directs to advisor login page.",
      "pageName: Directs to the specified page.",
    ],
    notes:
      "Same parameter format as current template. Page names supported by pageName may differ from the current template and must use valid new-template page names.",
  },
  {
    parameter: "apply",
    currentValues: ["form"],
    currentBehavior: [
      "Directs to first page of application (skips landing page).",
    ],
    status: "Migrated",
    newValues: ["form"],
    newBehavior: [
      "Directs to the first page of the application and skips the Landing Page.",
    ],
    notes: "Same format and behavior as current template.",
  },
  {
    parameter: "applicant",
    currentValues: ["member", "member,spouse"],
    currentBehavior: [
      "Site only allows for member to apply. Hides question \"This insurance is for\" on eligibility page.",
    ],
    status: "Modified",
    newValues: ["member", "member,spouse"],
    newBehavior: [
      "member: Only the member can apply. The Eligibility Page question “Would you like to add dependent coverage?” is hidden. Content that communicates dependent availability is also hidden, including the “Available for: You, Your Spouse, Your Child(ren)” sentence in the About Coverage component.",
      "member,spouse: Only the member and/or spouse can apply. On the Eligibility Page, the “Child” option is hidden from the “Would you like to add dependent coverage?” question. Content that communicates child availability is also hidden, including the “Available for: You, Your Spouse, Your Child(ren)” sentence in the About Coverage component.",
    ],
    notes:
      "Same parameter values as current template; behavior is updated for the new-template dependent coverage UI/content.",
  },
  {
    parameter: "category",
    currentValues: ["li", "di", "oo", "sh", "ad (TBD)"],
    currentBehavior: [
      "Isolates life coverage category to be only option shown throughout site.",
      "Isolates disability coverage category to be only option shown throughout site.",
      "Isolates office overhead coverage category to be only option shown throughout site.",
      "Isolates supplemental health coverage category to be only option shown throughout site.",
      "Isolates AD&D coverage category to be only option shown throughout site (hides quote tool on landing page, smoker question on eligibility page, needs calculators on coverage page).",
    ],
    status: "Modified",
    newValues: [
      "li",
      "di",
      "oo",
      "sh",
      "ad",
      "Comma-separated values supported, e.g. li,di",
    ],
    newBehavior: [
      "Restricts the site to the listed coverage category or categories. Only the specified category/categories are displayed throughout the site and Quote Tool. Supports either a single category or multiple comma-separated categories. AD is supported as a separate coverage category.",
    ],
    notes: "Replaces the current categories parameter for multi-category use.",
  },
  {
    parameter: "categories",
    currentValues: ["li,di,oo,sh"],
    currentBehavior: [
      "Isolates 2 to 3 coverage categories to be only options shown throughout site. List categories in URL parameter with comma-separated list.",
    ],
    status: "Migrated",
    newValues: [
      "li",
      "di",
      "oo",
      "sh",
      "ad",
      "Comma-separated values supported, e.g. li,di",
    ],
    newBehavior: [
      "Has the same functionality as the category parameter in the new template. Restricts the site to the listed coverage category or categories, using comma-separated values for multiple categories.",
    ],
    notes: "Combined into the category parameter, which supports the same comma-separated multi-category behavior.",
  },
  {
    parameter: "prods",
    currentValues: ["G-0000-0,G-1111-1"],
    currentBehavior: [
      "Isolates identified product(s) to be only options shown. List products (G-numbers) in parameter with comma-separated list. Note: Must be used with category or categories parameter.",
    ],
    status: "Migrated",
    newValues: ["G-0000-0", "Multiple products: comma-separated G-numbers"],
    newBehavior: [
      "Restricts product display to the listed product(s) throughout the site on pages/components that display products, including the Landing Page, Coverage Page, and application menu.",
    ],
    notes:
      "Must be used with the category parameter. The categories parameter is not supported in the new template.",
  },
  {
    parameter: "dprods",
    currentValues: ["G-0000-0,G-1111-1"],
    currentBehavior: [
      "Disables selected product(s) coverage amount dropdown; should be used in combination with prods and amt",
    ],
    status: "Migrated",
    newValues: ["G-0000-0", "Multiple products: comma-separated G-numbers"],
    newBehavior: [
      "Disables the coverage amount dropdown for the listed product(s) on the Coverage Page.",
    ],
    notes: "Should be used in combination with prods and amt.",
  },
  {
    parameter: "featured_prod",
    currentValues: ["G-0000-0"],
    currentBehavior: [
      "Product is displayed in featured product section on coverage page.",
      "The featured product section displays the coverage category section (which the featured product is in) at the top of the coverage page. The featured product is positioned first within the coverage category section.",
    ],
    status: "Modified",
    newValues: ["G-0000-0"],
    newBehavior: [
      "Displays a “Featured” chip on the listed product on the Coverage Page. The featured product’s coverage category section is displayed first among the category sections, and the listed product is prioritized within that section.",
    ],
    notes:
      "Same parameter format; featured presentation is updated for the new Coverage Page design.",
  },
  {
    parameter: "preselect (TBD)",
    currentValues: ["TRUE"],
    currentBehavior: [
      "All products / all applicants will have \"Coverage for my ___\" preselected on the coverage page. (HOLD - can discuss in future, but no known client request for this functionality. Use of Category and Prods could be useful solution.)",
    ],
    status: "TBD",
    newValues: ["TBD"],
    newBehavior: [
      "TBD. Proposed behavior: the \"Add coverage\" checkbox would be preselected on the Coverage Page for all applicants/products.",
    ],
    notes: "Current template scope: all. Still TBD — no known client request for this functionality.",
  },
  {
    parameter: "qt",
    currentValues: ["none"],
    currentBehavior: ["Hides quote section on landing page."],
    status: "Removed",
    newValues: ["—"],
    newBehavior: ["Not supported in the new template."],
    notes: "Landing/Home Page variants replace this behavior.",
  },
  {
    parameter: "pmt",
    currentValues: ["opt"],
    currentBehavior: [
      "Sets required payment section to optional on application details page.",
    ],
    status: "Removed",
    newValues: ["—"],
    newBehavior: ["Not supported in the new template."],
    notes:
      "Payment Page configuration controls whether payment is required/optional.",
  },
  {
    parameter: "amt",
    currentValues: ["G-1111-1_2000000,", "G-0000-0_2500000"],
    currentBehavior: [
      "Presets coverage page benefit amount dropdown to specified amount(s) for specified product(s). List product(s) (G-numbers) and amount(s) (no commas) in parameter with comma-separated list, as follows: G-number_amount",
    ],
    status: "Migrated",
    newValues: [
      "G-0000-0_2000000",
      "Multiple product/amount pairs: comma-separated",
    ],
    newBehavior: [
      "Sets the Coverage Page amount dropdown for the listed product(s) to the specified amount(s).",
    ],
    notes: "Same product_amount format as current template.",
  },
  {
    parameter: "mrate",
    currentValues: ["—"],
    currentBehavior: [
      "If present, shows monthly rates on Coverage page (AMA only uses this for now)",
    ],
    status: "Removed",
    newValues: ["—"],
    newBehavior: ["Not supported in the new template."],
    notes:
      "Clients can use the \"Frequency toggle\" configuration to enable a monthly/annual rate toggle instead.",
  },
  {
    parameter: "association",
    currentValues: ["xyz"],
    currentBehavior: [
      "Expansion of existing functionality under discussion: Preselects association dropdown on eligibility page (for use with specific cases only). (Current functionality example is CAT to preset association and logo. New functionality to preset dropdown, like with TIE.)",
    ],
    status: "Migrated",
    newValues: ["xyz"],
    newBehavior: [
      "Presets the association logo and membership attestation field to the association set in the URL parameter.",
    ],
    notes:
      "Clients such as TIE will not use the association parameter; they will instead have search capability in select fields.",
  },
  {
    parameter: "campaign",
    currentValues: ["campaignName"],
    currentBehavior: [
      "Sends campaign code data to analytics & XML. Prints campaign code on PDF. Note: Maximum of 30 characters. Can include alphanumeric characters, dash and underscore.",
    ],
    status: "Migrated",
    newValues: ["abc"],
    newBehavior: [
      "Same behavior as current template: sends the campaign code to analytics and XML and prints the campaign code on the PDF.",
    ],
    notes: "Same format and behavior as current template.",
  },
  {
    parameter: "ctg",
    currentValues: ["di", "oo", "sh"],
    currentBehavior: [
      "Displays disability coverage category section first on the coverage page",
      "Displays office overhead coverage category section first on the coverage page",
      "Displays supplemental health coverage category section first on the coverage page",
    ],
    status: "Modified",
    newValues: [
      "firstCategory=ad",
      "firstCategory=di",
      "firstCategory=oo",
      "firstCategory=sh",
    ],
    newBehavior: [
      "The listed category is displayed first throughout the site wherever coverage categories are presented, including the Landing Page and Coverage Page.",
    ],
    notes: "Parameter name changes from ctg to firstCategory. AD is supported.",
  },
  {
    parameter: "nc",
    currentValues: ["none"],
    currentBehavior: [
      "Hides need calculators links on Coverage Page (when case has needs calculators enabled in core configuration)",
    ],
    status: "Removed",
    newValues: ["—"],
    newBehavior: ["Not supported in the new template."],
    notes: "—",
  },
  {
    parameter: "URLClickedFrom",
    currentValues: ["email"],
    currentBehavior: [
      "Used in Auto Save automatic emails to track/identify those returning to the site through these emails.",
    ],
    status: "Migrated",
    newValues: ["email"],
    newBehavior: [
      "Same behavior as current template: identifies/tracks users returning to the site through Auto Save automatic emails.",
    ],
    notes: "Same format and behavior as current template.",
  },
  {
    parameter: "app",
    currentValues: ["CIR", "ABI"],
    currentBehavior: ["Shows CIR/ABI only flow (WAEPA only uses this for now)"],
    status: "Migrated",
    newValues: ["CIR", "ABI"],
    newBehavior: ["TBD"],
    notes:
      "Parameter exists in the new template with the same format; new-template behavior is TBD.",
  },
];

export type UrlParameterAdditionalEntry = {
  parameter: string;
  currentTemplate: string;
  status: string;
  newValues: string[];
  newBehavior: string[];
  notes: string;
  sourceRefs: string[];
};

// Parameters identified in the new-template source that were not present in
// the current-template inventory above. Documents existing prototype/source
// behavior; inclusion does not by itself designate prototype/development-only
// parameters as production requirements.
export const urlParametersAdditional: UrlParameterAdditionalEntry[] = [
  {
    parameter: "variant",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New",
    newValues: ["default", "hero-image", "welcome-back"],
    newBehavior: [
      "Selects the Landing Page variant for the current session.",
      "default: Displays the standard Landing Page experience, including the Quote Tool.",
      "hero-image: Displays the hero-image Landing Page variant.",
      "welcome-back: Displays the welcome-back Landing Page variant.",
    ],
    notes:
      "If the URL value is absent or is not one of the supported values, the template falls back to the Landing Page variant defined in client configuration, or default when no client variant is configured. This parameter is the source-level mechanism currently supporting the Landing/Home Page variants that replace the legacy qt=none behavior.",
    sourceRefs: ["src/pages/Home.tsx"],
  },
  {
    parameter: "flow",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New",
    newValues: ["advisor"],
    newBehavior: [
      "Identifies the advisor-applicant resume/review flow. When flow=advisor is present on the Resume flow, the applicant email-entry step is bypassed and the flow proceeds in advisor-applicant mode. The Review Page also uses this state to apply advisor-flow edit behavior.",
    ],
    notes:
      "Current source usage is specific to advisor-flow Resume, Resume Code, and Review behavior. This is distinct from form=advisor, which directs initial entry to the Advisor Login Page.",
    sourceRefs: [
      "src/pages/Resume.tsx",
      "src/pages/ResumeCode.tsx",
      "src/pages/Review.tsx",
    ],
  },
  {
    parameter: "template",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New",
    newValues: ["single", "multi"],
    newBehavior: [
      "Selects the form template for the current session. A valid URL value is stored in session storage and remains active for subsequent navigation during the session.",
      "multi (default): The existing multi-page flow — separate routes for each step, Back/Next navigation, real viewport-based responsive layout.",
      "single: Same routes, pages, and Back/Next navigation as multi — nothing about FormRoutePage, ProgressStep, or the router changes. createAppTheme is instead given forceMobileLayout: true, which pins the md/lg/xl breakpoints to an unreachable width so every desktop/mobile structural check (ProgressStep's sidebar-vs-stepper branch, AppDrawer, AppModal, HelpChips, MemberVerification) and every md/lg/xl-keyed responsive style renders its narrow-screen variant regardless of actual browser width. sm (600px) is left at its default so sm-level padding/spacing (e.g. FormRoutePage's FormShell) still activates normally on a real desktop-width browser. Home.tsx also renders the hero (tagline, title, description; no hero image; smaller title/description type) directly followed by the real Membership page component instead of a separate landing-page-then-navigate-to-Membership step; the hero is capped at 700px and the form area at 800px, both centered in the same column.",
    ],
    notes:
      "If the URL value is absent or is not one of the supported values, the template falls back to the active client's features.defaultTemplate, or multi when unconfigured. This is the mechanism behind the waepagi client, which defaults to single.",
    sourceRefs: [
      "src/config/template/resolveTemplate.ts",
      "src/app/theme.ts",
      "src/app/App.tsx",
      "src/pages/Home.tsx",
    ],
  },
  {
    parameter: "client",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New — Prototype/Configuration Utility",
    newValues: [
      "demo",
      "abe",
      "ama",
      "asce",
      "avma",
      "csea",
      "isitrust",
      "nso",
      "waepa",
      "waepagi",
    ],
    newBehavior: [
      "Overrides the active client configuration used by the prototype. A valid URL client ID is stored in session storage and remains the active client for subsequent navigation during the session.",
    ],
    notes:
      "If the URL value is not a valid configured client ID, it is not used. If no valid URL override exists, the prototype uses the previously stored client ID when available, otherwise the default client is demo. Production use/status is TBD; this currently functions as a prototype/configuration-selection mechanism.",
    sourceRefs: [
      "src/config/client/resolveClientId.ts",
      "src/config/clients/index.ts",
      "src/dev/DevTools.tsx",
    ],
  },
  {
    parameter: "inputChecks",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New — Prototype/Development Utility",
    newValues: ["Presence-based parameter; no specific value is required."],
    newBehavior: [
      "Enables field-level completion/error visual indicators used by the prototype. When present, completed fields can display completion status and fields with validation errors can display the corresponding error-status treatment.",
    ],
    notes:
      "This parameter currently affects prototype UI validation/status visualization and should not be treated as a production URL requirement unless explicitly approved.",
    sourceRefs: [
      "src/components/forms/FieldRenderer.tsx",
      "src/pages/Eligibility.tsx",
    ],
  },
  {
    parameter: "dev",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New — Development Only",
    newValues: [
      "true",
      "false",
      "Presence without false is treated as enabled by the current prototype logic.",
    ],
    newBehavior: [
      "Enables or disables the prototype DevTools mode. The selected state is stored in session storage.",
    ],
    notes:
      "Development-only parameter. It is not a consumer/advisor functional URL parameter and should not be included as a production site-template requirement.",
    sourceRefs: ["src/dev/DevTools.tsx"],
  },
  {
    parameter: "reset",
    currentTemplate: "Not listed in current parameter inventory.",
    status: "New — Development Only",
    newValues: [
      "Timestamp value generated by the prototype DevTools reset action.",
    ],
    newBehavior: [
      "Added to the URL when the DevTools “Reset App” action redirects back to the root route. The current source does not read this parameter to drive application behavior; it functions as a unique redirect/query value during the reset operation.",
    ],
    notes:
      "Development-only implementation detail. It should not be included as a production site-template URL requirement unless a separate production use case is defined.",
    sourceRefs: ["src/dev/DevTools.tsx"],
  },
];

export const urlParameterSourceSummary: {
  parameter: string;
  classification: string;
  productionStatus: string;
}[] = [
  {
    parameter: "template",
    classification: "User-facing form template selection",
    productionStatus: "New; behavior documented above",
  },
  {
    parameter: "variant",
    classification: "User-facing Landing Page behavior",
    productionStatus: "New; behavior documented above",
  },
  {
    parameter: "flow",
    classification: "User-facing advisor-flow behavior",
    productionStatus: "New; behavior documented above",
  },
  {
    parameter: "client",
    classification: "Prototype/client configuration override",
    productionStatus: "TBD for production",
  },
  {
    parameter: "inputChecks",
    classification: "Prototype UI/status utility",
    productionStatus: "Not currently a production requirement",
  },
  {
    parameter: "dev",
    classification: "Development utility",
    productionStatus: "Development only",
  },
  {
    parameter: "reset",
    classification: "Development reset implementation detail",
    productionStatus: "Development only",
  },
];
