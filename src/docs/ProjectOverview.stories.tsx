import type { Meta } from "@storybook/react-vite";
import { Box, Chip, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

const meta = {
  title: "Project/Overview",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const siteRules: {
  area: string;
  rule: string;
  behavior: string;
  ref: string;
}[] = [
  { area: "Application flow", rule: "Resolved next/back navigation", behavior: "Next and Back use the form-flow resolver and skip pages whose display conditions evaluate to false.", ref: "src/config/formFlow.ts; src/app/RoutePage.tsx" },
  { area: "Application flow", rule: "Client page mode = none", behavior: "If Beneficiary or Payment is configured as none, the page is skipped from the active form flow.", ref: "src/config/formFlow.ts; getClientPageRequirement" },
  { area: "Application flow", rule: "Beneficiary routing", behavior: "Beneficiary is shown only when selected coverage includes Life (LI) or Accidental Death (AD), unless the page is configured as none.", ref: "src/config/formFlow.ts" },
  { area: "Application flow", rule: "Health SI routing", behavior: "Health SI is shown when at least one selected product uses SI underwriting.", ref: "src/config/formFlow.ts" },
  { area: "Application flow", rule: "Health LI routing", behavior: "Health LI is shown when selected Life coverage uses TELE underwriting.", ref: "src/config/formFlow.ts" },
  { area: "Application flow", rule: "Health QD routing", behavior: "Health QD is shown when at least one selected product uses QD underwriting.", ref: "src/config/formFlow.ts" },
  { area: "Application flow", rule: "Health DI routing", behavior: "Health DI is shown when selected Disability coverage uses TELE underwriting.", ref: "src/config/formFlow.ts" },
  { area: "Application flow", rule: "Health CIR routing", behavior: "Health CIR is shown when an enabled selected rider key contains :cir:.", ref: "src/config/formFlow.ts" },
  { area: "Progress/navigation", rule: "Health grouped in progress", behavior: "Multiple routed health pages are presented within the consolidated application-review/progress experience rather than as separate major progress stages.", ref: "src/config/progressSteps.ts" },
  { area: "Progress/navigation", rule: "Skipped stages removed", behavior: "If every page in a progress stage is skipped, the stage is removed from the active progress steps.", ref: "src/config/progressSteps.ts" },
  { area: "Progress/navigation", rule: "Post-review Back disabled", behavior: "After Review is submitted, Back navigation is disabled on pages after Review.", ref: "src/app/RoutePage.tsx" },
  { area: "Validation", rule: "Page advance", behavior: "The user cannot advance when field validation or page-level validation fails; the page shows an error and moves focus/scroll toward the first error.", ref: "src/app/RoutePage.tsx" },
  { area: "Persistence", rule: "Values preserved during navigation", behavior: "Current page values are written to shared application state on submit, Back, and unmount when the page was not explicitly saved.", ref: "src/app/RoutePage.tsx; ApplicationFormContext.tsx" },
  { area: "Persistence", rule: "Progress-saved feedback", behavior: "After forward navigation, the destination page displays a Progress Saved snackbar.", ref: "src/app/RoutePage.tsx" },
  { area: "Persistence", rule: "Membership starts autosave mock communication", behavior: "Submitting Membership triggers the current prototype autosave mock-email behavior.", ref: "src/app/RoutePage.tsx" },
  { area: "Applicant display", rule: "Member section title hidden for member-only flow", behavior: "The Member/Self applicant section label is hidden when no spouse/child is actually selected for any product. It is shown when another applicant is applying.", ref: "src/utils/applicantVisibility.ts" },
  { area: "Applicant display", rule: "Dependent section shown only when applying", behavior: "Spouse/child applicant labels and post-Coverage applicant sections are shown only when that applicant is actually selected for an applicable product.", ref: "src/utils/applicantVisibility.ts; src/app/RoutePage.tsx" },
  { area: "Applicant display", rule: "Eligibility selection alone is not enough after Coverage", behavior: "A spouse/child selected on Eligibility does not count as applying if that dependent is not selected for any product on Coverage.", ref: "src/utils/applicantVisibility.ts" },
  { area: "Applicant display", rule: "Member-only fallback", behavior: "When no dependents are selected, the member is treated as the applicant by default.", ref: "src/utils/applicantsApplying.ts" },
  { area: "Eligibility", rule: "Child dependent requires child record", behavior: "If Child is selected as a dependent, at least one child record must be added before continuing.", ref: "src/pages/Eligibility.tsx" },
  { area: "Eligibility", rule: "Spouse dependent requires spouse details", behavior: "If Spouse is selected, spouse name details must be provided before continuing.", ref: "src/pages/Eligibility.tsx" },
  { area: "Eligibility", rule: "ZIP can derive state/province", behavior: "When a recognizable ZIP/postal code is entered, the state/province field is automatically derived when a matching configured option exists.", ref: "src/pages/Eligibility.tsx; src/utils/zipToStateProvince.ts" },
  { area: "Eligibility", rule: "AMA spouse-of-physician behavior", behavior: "For AMA when membership indicates spouse, the Spouse dependent option is removed to avoid treating the physician member as an additional spouse applicant.", ref: "src/pages/Eligibility.tsx" },
  { area: "Coverage", rule: "Coverage categories reflect selected products", behavior: "Coverage behavior and downstream routing are driven by the products selected on Coverage and their effective categories/underwriting types.", ref: "src/pages/Coverage.tsx; src/components/forms/ProductCatalog.tsx; src/config/formFlow.ts" },
  { area: "Coverage", rule: "Coverage amount note", behavior: "The site can present either 'additional coverage' or 'total coverage' guidance based on the active client configuration.", ref: "src/components/forms/ProductCatalog.tsx" },
  { area: "Coverage", rule: "Category initial expansion", behavior: "Coverage categories may start expanded for clients configured with allCategoriesExpanded.", ref: "src/config/clients/types.ts; client configs" },
  { area: "Coverage", rule: "Applicant coverage selection", behavior: "Coverage is selected separately by eligible applicant/product; selected applicant and amount data are stored by product/applicant key.", ref: "src/components/forms/ProductCatalog.tsx" },
  { area: "Coverage cart", rule: "Cart availability", behavior: "The application header shows the coverage cart on application pages except Home and Receipt, and hides it after Review has been submitted.", ref: "src/components/layout/AppHeader.tsx" },
  { area: "Coverage cart", rule: "Cart badge", behavior: "The cart icon displays a badge count derived from current coverage selections.", ref: "src/components/layout/AppHeader.tsx; CoverageCart.tsx" },
  { area: "Beneficiary", rule: "Applicable applicants/products", behavior: "Beneficiary records are created only for selected member/spouse LI/AD products with a positive coverage amount and selected applicant.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Optional page opt-in", behavior: "When Beneficiary mode is optional, the page first asks whether the user wants to add beneficiary information. No skips the beneficiary questions and permits continuation.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Required beneficiary per applicable product", behavior: "When beneficiary questions are active, each applicable product must have at least one beneficiary before continuing.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Primary/contingent designation", behavior: "Each beneficiary is designated as Primary or Contingent.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Individual vs. trust", behavior: "A beneficiary can be an Individual or Trust. Within the same Primary/Contingent designation, trust and individual beneficiary types cannot be mixed.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Maximum beneficiaries", behavior: "Up to 10 Primary and 10 Contingent beneficiaries may be added per product; reaching 10 prevents additional entries for that designation.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Individual allocation", behavior: "Individual beneficiary share must be greater than 0 and cannot exceed the unassigned percentage remaining for that designation.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Allocation reaches 100%", behavior: "Once the assigned individual share reaches 100% for a designation, no more individual beneficiaries can be added for that designation.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Trust exclusivity", behavior: "Only one Trust may be added per Primary/Contingent designation; if a Trust exists, additional individuals or trusts are blocked for that designation.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Add/edit/remove", behavior: "Beneficiaries are maintained through a modal supporting Add, Edit and Remove actions.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Beneficiary", rule: "Apply to other coverages", behavior: "After adding a beneficiary, if the same applicant has other eligible products, the user is offered the option to apply that beneficiary to other coverages.", ref: "src/pages/Beneficiary.tsx" },
  { area: "Contact", rule: "Business address same as home", behavior: "The Contact page conditionally hides/reuses business-address inputs when the business address is marked the same as the home address; DI/OO-related contact fields drive additional display rules.", ref: "src/pages/Contact.tsx" },
  { area: "Profile", rule: "Driver license follow-up", behavior: "Driver license number/state fields appear only when the user answers Yes to having a driver license, where those fields are present for the client.", ref: "src/pages/Profile.tsx" },
  { area: "Profile", rule: "Outside-U.S. follow-up", behavior: "Spouse outside-U.S. residence/travel questions reveal country/month follow-ups only for affirmative responses.", ref: "src/pages/Profile.tsx" },
  { area: "Profile", rule: "Existing/pending coverage follow-ups", behavior: "Financial/insurance follow-up fields and repeatable insurance-company records display only when the controlling answer and applicable coverage context require them.", ref: "src/pages/Profile.tsx" },
  { area: "Health", rule: "Applicant health sections", behavior: "Member/spouse health sections follow applicant-applying visibility; the member label is hidden for member-only flow.", ref: "src/pages/HealthSi.tsx; HealthLi.tsx; HealthDi.tsx; applicantVisibility.ts" },
  { area: "Health", rule: "Yes/No progressive disclosure", behavior: "Health questions are required Yes/No. A Yes response displays question-specific repeatable detail records; No displays no detail list.", ref: "src/pages/HealthSi.tsx; HealthLi.tsx; HealthDi.tsx" },
  { area: "Health", rule: "Dynamic List records", behavior: "Repeatable health/insurance records are added and edited through the shared DynamicList pattern.", ref: "src/components/forms/DynamicList.tsx" },
  { area: "Payment", rule: "Optional payment opt-in", behavior: "When Payment mode is optional, the page first asks whether the user wants to add payment information; No permits continuation without payment questions.", ref: "src/pages/Payment.tsx" },
  { area: "Payment", rule: "Payment per applicable product", behavior: "When payment questions are active, each applicable product requires a payment method and payment frequency before continuing.", ref: "src/pages/Payment.tsx" },
  { area: "Payment", rule: "Bank account detail display", behavior: "Bank-account details are displayed when Bank account is selected as the payment method.", ref: "src/pages/Payment.tsx" },
  { area: "Review", rule: "Edit confirmation", behavior: "Selecting an edit action prompts the user before routing back to the page that owns the information.", ref: "src/pages/Review.tsx" },
  { area: "Landing Page", rule: "Variant behavior", behavior: "default = inline Quote Tool and no hero image; hero-image = hero image, no inline Quote Tool; welcome-back = hero image, Continue/New Application actions, and hides How Applying Works and Coverage Options.", ref: "src/pages/Home.tsx" },
  { area: "Landing Page", rule: "Resume link", behavior: "Default and hero-image variants display the saved-application resume prompt/link; welcome-back uses Continue Application as the primary action instead.", ref: "src/pages/Home.tsx" },
  { area: "Header", rule: "Header actions", behavior: "Application header supports Chat (when enabled and eligible), Coverage Cart and Menu. It does not contain a Quote action in the latest source.", ref: "src/components/layout/AppHeader.tsx" },
  { area: "Application menu", rule: "Menu tools", behavior: "Menu provides Continue Saved Application, About Coverage, Needs Calculator, About QuickDecision and client Contact information.", ref: "src/components/layout/AppMenu.tsx" },
];

const templateChanges: {
  area: string;
  current: string;
  next: string;
  whatChanges: string;
}[] = [
  { area: "Overall application experience", current: "Experience varies more by client and contains longer, denser pages.", next: "Standardized multi-page experience built on a shared Material Design component system, with client variation handled through supported configuration.", whatChanges: "Creates a more consistent experience across migrated sites and reduces one-off design/implementation patterns." },
  { area: "Application flow", current: "Fewer, larger pages; page sequence varies by client. Examples include Contact/Profile containing information that is separated in the redesign, and separate Consent/Decision states on current sites.", next: "Standard baseline flow: Landing > Membership > Eligibility > Coverage > Beneficiary > Contact > Profile > Review > applicable Health page(s) > Payment > E-Sign > Receipt. Conditional pages are skipped when not applicable.", whatChanges: "Breaks the application into smaller task-focused steps while preserving configurable client requirements." },
  { area: "Page length / cognitive load", current: "More information and fields are presented together on longer pages, requiring more scrolling.", next: "Information is divided into smaller steps and progressively disclosed where possible.", whatChanges: "Reduces scrolling and the amount of information the applicant must process at one time." },
  { area: "Visual design system", current: "Legacy template styling and controls.", next: "Material Design foundation with standardized typography, spacing, form controls, cards, drawers, feedback states, and responsive behavior.", whatChanges: "Creates a cleaner, more consistent visual and interaction model." },
  { area: "Mobile experience", current: "Responsive support exists, but the experience is not optimized around mobile-first interaction patterns.", next: "Mobile-first layouts, responsive stacking, mobile-friendly controls, and swipeable drawers are used throughout the new template.", whatChanges: "Improves form completion and navigation on smaller screens." },
  { area: "Navigation and progress", current: "Current navigation provides less persistent context across the application.", next: "Application progress is represented through the standardized application shell, progress indicator, Back/Continue navigation, and resolved conditional flow.", whatChanges: "Users receive clearer indication of where they are and what comes next." },
  { area: "Applicant-first scenario", current: "Flows more frequently require explicit applicant selection even when the member is the only person applying.", next: "The member is treated as the primary/default applicant. Dependent applicant flows are added only when needed.", whatChanges: "Optimizes the most common member-only use case and removes unnecessary interactions." },
  { area: "Applicant section headings", current: "Applicant labels are generally displayed as part of the form structure.", next: "Member/self section labels are hidden when only the member is applying and shown when another applicant is also applying; dependent labels display only for applicable applicants.", whatChanges: "Reduces repetitive headings while preserving clarity when multiple applicants are involved." },
  { area: "Adding spouse / children", current: "Dependent information is collected within the current eligibility/profile structures.", next: "Eligibility supports adding spouse and child applicants through progressive disclosure and repeatable add/edit controls; dependent sections appear only when selected.", whatChanges: "Makes dependent entry more explicit while keeping the default member-only path shorter." },
  { area: "Autosave initiation", current: "Autosave begins later in the application (reference baseline: after the third page).", next: "Autosave begins after completion of the first application page once the information required to establish the application is available.", whatChanges: "Preserves progress earlier and increases the number of incomplete applications that can be resumed." },
  { area: "Save feedback", current: "Save state is not consistently visible after each application step.", next: "The new template includes saving/saved feedback, including a Progress Saved notification after successful persistence.", whatChanges: "Makes system status clearer and gives users confidence that progress was retained." },
  { area: "Resume experience", current: "Current resume process is longer and provides static expiration messaging.", next: "Resume is simplified to an email-link and phone-code verification flow, with visible countdown timers for time-sensitive link/code states in the prototype.", whatChanges: "Reduces steps and makes expiration status easier to understand." },
  { area: "Landing Page", current: "Current client landing experiences are more individually implemented.", next: "New template provides supported Landing Page variants (default, hero-image, welcome-back) with configurable client branding/content.", whatChanges: "Standardizes structure while allowing controlled client differentiation." },
  { area: "Landing Page quote", current: "Quote availability and experience are more limited in the current template and historically focused on selected products/use cases.", next: "The new Landing Page supports an instant quote entry experience and a Quote Calculator drawer for supported products/categories.", whatChanges: "Introduces a more prominent shopping/estimate experience before application entry." },
  { area: "Quote reuse during application", current: "Quote functionality is not consistently integrated with application-page contextual help.", next: "Relevant application pages can open the same Quote Calculator through page helper actions such as 'How much does it cost?'.", whatChanges: "Lets users obtain estimates without introducing a separate quote page or header action." },
  { area: "Coverage category selection", current: "Current coverage selection requires more applicant/product interaction and is less optimized for the member-only case.", next: "Coverage is organized by coverage category, with applicable products displayed for eligible applicants and member-first defaults used where appropriate.", whatChanges: "Reduces unnecessary clicks and makes multiple coverage types easier to compare." },
  { area: "Coverage shopping cart / summary", current: "Current template does not provide the same persistent e-commerce-style running coverage summary.", next: "A Coverage Cart summarizes selected products, applicants, amounts, estimated premiums, and total estimated cost; it is accessible from Coverage and the application header where applicable.", whatChanges: "Gives applicants continuous visibility into what they selected and the estimated total." },
  { area: "Coverage editing", current: "Coverage changes rely on returning through the existing application flow.", next: "Coverage summary provides a direct edit path back to Coverage while selections remain editable.", whatChanges: "Makes it easier to review and adjust coverage before final submission." },
  { area: "Estimated premium display", current: "Premium information is presented using the current site-specific design and frequency rules.", next: "Estimated premiums update with coverage selections and support configured presentation such as monthly/annual frequency where enabled.", whatChanges: "Provides clearer cost feedback while the applicant is selecting coverage." },
  { area: "Coverage guidance", current: "More explanatory text is presented directly on pages.", next: "Coverage explanations, QuickDecision information, application-review information, and other educational content use expandable/drawer-based progressive disclosure.", whatChanges: "Keeps the primary task visually simpler while keeping help available on demand." },
  { area: "Beneficiary page", current: "Beneficiary information is part of the existing application/profile experience and validation can surface later in the flow.", next: "Beneficiary is a dedicated step when applicable. Beneficiaries are added/edited through repeatable controls, with primary/contingent organization and real-time allocation feedback.", whatChanges: "Separates a complex task into its own step and prevents percentage-allocation errors earlier." },
  { area: "Beneficiary applicability", current: "Current routing is tied to existing site/product logic.", next: "Beneficiary is included only when selected coverage requires it (currently Life or Accidental Death) and may additionally be configured as required, optional, or omitted.", whatChanges: "Keeps irrelevant pages out of the user's resolved application flow." },
  { area: "Profile / application details", current: "Current Profile page contains a larger collection of applicant information, including information now separated into dedicated steps.", next: "Beneficiary and Payment are separated from Profile, while remaining profile information is grouped into clearer sections and shown conditionally.", whatChanges: "Reduces page density and improves information grouping." },
  { area: "Repeatable information", current: "Repeating records use the current template's existing entry patterns.", next: "The new template uses a standard Dynamic List pattern for adding/editing repeatable records such as children, existing coverage, beneficiaries, and health follow-up details.", whatChanges: "Provides one consistent add/edit/remove interaction across the application." },
  { area: "Smart / assisted form entry", current: "Current forms require more manual completion in several areas.", next: "New controls support searchable selects, intelligent defaults, conditional fields, and automatic state/province population from ZIP/postal code where supported.", whatChanges: "Reduces typing and avoidable entry errors." },
  { area: "Contextual page helpers", current: "Help content is more static and page text-heavy.", next: "Pages can provide compact helper chips that open contextual drawers/tools without leaving the page.", whatChanges: "Makes guidance easy to access without adding permanent page clutter." },
  { area: "Loading feedback", current: "Longer operations rely more heavily on spinner-style loading indicators.", next: "The new template includes page-transition skeletons and other responsive feedback states in addition to activity indicators where appropriate.", whatChanges: "Provides stronger visual evidence that the system is working during longer operations." },
  { area: "System notifications", current: "Feedback patterns are less standardized across the current template.", next: "Standardized alerts, snackbars, progress/saved states, inline validation, and expiration countdowns are used throughout the experience.", whatChanges: "Creates predictable feedback patterns for success, errors, warnings, and in-progress states." },
  { area: "Health questions", current: "Health content is presented within the current application flow with existing page/question patterns.", next: "Health is routed into the applicable SI, LI/TELE, QD, DI, and/or CIR page(s) based on selected coverage. Yes responses progressively reveal repeatable follow-up details; No responses do not.", whatChanges: "Only applicable health content is shown and follow-up detail is collected progressively." },
  { area: "Advisor-assisted flow", current: "Advisor completes a larger portion of the current application before applicant handoff.", next: "Advisor completes the permitted non-sensitive portion, then sends the saved application to the applicant, who resumes to review and complete applicant-only sensitive/final steps.", whatChanges: "Creates a clearer division between advisor-entered information and applicant-entered sensitive information." },
  { area: "Applicant-entered sensitive information", current: "Health/payment information may be completed by the advisor in the current advisor-assisted model depending on site/workflow.", next: "The redesign is structured so the applicant completes sensitive/final information such as Health, Payment, and E-Sign after handoff.", whatChanges: "Improves privacy and continuity for advisor-assisted applications." },
  { area: "Payment", current: "Payment is embedded within the current Profile/application flow for applicable sites.", next: "Payment is a dedicated application step and can be configured as required, optional, or omitted by site.", whatChanges: "Separates sensitive payment entry from general profile information." },
  { area: "Review", current: "Review/Consent are separate or differently structured in the current template, depending on site.", next: "A consolidated Review step presents application information before downstream health/payment/e-sign completion, with edit paths back to owning pages.", whatChanges: "Creates one clearer application-review checkpoint and removes redundant review/consent structure where approved." },
  { area: "Decision / confirmation", current: "Current flow may include separate Decision and Receipt pages.", next: "The new baseline terminates in Receipt after successful submission; status/next-step information is consolidated into the redesigned final experience.", whatChanges: "Simplifies the end of the application flow." },
  { area: "Non-member handling", current: "Non-members may be blocked earlier depending on the current site flow.", next: "The new template supports client-specific non-member guidance and, where permitted, allows the applicant to continue rather than automatically stopping the flow.", whatChanges: "Supports association scenarios where applying for coverage may also involve becoming a member." },
  { area: "Client configuration model", current: "Current sites rely more heavily on client-specific implementation differences.", next: "The new template centralizes supported differences such as branding, Landing Page variant/content, page modes, field variations, help/contact actions, and coverage presentation in client configuration.", whatChanges: "Reduces client-specific UI code and makes future site migrations more repeatable." },
  { area: "Client-specific copy", current: "Client copy is more tightly coupled to individual site implementation.", next: "Shared default content is merged with client-specific content overrides through a centralized content layer.", whatChanges: "Separates copy/configuration from reusable page/component behavior." },
  { area: "Responsive drawers / overlays", current: "Current modal/overlay behavior is based on the legacy component model.", next: "The new AppDrawer uses responsive drawer behavior and supports swipeable mobile interaction for user-initiated drawers.", whatChanges: "Provides a more mobile-friendly progressive-disclosure pattern." },
  { area: "Cookie notice branding", current: "Current cookie presentation does not provide the same standardized redesign treatment described in the enhancement reference.", next: "The new source includes a standardized Cookie Dialog as part of the shared application shell/design system.", whatChanges: "Provides a consistent cookie-notice pattern across migrated sites." },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
    {children}
  </Typography>
);

const HeaderCell = ({ children }: { children: React.ReactNode }) => (
  <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap", verticalAlign: "top" }}>
    {children}
  </TableCell>
);

const BodyCell = ({ children }: { children: React.ReactNode }) => (
  <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem" }}>
    {children}
  </TableCell>
);

const AreaCell = ({ children }: { children: React.ReactNode }) => (
  <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "nowrap", color: "text.secondary" }}>
    {children}
  </TableCell>
);

