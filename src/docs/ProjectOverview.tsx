import { Box, Chip, Divider, Link, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

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

export const TemplateChangeReference = () => (
  <Box sx={{ maxWidth: 1100 }}>
    <Typography variant="h4" gutterBottom>
      Template change reference
    </Typography>

    <Typography variant="body1" sx={{ mb: 3 }}>
      This reference records the reusable components, page patterns, copy, and
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

    <SectionHeading>Template goals</SectionHeading>
    <Typography component="div" variant="body1">
      <ul>
        <li>Document shared components and page patterns.</li>
        <li>Show component states and variants in isolation.</li>
        <li>Demonstrate content presentation using shared content definitions.</li>
        <li>Help developers understand how the prototype should be translated into the production template.</li>
        <li>Reduce repeated custom styling by moving common patterns into shared components or theme tokens.</li>
      </ul>
    </Typography>

    <SectionHeading>Reference scope</SectionHeading>
    <Typography component="div" variant="body1">
      <ul>
        <li>It is not the production application.</li>
        <li>Site-specific requirements are specified in the owning Portal Library sections.</li>
        <li>The comparison preserves migration context; it does not verify a site implementation.</li>
      </ul>
    </Typography>

    {/* ------------------------------------------------------------------ */}
    {/* Section: Site Rules & Functionality                                  */}
    {/* ------------------------------------------------------------------ */}
    <Divider sx={{ mt: 5, mb: 4 }} />

    <Typography variant="h5" gutterBottom>Portal requirements</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Portal Library owns site configurations, business rules, product eligibility,
      coverage amounts, URL parameters, fields, content and application flows.
      Storybook demonstrates the shared components and their interaction states.
      <Link href="http://localhost:5173/admin-center/library/rules?site=all" target="_blank" rel="noopener noreferrer">Open Portal Library</Link>
    </Typography>

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
