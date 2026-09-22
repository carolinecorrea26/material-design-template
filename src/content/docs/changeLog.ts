export type ChangeLogEntry = {
  id: string;
  date: string;
  area: string;
  summary: string;
  details: string;
};

/**
 * Chronological log of documented changes to the prototype and this
 * document. Moved from InformationArchitecture.tsx onto the Portal Admin
 * landing page — this is project/change history, not application
 * architecture documentation.
 */
export const changeLog: ChangeLogEntry[] = [
  {
    id: "CL-029",
    date: "2026-09-21",
    area: "Theme / Storybook / Documentation",
    summary:
      "Made Storybook the visual design-system source of truth, refocused the in-app Design System page around Storybook and interactive theme previews, consolidated duplicate theme colors, and added preset/custom client theme configuration",
    details:
      "Theme tokens now share base values where exact literals previously drifted independently: background.subtle/panel.main and background.surface/action.selected/default-chip/SECTION_SURFACE_BG, plus other exact theme-local duplicates, with all semantic text roles preserved. Storybook Typography covers every configured standard and custom variant and reads size, weight, line height, and custom element mapping from the live theme. The former in-app Design System catalog was removed; the focused Design System page now has a Storybook entry tab and a Theme Configuration tab with approved preset radio choices, custom hex validation, and a locally themed demo landing-page preview. Storybook Branding owns display constraints and accessibility guidance without duplicating actual CMS-managed client assets/copy. ClientConfig.theme is a discriminated preset/custom union; all existing clients were migrated to preset entries with unchanged palette output, while custom configuration accepts one primary hex and uses MUI to derive light, dark, and contrast colors. Global error/success, semantic, and neutral colors remain application-controlled. Added preset/custom theme regression tests and updated navigation, configuration resolution, effective-client display, Storybook ownership/status copy, and stale live references.",
  },
  {
    id: "CL-028",
    date: "2026-09-11",
    area: "Information Architecture / Flows",
    summary:
      "Corrected React Flow documentation diagrams: removed fixed-height/text-clamped nodes, increased graph spacing, simplified the Consumer flow to the stable backbone, and corrected TPA verification routing with WAEPA handled through the client override/effective architecture",
    details:
      "FlowDiagram node cards no longer use a fixed height or four-line clamp; documentation text now remains fully visible, while dagre receives a content-based height estimate and wider node/rank/edge spacing to reduce card/edge collisions. The Consumer Application Flow now represents only the stable application backbone; the prior spouse/child-only confirmation branch was removed from the backbone so conditional coverage behavior is documented consistently with other configuration-driven variations (including health routing) rather than selectively expanded in the main journey. The base TPA Member Verification Flow now distinguishes three downstream outcomes correctly: no match, failed/skipped verification, and successful verification. Failed or skipped verification continues the regular consumer flow without a Coverage Portfolio; successful verification sets tpa-verified=true, continues the regular flow with Coverage Portfolio enabled, and marks the submitted application for auto-approval in the TPA Admin Portal. Proceed-without-verification now bypasses the verification-result decision rather than being shown as a completed verification attempt. Added WAEPA TPA behavior as a client flow override resolved only on Client Site Details / Effective Site: new members set tpa-verified=true and are auto-approved but do not see a Coverage Portfolio; current members receive LexisNexis verification, with successful verification setting tpa-verified=true, enabling the portfolio, and auto-approving the application. Global Site Details now contains only the baseline TPA flow. `resolveClientFlows` merges client flow overrides into Effective Site, and the Overrides summary surfaces the WAEPA flow delta. Tests assert the TPA/WAEPA branch destinations so routing and architecture placement cannot silently regress.",
  },
  {
    id: "CL-027",
    date: "2026-09-08",
    area: "Information Architecture",
    summary:
      "Reorganized InformationArchitecture.tsx around Pages, Flows, Fields, Features, Coverage, Content, and Validation — Configuration stopped being its own section and became the client-selection lens applied across all of them; Accessibility moved to the Design System page",
    details:
      "The page previously read as 10 flat sections (Pages, Fields, Features, Flows, Rules, Configurations, URL Parameters, Error Messages, Content, Accessibility) with 'Configuration' treated as one bucket among many. Restructured to reflect that Configuration is a lens, not a section: the client dropdown now determines what each of the six kept sections shows, and every section's header carries both a total-row count chip and, where the active client differs from the default, a yellow 'N client overrides' chip, matching the yellow row-level highlighting already used for individual overridden rows. " +
      "Flows was kept as its own section per review (its 6 journeys — consumer, advisor, resume, autosave, quote, TPA verification — span many pages and don't reduce to a single page's attributes). The former Rules (siteRules, ~200 entries) and Configurations (configurationsData, ~45 entries) sections were retired as standalone accordions; their content is now surfaced as 'Behavioral rules' and 'Global & client configuration' reference lists (two new shared components, RuleReferenceList and ConfigReferenceList, filtered by area/group) nested directly inside the section each area/group is actually about — e.g. Coverage/Coverage cart/Eligibility/Beneficiary/Health rules and the Coverage categories/Products & coverage options config groups now live inside the new Coverage section instead of a generic Rules/Configurations page. " +
      "Coverage is a new top-level section: the 'Coverage configuration by product' table that was previously buried inside Configurations (Applicant → Coverage Category → Product → Coverage Options) is now first-class, extended with Code (CoverageDefinition.code), Beneficiary Required (from the client's beneficiary page requirement), and Health Flow Triggered (derived via coverageUnlocksPage against each health page) columns. " +
      "URL Parameters was folded into Features (nested under the existing 'URL parameters' feature card) rather than kept as its own page, since it documents a capability, not a distinct architectural layer. Error Messages was renamed Validation and broadened with a 'Validation & submit-gating rules' reference list (the former Validation-area site rules). Fields gained Applicant Scope and a derived Validation column (from format/required field metadata); Pages gained a Visible When column (derived from getClientPageRequirement plus health/beneficiary trigger conditions) with per-row client-override highlighting; Content's single Value column split into Global Configuration (default) and Client Configuration (override) columns, cross-referenced against the raw content defaults rather than only the resolved value. " +
      "Accessibility (the WCAG 2.2 conformance checklist, ~52 requirements) moved in full to src/pages/DesignSystem.tsx — it documents the shared visual/interaction system uniformly across clients and isn't affected by the client-configuration lens the rest of this page is now organized around. " +
      "Added a page-level intro paragraph and a description under every section header explaining what that section represents at a glance. Verified via tsc -b, eslint, and a headless-Chrome pass over both pages (client=waepa, a client with real coverage/content overrides) confirming the new section order, override-count chips, yellow highlighting, and the relocated Accessibility section all render with no console errors.",
  },
  {
    id: "CL-026",
    date: "2026-09-08",
    area: "Storybook / Documentation",
    summary:
      "Completed Phase 2B of the Storybook migration: built real component stories for 20 stable shared primitives (Forms, Layout, Content, Feedback), added the Dynamic Feedback & Status guidelines page, and fixed two verified dead/buggy props found while documenting them — SectionDivider's inverted chipVariant and PageShell's fully-unused noContainer prop",
    details:
      "20 components got real Storybook stories, co-located with their source file (Component.stories.tsx next to Component.tsx) with an explicit title so the sidebar still matches the proposed information architecture: Forms — FieldRenderer (26 stories: a controls-driven Playground, one story per supported input pattern, 4 forced-error states, a new Disabled state not shown anywhere in the app's own docs before, and the ?inputChecks completion-icon debug mode exposed as a toggle for the first time), SelectionGroup, ConditionalGroup, DynamicList, DynamicListItem. Layout — PageShell, FormShell, PageHeader, PageTitle, SectionDivider, ApplicantSectionDivider, CategoryCard, CategoryHeader, ProductCard. Content — HelpChips. Feedback — PageAlert, AppSnackbar (incl. the ProgressSavedSnackbar preset), EmptyState, LoadingOverlay, PageTransitionSkeleton. Added src/docs/guidelines/DynamicFeedbackAndStatus.stories.tsx, migrating DesignSystem.tsx's 'Design rules → Alerts' severity matrix (the one item Phase 2A explicitly deferred here) and documenting the polite/assertive live-region split shared by every feedback component. Total registered stories: 119 (up from 14 after Phase 2A), verified via tsc -b --noEmit, eslint, npx storybook build, and npm run build (the real app) — all clean. " +
      "Two real, verified fixes were made while documenting their owning components, per the master spec's own instructions to verify before touching anything: SectionDivider.tsx's chipVariant prop used to render inverted from its name (passing 'filled' rendered an MUI variant='outlined' chip and vice versa), and separately the variant='subsection' preset set the wrong internal chipVariant value to compensate. Verified all ~12 real call sites use only the subsection preset (none pass chipVariant directly), so fixing both halves produces zero visual change in the running app while making the public API correct going forward. Separately, PageShell.tsx's noContainer prop was verified to be a true no-op — declared in its prop type but never destructured or referenced in the render body — while RoutePage.tsx computed and passed a real, frequently-true value for it (noContainer || hasVerticalStepper) that had no effect once it reached PageShell, and RoutePage's own noContainer prop was never passed by any page file. Removed noContainer from both PageShell's and RoutePage's prop types/destructuring/call site; confirmed no behavior change via tsc -b and npm run build. " +
      "Inventory updates: src/content/docs/componentInventory.ts's storybookLink field was corrected for exactly these 20 components to the real generated story ID (e.g. /?path=/story/forms-fieldrenderer--playground), each checked against the actual storybook build output; every other entry's previously-flagged dead link is unchanged, since those components still don't have stories. src/docs/ComponentInventory.md's Story?/Action columns updated to Yes/Done for the same 20 rows. src/docs/StorybookAudit.md gained a full §11 write-up of what was built, the two fixes, and a recommended next phase (Navigation first, then Overlays once the QuoteModal dead-code question is resolved with the team, then Coverage & Commerce as a themed sub-pass given how tightly coupled those 15 components are). " +
      "Not built this phase: Navigation, Overlays, and Coverage & Commerce component stories; the RadioSelectionGroup/FieldRow/IconListItem/useCountdown/ProcessingStatusPage/YesNoDetailList/DetailsTable/RateFrequencyControl extractions proposed in the Phase 1 audit; the ~13-page inline-Alert-instead-of-PageAlert migration (documented as guidance, not performed); dedicated stories for AppMenu/AppHeader.",
  },
  {
    id: "CL-025",
    date: "2026-09-08",
    area: "Storybook / Documentation",
    summary:
      "Completed Phase 2A of the Storybook migration: established Storybook infrastructure (theme-aware decorators, accessibility addon, story ordering), built out the full Foundations section from the live theme, and migrated Information Architecture's Accessibility requirements into an implementation-guidance page — DesignSystem.tsx and InformationArchitecture.tsx remain in place, unstripped",
    details:
      "Infrastructure: installed @storybook/addon-a11y@10.5.0 and registered it in .storybook/main.ts (non-blocking by default via a11y.test: \"todo\" in preview.tsx); added staticDirs: [\"../public\"] so stories can reference real client logo/hero assets; rewrote preview.tsx so every story is themed via createAppTheme(context.globals.themeColor) through a new toolbar \"Theme\" control (all 4 client presets), instead of one static imported theme; added parameters.options.storySort to fix the sidebar order to Overview → Foundations → Guidelines → Forms → Layout → Navigation → Content → Feedback → Overlays → Coverage & Commerce → Application Patterns → Project; added src/docs/shared/DocsBlocks.tsx as the shared presentational layer (DocsPage, DocsSection, DocsTable, SourceNote, StatusChip, swatches) used by every new page. " +
      "Foundations (10 new story files under src/docs/foundations/ and src/docs/overview/): Overview, Colors, Typography, Spacing, Shape, Elevation, Breakpoints & Responsive Design, MUI Theme Overrides, Branding, and Icons, plus Overview/Design System Overview and Overview/How to Use Storybook. Every page reads its values live from src/app/theme.ts (via createAppTheme/useTheme) rather than a second hand-typed spec, closing the drift risk in DesignSystem.tsx's hand-copied color/typography arrays. Typography now documents all 11 custom form-specific variants (previously 4 shown in-app) with their real mapped HTML element. MUI Theme Overrides documents all 18 override groups, including the 9 DesignSystem.tsx's equivalent table omitted (Skeleton, LinearProgress, Badge, Select, MenuItem, Breadcrumbs, FormHelperText, Toolbar, CssBaseline). Branding renders every real client's logo asset. Breakpoints & Responsive Design includes a live side-by-side comparison of the real theme vs. forceMobileLayout: true. " +
      "Guidelines/Accessibility (new): translates InformationArchitecture.tsx's ~40-row accessibilityRequirements table into 11 thematic, component-oriented guidance sections rather than reproducing the raw table — the IA table itself is untouched and remains the governance-level requirements/status record. " +
      "Investigated per the Phase 2 spec, not fixed: the MuiCssBaseline → .SelectionGroup-root .SelectionGroup-label coupling flagged in the Phase 1 audit cannot be moved into SelectionGroup.tsx as a small change, since that component never renders the label itself — 8 independent call sites (FieldRenderer.tsx ×3, CoverageCategorySelector.tsx, QuoteCalculator.tsx ×2, QuoteModal.tsx ×2, ResumeMethod.tsx, Beneficiary.tsx) apply the .SelectionGroup-label className directly. Documented as technical debt on Foundations/MUI Theme Overrides instead. " +
      "Updated src/docs/StorybookAudit.md with a full DesignSystem.tsx and InformationArchitecture.tsx migration matrix (§10) and a recommended Phase 2B scope; updated src/docs/ComponentInventory.md's Foundations rows to Done. Forms/Layout/Navigation/Content/Feedback/Overlays/Coverage & Commerce component stories were explicitly not built this phase (deferred to Phase 2B), and neither DesignSystem.tsx nor InformationArchitecture.tsx had any content removed, shortened, or routes/links changed.",
  },
  {
    id: "CL-024",
    date: "2026-09-04",
    area: "Storybook / Documentation",
    summary:
      "Completed a Phase 1 Storybook audit: rebuilt the component inventory from current source, wrote a Storybook implementation plan and information architecture, and logged repeated inline patterns and stale documentation for Phase 2",
    details:
      "No stories were created and no components were refactored in this pass — this was an audit-and-plan phase only, run against the current src/ tree directly rather than against prior documentation. src/docs/ComponentInventory.md was fully rewritten (the previous version tracked a folder migration to common/, overlays/, shell/, and fields/ that no longer exist; current folders are content/docs/feedback/forms/layout/navigation/ui) with a category-by-category table covering foundations, layout, forms, navigation, content, feedback, overlays, coverage & commerce, and cross-cutting interactive/state/accessibility patterns, each row noting reuse status, existing-documentation status, and a recommended action/priority. A new src/docs/StorybookAudit.md documents the audit methodology, cross-checks every existing documentation source (DesignSystem.tsx, the three Site_Components_Inventory_Tier*.md files, pageflows.md, RefactorPlan.md, and src/content/docs/componentInventory.ts) with a verdict on each, proposes a user-facing Storybook information architecture (Foundations/Layout/Forms/Navigation/Content/Feedback/Overlays/Coverage & Commerce/Application Patterns) organized by UI purpose rather than source folder, and lays out a prioritized Phase 2 sequence (foundations, then shared primitives, form controls, layout, navigation, feedback, complex application/commerce patterns, page-specific patterns). " +
      "Notable findings logged for Phase 2, not fixed here: a countdown-timer engine duplicated between Resume.tsx and ResumeCode.tsx, a full-page 'processing/redirecting' loading screen duplicated between DocuSign.tsx and HealthQd.tsx, a custom radiogroup-from-SelectionGroup-rows pattern built independently three times (FieldRenderer, Beneficiary.tsx, ResumeMethod.tsx), a responsive field-row grid copy-pasted across four pages, three Health pages reimplementing conditional-reveal logic inline instead of using ConditionalGroup, and Resume.tsx/ResumeCode.tsx/ResumeMethod.tsx hand-rebuilding the PageShell/FormShell/PageHeader composition that already exists. Also flagged: SectionDivider's chipVariant prop renders inverted from its name; neither of the app's two scrollToFirstError implementations calls .focus() on the invalid field; Beneficiary.tsx's remove-beneficiary action has no confirmation step unlike the equivalent DynamicList pattern; src/components/layout/QuoteModal.tsx has no confirmed render sites outside a documentation demo despite being listed as in-use in componentInventory.ts, and needs team confirmation before Storybook treats it as either a live pattern or dead code.",
  },
  {
    id: "CL-023",
    date: "2026-09-03",
    area: "Portal Admin",
    summary:
      "Introduced the Portal Admin landing page as the new root of the internal documentation/admin area; reorganized Information Architecture and Design System around it",
    details:
      "Added a new internal-only Portal Admin page (src/pages/PortalAdmin.tsx, route /portal-admin) as the primary entry point for internal users, with five sections: Active Project Tasks + Change Log, Portal Information, Portal Projects, Portal Change Management (TBD), and Portal TPA Admin (TBD). The Change Log (previously a table on Information Architecture) moved here in full, now rendered as a card list (src/components/docs/ChangeLogList.tsx) with an accessible 'Show more details' / 'Show less' control (aria-expanded) per entry instead of always-visible long-form text. Portal Information links out to Information Architecture and Design System with a description of each page's scope. Portal Projects introduces a reusable project-resource dialog pattern (src/components/docs/ProjectResourceModal.tsx, built on the existing AppModal) for two projects: Portal Template Project (Timeline/Tasks, Template Changes, Migration Schedule, Feedback, Future Initiatives — data in src/content/docs/portalProject.ts) and Portal Requirements Project (explicitly marked TBD — no authoritative resources exist in this repository yet). Added a reusable DocsBreadcrumbs component (src/components/docs/DocsBreadcrumbs.tsx) and applied it to Portal Admin, Information Architecture, and Design System so the internal hierarchy (Portal Admin → Portal Information → Information Architecture / Design System) is consistently navigable. " +
      "On Information Architecture: reordered the primary sections to Pages, Fields, Features, Flows, Rules, Configurations, URL Parameters, Error Messages, Content, Accessibility; renamed the 'Site Rules' section/anchor to 'Rules'; removed the Change Log and Template Changes sections (moved to Portal Admin / Portal Template Project resources respectively, data relocated to src/content/docs/changeLog.ts and src/content/docs/templateChanges.ts); folded the former standalone Coverages section into Configurations as a 'Coverage configuration by product' subsection (same underlying data, now grouped with other client-driven configuration rather than as its own top-level section); removed the Components inventory section (data relocated to src/content/docs/componentInventory.ts and re-presented on Design System); and added a new Features section (src/content/docs/features.ts) documenting Client configurations, URL parameters, Single-page/multi-page template, Autosave, Resume, Advisor flow, TPA integration, Abandoned leads, Health flows, and InstandID at a feature level, with each entry's active-client implementation status computed live via getActiveClient(), getActiveClientCoverages(), and coverageUnlocksPage() rather than hardcoded. " +
      "On Design System: added a new Component library section (src/components/docs/ComponentInventorySection.tsx) presenting the relocated component inventory with the same search/filter and detail-dialog behavior it had on Information Architecture, now built on AppModal instead of a page-local dialog.",
  },
  {
    id: "CL-022",
    date: "2026-09-03",
    area: "Accessibility",
    summary:
      "Formally added WCAG 2.2 Level AA accessibility requirements to the Information Architecture as the template's conformance target; audited the shared prototype implementation against them and corrected confirmed gaps",
    details:
      "New Accessibility section added to this document (src/pages/InformationArchitecture.tsx, between Site Rules and Template Changes, plus a matching Table of Contents/sidebar entry): defines the template-level accessibility requirements — not just prototype implementation notes — grouped by Semantic structure, Keyboard accessibility, Focus visibility and management, Forms and validation, Dynamic content and status messaging, Dialogs/drawers/overlays, Images and icons, Navigation and progress, Color and visual presentation, Pointer/touch interaction, Authentication/resume flow, and Testing & validation, each requirement referencing the relevant WCAG 2.2 success criterion and a current implementation status (Implemented / Partial / Requires production testing). The prototype is documented as targeting WCAG 2.2 AA, not as already being certified conformant. " +
      "Fixes made during the audit — FieldRenderer.tsx: fixed a radiogroup whose aria-labelledby referenced a FormLabel id that was never rendered when hideLabel is used (a real WCAG 4.1.2 failure affecting every Yes/No medical question on HealthLi.tsx, HealthDi.tsx, and HealthSi.tsx, which now supply that id on their external FormLabel); added aria-describedby from the radiogroup and checkbox-group to their helper text; gave the checkbox-group its own group role/aria-labelledby (previously ungrouped); added required/aria-required to the single-checkbox control. DynamicList.tsx (shared by Eligibility, Profile, and the Health detail lists): removing an item now restores focus to the \"Add\" button instead of dropping it to the document body, and adding/editing/removing an item posts a polite live-region announcement. Beneficiary.tsx: Edit/Remove buttons now get a unique accessible name per beneficiary via DynamicListItem's itemLabel; removal restores focus to that product's \"Add Beneficiary\" button; the share-percentage validation error is now also surfaced as a field-level error (via react-hook-form setError) instead of only a page-level banner. ProductCatalog.tsx: paired every InputLabel/Select (benefit amount, waiting period, maximum benefit period, rider amount) with a labelId, since without it the accessible name of each Select fell back to just the selected value rather than the field's label; added aria-describedby for the two selects with helper text; labeled the loading and per-row recalculating spinners. QuoteCalculator.tsx: the Gender and \"Do you use nicotine products?\" custom radio rows now use the same radiogroup/role=radio/roving-tabindex ARIA wiring as FieldRenderer's radio fields (previously unwired); focus now moves to the revealed product list after \"See my quote\" is clicked, since that button unmounts and previously dropped focus; the \"Loading your coverage options\" state is now a status region. CoverageNeedsCalculator.tsx, TotalCostSummary.tsx, and EstimatorProductCard.tsx: estimate/total panels are now live regions and their recalculating spinners are labeled, since these values previously changed silently for screen reader users. CoverageOptionsPanel.tsx: category tabs no longer lose their accessible name on small screens where the text label is visually hidden. MemberVerification.tsx: the verification-method and each security-question RadioGroup are now linked to their question text via aria-labelledby. AppDrawer.tsx: drawers now expose an accessible name (aria-labelledby to their title, or a new ariaLabel prop) — previously every drawer opened as an unlabeled dialog; AppMenu.tsx's hamburger-menu Drawer and AppHeader.tsx's coverage-summary drawer/cart button (whose label now includes the live item count) were updated to use it. AppShell.tsx: added a \"Skip to main content\" link as the first focusable element (targeting a new id/tabIndex on AppBody.tsx's main landmark), and moved the cookie-consent banner earlier in the DOM so its close button is reachable near the start of the tab order instead of after the entire page. ClientHelpBanner.tsx: labeled the \"Schedule a Call\" dialog's close button. CategoryHeader.tsx: changed from an h6 to an h3 element (same visual size) so category headings no longer skip from the page's h2 straight to h6. PageNav.tsx: the Next/Submit button keeps an accessible name while its spinner is shown instead of going nameless mid-submit. ProgressStep.tsx: the active step now carries aria-current=\"step\" in addition to its visual styling. AppSnackbar.tsx: role now follows severity (status for info/success, alert for error/warning) instead of always alert, matching PageAlert's existing pattern. QuickDecisionInfoBox.tsx: the \"Show more/less\" toggle now exposes aria-expanded. MockEmailPreview.tsx: expandable preview rows are now keyboard-operable (tabIndex, role=button, Enter/Space, aria-expanded). ResumeCode.tsx: the \"Resend code\" link and button were previously no-ops; they now reset the countdown and confirm via a live region that a new code was sent. ApplicationEditConfirmation.tsx: announces arrival via a live region, since this page is reached by a direct navigate() from Review's \"send back to advisor\" dialog that bypasses the standard Next-button transition announcement used elsewhere.",
  },
  {
    id: "CL-021",
    date: "2026-09-02",
    area: "WAEPA client",
    summary:
      "WAEPA product name overrides, landing hero copy, LI max-aggregate info alert, quote-tool smoker question removed; fixed a dummy-data bug inflating the DI estimated cost, and aligned Payment page's estimated-cost font size with the Coverage page",
    details:
      "Coverage names (src/config/clients/waepa.ts → coverages.overrides): li-group-term now names to " +
      "'Group Term Life Insurance', di-short-term to 'Group Short-Term Disability Income Insurance' " +
      "(previously unnamed, falling back to the base catalog names 'Group Term Life' / 'Short-Term " +
      "Disability Insurance'). Landing page hero (src/content/clients/waepa.ts → home.hero): title set to " +
      "\"Safeguard your family's future.\", description set to \"Group Term Life and Group Short Term " +
      "Disability Insurance, available exclusively to Civilian Federal Employees. Start your application " +
      "today.\" (previously used the shared defaults). Coverage page LI info alert (src/config/" +
      "coverageConstants.ts → clientMaxAggregateNoteOverrides.waepa.LI): changed from null (alert " +
      "suppressed) to member/spouse text — \"The maximum available for a member/spouse is $2,000,000.\" — " +
      "matching the pattern already used for AVMA's LI category. Quote tool smoker question " +
      "(new ClientConfig.coverages.hideSmokerQuestion flag, set true for waepa; consumed by " +
      "getCategoryRequirements in src/config/coverageConstants.ts and passed from src/components/layout/" +
      "QuoteModal.tsx and src/components/forms/QuoteCalculator.tsx): WAEPA's quote tool no longer asks or " +
      "requires the 'Do you use nicotine products?' question for LI/SH categories. Scoped to the quote " +
      "tool only — the real Coverage page application flow (src/app/useCoverageState.ts) is untouched and " +
      "still asks the smoker question for LI/SH, since underwriting still requires it there. DI estimate " +
      "bug fix (src/dev/utils/generateFormData.ts): the dev 'auto-fill sample data' helper previously " +
      "hardcoded every coverage's sample amount to 100000 (and 50000 for spouse) regardless of the " +
      "coverage's actual min/max range. For WAEPA's di-short-term (real range $1,000–$4,000), that bogus " +
      "$100,000 amount fed into estimateMonthlyPremium('DI', amount) = amount * 0.02, producing a fake " +
      "~$2,000/mo estimate. Sample amounts are now computed via a new pickSampleAmount() helper using the " +
      "same getCoverageAmountRange() utility the real coverage forms use, snapped to the coverage's " +
      "amountStep and clamped to its min/max — affects all clients' dummy data, not just WAEPA. Payment " +
      "page est. cost font size (src/pages/Payment.tsx): the per-product 'Total estimated cost' amount was " +
      "variant='subtitle2' with no explicit size (~0.875rem); added fontSize: '1.25rem' to match the " +
      "Coverage page's per-applicant 'Est. cost' amount styling (src/components/forms/ProductCatalog.tsx), " +
      "so the same figure reads at a consistent size across Coverage and Payment.",
  },
  {
    id: "CL-020",
    date: "2026-09-02",
    area: "Coverage / Home quote tool",
    summary:
      "Made est. cost rate typography, product-reveal behavior, and the estimated-cost panel consistent between the Coverage page and the quote drawer; trimmed redundant/empty states from the Coverage page's inline cart",
    details:
      "Est. cost rate font size: the '$X.XX/mo' rate span shown below the benefit-amount dropdown is now " +
      "1.25rem in both places it previously differed — src/components/forms/ProductCatalog.tsx (Coverage " +
      "page product cards, was subtitle2 with no explicit size) and src/components/forms/" +
      "EstimatorProductCard.tsx (quote drawer product cards, was the smaller 'caption' size). " +
      "Coverage page inline cart (src/components/ui/CoverageCart.tsx, CoverageCartInline — the 'Your " +
      "requested coverage' panel below the product catalog, NOT the full-drawer cart variant): the section " +
      "title and all of its content are now wrapped in a single grandTotal > 0 check, so nothing renders " +
      "(no title, no 'No coverage selected yet.' placeholder) until an amount is selected for at least one " +
      "product/applicant. The full-drawer CoverageCartDrawer (header cart icon and the Coverage page's own " +
      "summary drawer) is untouched and still shows its own empty state. Also removed the redundant 'Total " +
      "estimated cost $X.XX/mo' row + divider that was rendered directly below the shared TotalCostSummary " +
      "component inside CoverageCartInline — TotalCostSummary already renders an equivalent 'Total' row, so " +
      "the duplicate was deleted rather than the one inside TotalCostSummary. Quote drawer (src/components/" +
      "forms/QuoteCalculator.tsx): clicking 'See my quote' now scrolls the drawer so the revealed product " +
      "cards land at the top (a ref on the products Stack + scrollIntoView, mirroring the scroll-to-first-" +
      "error pattern already used on the Coverage page). The 'See my quote' button itself now hides once " +
      "clicked and only reappears if a coverage question (gender, tobacco use, income, hours, business " +
      "expenses/responsibility) or the category selection is changed afterward (new handleQuoteFieldChange " +
      "helper called from each field's onChange and from handleCategoryToggle) — the same show/hide " +
      "contract as the Coverage page's 'See my coverage options' button, which stays visible above the " +
      "revealed products the whole time (fields were never hidden there, only the button). Finally, the " +
      "hand-rolled 'Estimated cost¹' box at the bottom of the quote drawer was replaced with the same " +
      "TotalCostSummary component used on the Coverage page and in the coverage cart drawer, and — " +
      "matching the Coverage page's inline cart — it is now hidden entirely (no 'Added coverage will " +
      "appear here' placeholder) until at least one product/applicant has an amount selected; the rate-" +
      "frequency toggle and 'Apply for coverage' button remain visible whenever products are shown, " +
      "regardless of whether any are yet selected.",
  },
  {
    id: "CL-019",
    date: "2026-09-01",
    area: "Templates / Home",
    summary:
      "Fixed cramped form padding on large screens under template=single; split hero/form max widths (700/800); documented the template feature",
    details:
      "createAppTheme's forceMobileLayout option (src/app/theme.ts) previously pinned sm/md/lg/xl to an " +
      "unreachable width. That also blocked sm-level padding/spacing (e.g. FormRoutePage's FormShell, " +
      "px: { xs: 2, sm: '48px' }) from ever activating, so the form fields/page title/breadcrumbs area " +
      "stayed at its tightest xs padding even on a real desktop-width browser. forceMobileLayout now only " +
      "overrides md/lg/xl; sm (600px) is left at its default so that padding activates normally once the " +
      "real viewport is 600px or wider, while ProgressStep's isDesktop check and other up('md') structural " +
      "branches (AppDrawer, AppModal, HelpChips, MemberVerification) still stay forced to their narrow-screen " +
      "variant. Home.tsx (single template) now caps the hero at 700px (SINGLE_TEMPLATE_HERO_MAX_WIDTH) and " +
      "the surrounding form column at a wider 800px (SINGLE_TEMPLATE_FORM_MAX_WIDTH) instead of both sharing " +
      "one width, with the hero centered inside the wider column. Documented in Information Architecture: " +
      "new 'template' row in the URL Parameters table (+ source-review summary row), 'waepagi' added to the " +
      "'client' parameter's values, a new 'Default form template' Configurations row, and three new 'Form " +
      "Template' Site Rules entries. Documented in Design System: new 'Form template layout' design rule " +
      "under Design rules.",
  },
  {
    id: "CL-018",
    date: "2026-09-01",
    area: "Fields",
    summary:
      "FieldRenderer now auto-upgrades dropdown fields with 10+ options to the searchable-select component; existing state dropdowns switched over",
    details:
      "Added getEffectiveInputType() in src/components/forms/FieldRenderer.tsx: any field configured as " +
      "inputType: 'dropdown' whose options array has 10 or more entries is rendered via the existing " +
      "'searchable-select' branch (MUI Autocomplete) instead of a plain MUI Select, so long lists are " +
      "type-ahead filterable instead of requiring a long scroll. Fields already explicitly set to " +
      "'searchable-select' (e.g. waepa-employer, waepa-retired-employer, the isitrust membership override) " +
      "are unaffected. Also updated the 7 US state dropdowns that share the 67-entry usStateOptions list " +
      "(state-province, state, business-state, medical-state, drivers-license-state, " +
      "spouse-drivers-license-state, spouse-medical-state in src/config/fields/index.ts) to explicitly " +
      "declare inputType: 'searchable-select', matching the convention already used for other long lists.",
  },
  {
    id: "CL-017",
    date: "2026-09-01",
    area: "Templates / Home",
    summary:
      "Added template=single mode (forces the mobile/narrow layout app-wide and merges Home's hero with the Membership form); added waepagi client defaulting to it",
    details:
      "New FormTemplate concept ('single' | 'multi', default 'multi') resolved in " +
      "src/config/template/resolveTemplate.ts via ?template= URL param → sessionStorage → the active " +
      "client's features.defaultTemplate → default. Existing multi-page routing, FormRoutePage, and " +
      "ProgressStep are unchanged for both templates — no separate one-page form shell. Instead, " +
      "createAppTheme (src/app/theme.ts) accepts a forceMobileLayout option that pushes the sm/md/lg/xl " +
      "breakpoints to unreachable widths; App.tsx enables it whenever template=single, so every existing " +
      "responsive sx style and useMediaQuery(breakpoints.up(\"md\")) check (including ProgressStep's desktop " +
      "vs. mobile stepper branch, drawers, modals) renders its narrow-screen variant regardless of actual " +
      "browser width. Home.tsx also special-cases isSingleTemplate: skips the CTA buttons, resume prompt, " +
      "quote tool, How Applying Works, Coverage Options, and credentials sections, and renders the hero " +
      "(tagline, title, description — no hero image, larger title/description type) directly followed by " +
      "the real Membership page component, so landing on '/' shows hero + the first form step inline with " +
      "no separate landing-page-then-navigate-to-membership step; Next/Back from there behave exactly like " +
      "the normal multi-page flow. The hero and form share a single 700px max width container. Added a new " +
      "waepagi client (src/config/clients/waepagi.ts, src/content/clients/waepagi.ts — copies of waepa) with " +
      "features.defaultTemplate: 'single' and features.homePageVariant: 'hero-image'.",
  },
  {
    id: "CL-016",
    date: "2026-08-31",
    area: "Information Architecture",
    summary:
      "Added URL Parameters section documenting the current-to-new-template URL parameter migration spec",
    details:
      "New URL Parameters table added to this document (after Template Changes), transcribed from the " +
      "New Site Template URL Parameter Specification doc. Covers the full current-template parameter " +
      "inventory (form, apply, applicant, category, categories, prods, dprods, featured_prod, preselect, " +
      "qt, pmt, amt, mrate, association, campaign, ctg, nc, URLClickedFrom, app) with each parameter's " +
      "Migrated / Modified / Removed / TBD status, current vs. new value formats, current vs. new " +
      "behavior, and migration notes/rules. Also includes the additional parameters identified in the " +
      "new-template source that were not part of the current-template inventory (variant, flow, client, " +
      "inputChecks, dev, reset), each flagged New and annotated with production-requirement status and " +
      "source file references, plus the source review summary table classifying each as user-facing, " +
      "prototype/configuration, or development-only.",
  },
  {
    id: "CL-015",
    date: "2026-08-31",
    area: "Information Architecture",
    summary:
      "Added Error Messages section cataloging all page-level and field-level error copy, triggers, and validation logic",
    details:
      "New Error Messages table added to this document (between Fields and Configurations), grouped by area: " +
      "Fields (generic FieldRenderer validation — required, email/phone/SSN/ZIP/percent/month-year format checks, " +
      "numbers-only, phone-type selector), Application Flow (the shared 'Please correct the errors below before " +
      "continuing.' banner shown by FormRoutePage whenever Next/submit is clicked with field errors present), " +
      "Eligibility (DOB/ZIP/state required and date-completeness messages from EligibilityFields.validateEligibility, " +
      "the age-80-or-older ineligibility alert shared with Home's quick-quote tool, missing-child and missing-spouse " +
      "dependent messages, and the silent TPA-verification navigation block), Membership (member-ineligible warning " +
      "and WAEPA/AMA associate-membership info alerts), Home / Quick quote (QuoteCalculator's gender/tobacco/income/" +
      "hours/expenses/responsibility required messages), Coverage (select-a-category, select-a-coverage, " +
      "select-an-applicant, select-a-benefit-amount messages from useCoverageState.validate, the category-question " +
      "correct-errors message, the dependent-only confirmation dialog, the all-categories-ineligible alert, and the " +
      "$0-selection notice), Beneficiary (missing-beneficiary page error; the add/edit modal's max-10-per-designation, " +
      "invalid-share, and share-exceeds-remaining save-time errors; and the maxed-designation/trust-exclusivity " +
      "modal warnings), Payment (missing payment method/frequency message), and Resume flow (blank email/code " +
      "inline errors and the expired secure-link / expired verification-code alerts). Each row lists the level " +
      "(page-level alert vs. field-level), the triggering condition, the exact message copy, and an implementation " +
      "reference.",
  },
  {
    id: "CL-014",
    date: "2026-08-29",
    area: "Site Rules",
    summary:
      "Expanded Site Rules with UI interaction mechanics; added Drawers, DynamicList, and Advisor flow rule areas",
    details:
      "Folded interaction pattern detail into Site Rules rather than maintaining a separate section. " +
      "Existing rules expanded: Intermediate-step Next interception (named Coverage/Profile usages), " +
      "Progress-saved feedback (named AppSnackbar + positioning), Coverage category selection " +
      "(two-step questions → 'See my coverage options' → catalog), Per-applicant product selection " +
      "(checkboxes, amount dropdowns, riders, waiting/benefit period), Dependent-only confirmation " +
      "(clarified onBeforeNext hook), Beneficiary Add/edit/remove (modal mechanics, tabs, quick-fill " +
      "buttons, live allocation display, maxed state), Beneficiary Apply to other coverages (separate " +
      "record with new ID, Skip action), Profile conditional follow-up fields (named ConditionalGroup), " +
      "Health Yes/No (merged with DynamicList inline expand/collapse), Review edit confirmation (consumer " +
      "and advisor branches), Menu tools (named nested AppDrawers), Payment bank account (listed all fields). " +
      "New rule areas: Drawers (help/reference drawer mechanics, swipeable variant), DynamicList " +
      "(Add/Edit/Remove modal pattern), Advisor flow (send-to-applicant dialog, advisor-mode review edit). " +
      "New rules in existing areas: Profile repeatable insurance company records, Coverage per-applicant " +
      "product selection.",
  },
  {
    id: "CL-013",
    date: "2026-08-29",
    area: "Home / Components",
    summary:
      "Extracted HowApplyingWorksPanel and CoverageOptionsPanel from Home page into standalone reusable components",
    details:
      "The How Applying Works step list and Coverage Options tabbed browser were previously implemented " +
      "inline in Home.tsx. Both are now standalone components in src/components/ui/: HowApplyingWorksPanel " +
      "(supports 'page' and 'drawer' variants; drawer variant manages sub-drawers for Application Review " +
      "and QuickDecision℠) and CoverageOptionsPanel (tabbed category browser with product list, amount " +
      "range, eligible applicants, and QD indicator; 'page' and 'drawer' variants; featured products sort " +
      "first). Home.tsx imports these components in 'page' variant; AppMenu now renders both in 'drawer' " +
      "variant for its 'How Applying Works' and 'About Coverage' tools, replacing the former inline " +
      "CoverageOptionsDrawerContent for the coverage-options drawer. " +
      "Two new component entries added to the IA components table.",
  },
  {
    id: "CL-012",
    date: "2026-08-28",
    area: "Feedback / Snackbar",
    summary:
      "Added base AppSnackbar component; updated ProgressSavedSnackbar to use it; snackbar now appears at bottom on small screens",
    details:
      "Created src/components/feedback/AppSnackbar.tsx as a generic snackbar base component. Accepts severity (success, warning, error, info), message string, autoHideDuration, and open/onClose props. Uses MUI useMediaQuery to place the snackbar at the bottom-center on small screens (xs) and top-center on large screens (sm+), replacing the previous hard-coded top position. ProgressSavedSnackbar (src/components/feedback/ProgressSavedSnackbar.tsx) was refactored to delegate entirely to AppSnackbar with severity='success' and message='Progress saved'. The Coverage page 'Added' snackbar also uses AppSnackbar.",
  },
  {
    id: "CL-011",
    date: "2026-08-28",
    area: "Coverage",
    summary:
      "Coverage added drawer shown only for first product; subsequent adds show 'Added' snackbar",
    details:
      "Changed the Coverage page product-add feedback behavior. The 'Coverage added' AppDrawer (CoverageCart variant='drawer' source='coverage-page') is now opened only when the very first product/applicant is toggled on from a state of zero selected coverages. All subsequent product or applicant additions — including adding a second applicant to an existing product or adding a second product — show a compact 'Added' success snackbar (AppSnackbar) instead of re-opening the drawer. State tracked via a per-render ref (initialDrawerShownRef) in useCoverageState.ts. The new addedSnackbarOpen / setAddedSnackbarOpen state pair is exposed from useCoverageState and consumed in Coverage.tsx.",
  },
  {
    id: "CL-010",
    date: "2026-08-28",
    area: "Applicant section titles",
    summary:
      "Audited all ApplicantSectionDivider usages; confirmed consistent icon+label+background styling with no legacy variants",
    details:
      "Full audit of ApplicantSectionDivider (src/components/layout/ApplicantSectionDivider.tsx) usage across Coverage, Contact, Profile, Beneficiary, Review, HealthLi, HealthDi, and Eligibility pages. All usages correctly pass showLabel={shouldShowApplicantLabel(...)} for the member/self applicant so the section title is hidden when only one applicant is applying (member-only flow). The ApplicantSectionLabel sub-component already implements the standard icon + label + rounded background styling. No page retains old-style uppercase text, raw 'Member' string labels, applicantSectionBannerSx, or sectionTitleIconSx styling — those exports remain in formSectionTitle.ts marked @deprecated for reference only. The CoverageCart drawer already suppresses per-applicant labels inside product cards when only member is selected (isMemberOnly check).",
  },
  {
    id: "CL-009",
    date: "2026-08-28",
    area: "Eligibility / ZIP-to-state",
    summary:
      "ZIP auto-sets state but user can now manually override state without being reverted; new ZIP change re-derives state",
    details:
      "Updated EligibilityFields (src/components/forms/EligibilityFields.tsx) to decouple the ZIP→state derivation from the state field's manual override. Previously, a useEffect watched both zipCode and state, causing the state value to revert if the user manually changed it. Now a ref (lastDerivedZipRef) tracks the last ZIP that triggered a state derivation. The effect only fires and updates state when the ZIP value has actually changed relative to that ref. When the user manually changes state, the ref is updated to the current ZIP so the effect does not override the user's selection. If the user subsequently changes ZIP again, state is re-derived from the new ZIP. ZIP field value is never affected by state changes.",
  },
  {
    id: "CL-008",
    date: "2026-08-28",
    area: "Content system",
    summary: "Centralized remaining hardcoded UI display text into the content system",
    details:
      "Extended src/content/types.ts and src/content/defaults/ to cover display text that previously lived inline in .tsx files. Added three new top-level SiteContent keys: dialogs (ConfirmationDialog variants for Review's edit-application confirm and Coverage's dependent-coverage confirm; SendApplicationDialog variants for Profile's send-to-applicant and Review's request-edit; Beneficiary's add/edit/apply-to-others modal copy; AppHeader's coverage-details dialog labels), statusMessages (DocuSign, Health QD, and Health CIR waiting/placeholder page copy), and beneficiary (Beneficiary page inline alert/validation copy). Extended existing content types: home (instant-quote section, review-process link label, QuickDecision availability suffix, no-categories message, 'Available for:' label), coverage (category-selection and form-correction error messages), receipt (documents note, summary bar labels, Coverage decisions heading/description, What happens next items, support/contact card copy), and help (drawer titles for Application review and Coverage portfolio, nested sub-drawer titles used inside the How Applying Works drawer, and a new QuickDecision drawer content section). All affected pages/components (Home, Coverage, Beneficiary, Receipt, Review, Profile, AppHeader, DocuSign, HealthQd, HealthCir, QuickDecisionExplainer, CoveragePortfolioDrawer, helpContent.tsx) now read these strings from getContent() instead of hardcoding them. Button labels, form field labels, aria-labels, and the DesignSystem/InformationArchitecture/MockEmailPreview dev pages were intentionally left out of scope. Added the Content section (this table) documenting the top-level content model.",
  },
  {
    id: "CL-007",
    date: "2026-08-27",
    area: "Email templates",
    summary: "Reorganized Email Templates page into Consumer/Advisor sections and overhauled mock email content",
    details:
      "The Email Templates (mock email) page is now split into two always-visible sections — 'Consumer Flow Emails' and 'Advisor Flow Emails' — replacing the previous tab switcher. Shared decision-status logic (buildSelectedCoverageEntries, getOrderedDecisionEntries, getQdDecisionResult, getDecisionStatus, formatCurrencyAmount, APPLICANT_LABELS) was extracted from Receipt.tsx into src/utils/coverageDecisions.ts so the receipt page and receipt email stay in sync. Email content changes: removed the 'New York Life Insurance Company is licensed/authorized...NAIC ID #66915' sentence from the shared NYL footer on all emails; all 'Dear' salutations now use a single consistent test applicant name (Caroline Correa, first + last) instead of a mix of full names and first-name-only; 'Continue my application' buttons in the autosave and pending-reminder emails are now preceded by an identity-verification notice ('To access your application information, you will be asked to verify your identity using the email and phone number provided in your application.'); the 'Your application will be saved for 10 days.' warning box was removed from the purge-reminder ('Your insurance application progress') email; the magic-link button was renamed from 'Confirm my email' to 'Verify my email'. Resume links: any email/button linking to the resume flow (autosave, pending-reminder 'Continue my application', and the new advisor portal line) now actually navigates to the internal /resume?client={activeClientId} route, while the URL shown in the email body is a fake production-style '{clientAcronym}.nylinsure.com/resume' string for demo purposes only. The receipt email ('Thank you! We've received your insurance request') body text was rewritten to 'Your insurance application through {Association Name} has been received and we've begun processing your application.' and now renders simplified, inline-styled HTML decision boxes mirroring the Receipt page's 'Coverage decisions' section (coverage name, status badge, applicant/amount subtitle, decision description) for each selected coverage. All advisor emails now include an 'Association: {active association name}' row at the top of the details table and a line below the table linking to the '{clientAcronym} Advisor Portal' (same fake-URL/real-link resume pattern).",
  },
  {
    id: "CL-006",
    date: "2026-08-24",
    area: "Eligibility",
    summary: "Added child-section eligibility notice for unmarried-children coverage rule",
    details:
      "On the Eligibility page, the Child dependent section now displays an info alert directly under the section header: 'Only unmarried children are eligible for coverage.' The notice appears at the top of the child section before child entries are added via DynamicList.",
  },
  {
    id: "CL-005",
    date: "2026-08-24",
    area: "Navigation / Coverage",
    summary: "Added global intermediate-step Next interception and dependent-only Coverage confirmation",
    details:
      "FormRoutePage now supports a shared onBeforeNext interception hook that can pause forward navigation, present an intermediate step, and then resume the standard transition through a continueNavigation callback. This centralizes pre-next confirmation behavior while preserving transition messages, progress snapshot behavior, and destination routing. Profile advisor send behavior was migrated to this shared pattern. Coverage now uses the same mechanism to intercept Next when selected coverage is for spouse and/or child only (no member selection) and shows a confirmation dialog: 'To apply for dependent coverage, you must have this group insurance coverage.' with Continue and Cancel actions. Continue resumes standard navigation; Cancel keeps the user on Coverage.",
  },
  {
    id: "CL-004",
    date: "2026-08-17",
    area: "Advisor flow",
    summary: "Advisor send/edit dialogs finalized on a single Review page path; Application Edit Confirmation updated",
    details:
      "Finalized advisor-assisted behavior: (1) On Profile, when advisor-flow-type is present, Next opens SendApplicationDialog titled 'Send to applicant for review' with intro text 'This application will be sent to the following applicant for review, completion of any remaining steps, and e-signature.' The dialog shows applicant name + email. Send navigates to Advisor Send Confirmation; Cancel stays on Profile. (2) Applicant resume via resume?flow=advisor now lands on the standard Review page in advisor mode (single review page approach). The advisor-mode Review branch shows advisor-specific alerts, keeps legal/consent sections on the same page, and opens a SendApplicationDialog titled 'Request edit to application' when edit icons are clicked. This dialog shows advisor email only (no name) and intro text 'An alert will be sent requesting updates to your application. Your advisor will contact you with additional details and guidance.' Send routes to Application Edit Confirmation; Cancel stays on Review. (3) Earlier advisor-completed steps (Getting Started, Coverage, Profile) remain locked via advisorApplicantFlow session state and stepper/breadcrumb guards. (4) Application Edit Confirmation detail rows were reduced to show only 'Sent to advisor' and 'Request sent' (removed Applicant name and Application expires).",
  },
  {
    id: "CL-003",
    date: "2026-08-17",
    area: "Eligibility / Coverage",
    summary: "Added TPA member verification modal and Coverage Portfolio drawer",
    details:
      "When submitted eligibility data matches a TPA member record (dummy trigger: ABE client, first name Caroline, last name Correa, DOB 08/26/1990, state NY), Eligibility intercepts the form submission and opens a MemberVerification modal before navigating to Coverage. The modal has three dot-stepper steps: (1) method selection — send text code, send voice code, answer security questions, or proceed without verification; (2) security questions — three LexisNexis-style questions each with a 'None of the answers apply to me' option; (3) result screen (success or failure). Selecting 'None of the answers apply to me' for any question shows the failed verification screen; all other paths show the success screen. On modal close, tpa-verified is stored in ApplicationFormContext and navigation proceeds to Coverage. On Coverage, when tpa-verified is true, a 'View coverage portfolio' button opens a CoveragePortfolioDrawer listing the member's (and, when applicable, spouse's) existing in-force coverage: coverage name, amount, and riders. New components: MemberVerification (src/components/layout/MemberVerification.tsx), CoveragePortfolioDrawer (src/components/layout/CoveragePortfolioDrawer.tsx). Modified pages: Eligibility, Coverage. TPA Verification flow added to the Flows section of this document.",
  },
  {
    id: "CL-002",
    date: "2026-08-14",
    area: "Profile page",
    summary: "Renamed Financial information chip to 'Other coverage'; added conditional Financial questionnaire section",
    details:
      "Renamed the Financial information section chip label to 'Other coverage' (sectionLabels.financialInfo in pageSections.ts). Added a new profileFinancialQuestionnaireSelf page section ('Financial questionnaire') below the Other coverage section. The section is only shown when the member has a DI coverage amount greater than $2,000. It contains: total-net-worth, total-annual-unearned-income, is-self-employed, and — when is-self-employed = yes — a ConditionalGroup with is-sole-proprietor, is-professional-corporation, sole-proprietor-gross-income, sole-proprietor-gross-earnings, sole-proprietor-business-expenses, professional-corporation-annual-salary, professional-corporation-s-corp-distribution, professional-corporation-dividends, professional-corporation-bonus, bonus-payment-frequency, professional-corporation-commission, commission-payment-frequency, professional-corporation-benefits-cost, years-self-employed, work-from-home, has-work-location-outside-home, and work-location-details. All field IDs were already present in the field catalog and pageFields. The IA fields table reflects the new section automatically.",
  },
  {
    id: "CL-001",
    date: "2026-08-14",
    area: "Resume flow",
    summary: "Added Resume Method page; renamed security code to verification code",
    details:
      "Inserted a new Resume Method step between Resume (email entry) and Resume Code. The page presents a radio button choice — Text or Call — for how the user wants to receive their verification code. The chosen method is passed via location state to Resume Code, which now reads delivery mode from state instead of managing a toggle inline. Removed the 'Get security code with voice call instead' toggle link from Resume Code. Renamed all instances of 'security code' to 'verification code' on the Resume Code page (title, subhead, field label, error copy). Updated the resume flow diagram in this document. Updated the mock email magic link URL to point to /resume-method. Added resume-delivery-method to the field catalog and page fields catalog. Added resume-method to pages, router, and default content.",
  },
];