// ---------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------

export const Overview = () => (
  <Box sx={{ maxWidth: 1100 }}>
    <Typography variant="h4" gutterBottom>
      New Template Design Prototype
    </Typography>

    <Typography variant="body1" sx={{ mb: 3 }}>
      This Storybook documents the reusable components, page patterns, copy, and
      interaction states used in the new template design prototype. The prototype
      is intended for design and development reference, not production
      implementation.
    </Typography>

    <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
      <Chip label="Material UI" />
      <Chip label="React" />
      <Chip label="Vite" />
      <Chip label="Prototype" />
      <Chip label="Dev handoff" />
    </Stack>

    <SectionHeading>Storybook goals</SectionHeading>
    <Typography component="div" variant="body1">
      <ul>
        <li>Document shared components and page patterns.</li>
        <li>Show component states and variants in isolation.</li>
        <li>Capture approved copy and content patterns.</li>
        <li>Help developers understand how the prototype should be translated into the production template.</li>
        <li>Reduce repeated custom styling by moving common patterns into shared components or theme tokens.</li>
      </ul>
    </Typography>

    <SectionHeading>What this Storybook is not</SectionHeading>
    <Typography component="div" variant="body1">
      <ul>
        <li>It is not the production application.</li>
        <li>It is not the final source of business rules.</li>
        <li>It is not meant to document every line of prototype code.</li>
      </ul>
    </Typography>

    {/* ------------------------------------------------------------------ */}
    {/* Section: Site Rules & Functionality                                  */}
    {/* ------------------------------------------------------------------ */}
    <Divider sx={{ mt: 5, mb: 4 }} />

    <Typography variant="h5" gutterBottom>
      Site Rules and Functional Behavior
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Business-readable rules derived from the latest prototype implementation.
      These describe how the current new-template prototype works; they are not
      product eligibility or underwriting rules. Prototype-specific mock behavior
      (e.g. autosave mock email) should be replaced by production integration
      requirements during implementation.
    </Typography>

    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <HeaderCell>Area</HeaderCell>
            <HeaderCell>Rule / Functionality</HeaderCell>
            <HeaderCell>Behavior</HeaderCell>
            <HeaderCell>Implementation Reference</HeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {siteRules.map((row, i) => (
            <TableRow key={i} sx={{ "&:nth-of-type(odd)": { bgcolor: "action.hover" } }}>
              <AreaCell>{row.area}</AreaCell>
              <BodyCell><strong>{row.rule}</strong></BodyCell>
              <BodyCell>{row.behavior}</BodyCell>
              <BodyCell>
                <Typography variant="caption" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                  {row.ref}
                </Typography>
              </BodyCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>

    {/* ------------------------------------------------------------------ */}
    {/* Section: Current → New Template Changes                             */}
    {/* ------------------------------------------------------------------ */}
    <Divider sx={{ mt: 5, mb: 4 }} />

    <Typography variant="h5" gutterBottom>
      Current to New Template Changes
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      Summarizes the user-facing and functional changes from the existing Portal
      template to the redesigned template represented by the current prototype
      source.
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      <strong>Note:</strong> This is a change inventory, not a statement that
      every current client uses identical legacy behavior. Client-specific
      differences still need to be preserved during migration unless explicitly
      retired or converted to supported configuration.
    </Typography>

    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            <HeaderCell>Area / Feature</HeaderCell>
            <HeaderCell>Current Template</HeaderCell>
            <HeaderCell>New Template</HeaderCell>
            <HeaderCell>What Changes</HeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {templateChanges.map((row, i) => (
            <TableRow key={i} sx={{ "&:nth-of-type(odd)": { bgcolor: "action.hover" } }}>
              <AreaCell>{row.area}</AreaCell>
              <BodyCell>{row.current}</BodyCell>
              <BodyCell>{row.next}</BodyCell>
              <BodyCell>{row.whatChanges}</BodyCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  </Box>
);
