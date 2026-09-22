# Component Inventory

> Historical audit record. Storybook now owns the live component inventory;
> references below to the former `DesignSystem.tsx` page describe migration
> history rather than the current documentation architecture.

Audit snapshot: 2026-09-04. Source of truth: current `src/` tree (verified by direct file reads + repo-wide grep, not by re-reading prior inventories).

## Purpose

This is a from-scratch replacement of the previous `ComponentInventory.md`, which tracked a folder-reorganization effort (`components/common`, `components/overlays`, `components/shell`, `components/fields`) that has since been superseded — those folders no longer exist. The current structure is `src/components/{content,docs,feedback,forms,layout,navigation,ui}/`.

This document exists to drive the Storybook build-out described in `src/docs/StorybookAudit.md`. It answers, per item: is it a component or an inline pattern, is it already reusable, does it have a story, is it documented anywhere today, what states/variants/responsive/a11y behavior a story needs to cover, what should happen to it, and how urgent that is.

**Priority key** (matches the Phase 2 sequence in `StorybookAudit.md`):
`P0` Foundations · `P1` Primitives/shared components used across many pages · `P2` Form controls · `P3` Layout patterns · `P4` Navigation · `P5` Feedback · `P6` Complex application/commerce patterns · `P7` Page-specific patterns

**Action key**: `Document` (write a story for an existing component as-is) · `Enhance` (component exists and has partial docs; story needs more variant/state coverage) · `Componentize` (an inline/repeated pattern should become a shared component first) · `Pattern-only` (worth a Storybook "pattern" page, not a component) · `Leave page-specific` (not worth extracting) · `Fix-then-document` (a real bug/inconsistency should be resolved before or while writing the story) · `Verify-then-document` (usage claim is unconfirmed/contradicted by grep — confirm with the team first) · `Retire` (deprecated; do not give it a story)

---

## 0. Foundations

Not components — theme tokens and conventions from `src/app/theme.ts` (609 lines). `src/styles/` exists but is empty; there is no separate token/CSS file, so Storybook foundation pages must read from `theme.ts` directly (or via a thin re-export) to avoid drifting the way `DesignSystem.tsx`'s hand-copied swatch arrays already have.

| Topic | Detail | Reusable source | Existing docs | Notes for Storybook | Action | Priority |
|---|---|---|---|---|---|---|
| Colors | 4 client primary presets (`default/teal/purple/dark-blue`); fixed success/error; no custom warning/info; text incl. custom `tertiary`; background incl. custom `subtle/surface/iconBadge`; custom palette groups `panel/notice/support`; exported consts `CARD_RADIUS`, `TEXT_PRIMARY`, `FIELD_BORDER_COLOR`, `LABEL_COLOR`, `SECTION_SURFACE_BG` | `theme.ts:10-172` | **Done (Phase 2A):** `Foundations/Colors` reads every value live from `createAppTheme`/`useTheme()`, per client preset, via the toolbar's Theme switcher | Reserved-color rule now documented explicitly on the Storybook page and on `Foundations/Branding` | Done | P0 |
| Typography | Inter font stack; h1–h6 all weight 800; 11 custom form-specific variants (`formPageTitle`, `formSectionLabel`, `formBackLink`, `formTransitionStatus`, `formBreadcrumb`, `formVerticalStepLabel(Mobile)`, `formProgressStepNumber`, `formProgressStepLabel`, `formProgressPercent`, `productNameLabel`) mapped to non-heading HTML tags via `variantMapping` | `theme.ts:28-70,175-284,491-507` | **Done (Phase 2A):** `Foundations/Typography` shows all 11 custom variants (vs. 4 previously) plus their mapped element, read live from `theme.typography` | — | Done | P0 |
| Spacing | 8px unit (`spacing: 8`) | `theme.ts:136` | **Done (Phase 2A):** `Foundations/Spacing` | — | Done | P0 |
| Breakpoints | Standard MUI xs/sm/md/lg/xl, **plus** `forceMobileLayout` mode (pins md/lg/xl to unreachable `1e6`) used by the `template=single` client feature to force mobile branches everywhere | `theme.ts:114-143` | **Done (Phase 2A):** `Foundations/Breakpoints & Responsive Design` — live side-by-side comparison of real theme vs. `forceMobileLayout` | — | Done | P0 |
| Border radius | `shape.borderRadius: 8` base; `CARD_RADIUS = "16px"` used by Card/Alert/OutlinedInput/ToggleButton; pill buttons at radius `9999` | `theme.ts:72-82` | **Done (Phase 2A):** `Foundations/Shape` | — | Done | P0 |
| Shadows | No global `shadows` scale override; ad hoc per-component (Button contained glow, AppBar flat/no shadow, DesignSystem's own hand-rolled card shadow not from theme) | `theme.ts` component overrides | **Done (Phase 2A):** `Foundations/Elevation` — documents the absence of a shadow system as a flagged open question, not a settled one | — | Done | P0 |
| Icons | `@mui/icons-material`, one default import per icon, no barrel file; Rounded variants preferred but 6 non-rounded icons coexist with no documented rule | grep across `src` | **Done (Phase 2A):** `Foundations/Icons`, ported with the same grouping/filter, Rounded-vs-not still flagged as an open question | — | Done | P0 |
| Branding/logo | `ClientBranding = { name, acronym, logo, logoAlt }`; per-client assets at `public/client/{id}/logo.{png,svg}`; **global NYL `/logo.svg` is hardcoded** (not client-configurable) in `AppFooter.tsx:224`, `Home.tsx:465`, `CookieDialog.tsx:53`, `mockEmail.ts:377` | `src/config/clients/types.ts:13-18`, `src/types.ts:27-28` | **Done (Phase 2A):** `Foundations/Branding` — real logo gallery for every client (served via a new Storybook `staticDirs` config), 4 hardcoded-logo locations flagged explicitly | Hardcoded-logo gap still not fixed, only documented | Done (docs); hardcoding still unfixed | P0 |
| Component-level theme overrides | 19 `MuiXyz` overrides incl. Button (pill, hover lift, colored glow), OutlinedInput (bold entered text), InputLabel/FormLabel, ToggleButton(Group) as radio/segmented shell, FormControlLabel (auto-bold on checked), FormGroup (forces column), Card/CardContent/Alert (shared radius), AppBar (flat), Container (`maxWidth: "md"` default), Link, Chip, StepIcon/StepConnector/StepContent, Skeleton/LinearProgress/Badge, **`MuiCssBaseline` reaching into `.SelectionGroup-root .SelectionGroup-label`** (leaky abstraction), Select/MenuItem (forced wrapping) | `theme.ts:286-596` | **Done (Phase 2A):** `Foundations/MUI Theme Overrides` now documents all 18 groups (the 9 previously-missing ones filled) with live examples. **Investigated, not fixed:** the CssBaseline→SelectionGroup coupling cannot be moved into `SelectionGroup.tsx` as a small change — that component never renders the label; 8 independent call sites apply the `.SelectionGroup-label` className. Documented as technical debt on the new Foundations page instead. | Documented; CssBaseline coupling downgraded to Leave as technical debt (real fix is a moderate refactor across 8 call sites, deferred to whichever phase gives `SelectionGroup` a `label` prop) | Done / P0 |

---

## 1. Layout

| Component/Pattern | Source | Purpose | Reusable? | Story? | In DesignSystem.tsx? | Used in | States/variants/responsive/a11y | Action | Priority |
|---|---|---|---|---|---|---|---|---|---|
| AppShell | `layout/AppShell.tsx` | Top-level chrome selecting header/menu/progress behavior | Yes | **Yes** (`Layout/AppShell`) | Listed only | Router, once per route (5 `variant`s: applicationForm/homepage/advisorLogin/advisorSend/resumeEmailCode) | **Done (Phase 2F):** 3 of the 5 variants shown (applicationForm/homepage/advisorLogin); renders the real skip-link, CookieDialog, AppHeader/Body/Footer, and DevTools composition, not a simplified stand-in | Done | P3 |
| AppBody | `layout/AppBody.tsx` | Main content wrapper, scroll-to-top on route change | Yes | **Yes** (`Layout/AppBody`) | Listed only | AppShell | **Done (Phase 2F)** | Done | P3 |
| AppHeader | `layout/AppHeader.tsx` | Sticky header: logo, progress bar, cart, menu, chat | Yes | **Yes** (`Layout/AppHeader`) | Listed only | AppShell | **Done (Phase 2F):** homepage/applicationForm/advisorLogin variants. AppHeader reads its current page from `window.location.pathname` via its own history-patched subscription, not react-router's `useLocation()` — Storybook's `MemoryRouter` decorator alone can't drive its progress-bar/cart state, so each story calls `window.history.pushState()` directly (the exact API AppHeader's own patch listens to) before rendering, verified with a smoke test that the real progress bar and real cart badge count both appear | Done | P3 |
| AppFooter | `layout/AppFooter.tsx` | Footer: support info, Terms/Privacy modals | Yes | **Yes** (`Layout/AppFooter`) | Listed only | AppShell | **Done (Phase 2F):** opens the real Terms of Use / Privacy Notice modals (see `Content/LegalDocList`) | Done | P3 |
| AppMenu | `layout/AppMenu.tsx` | Hamburger nav drawer w/ 4 nested tool drawers | Yes | **Yes** (`Layout/AppMenu`) | Live demo | AppHeader; also directly on DesignSystem.tsx | **Done (Phase 2F):** all 4 nested sub-drawers (How Applying Works, About Coverage, Needs Calculator, QuickDecision℠) are live and clickable in the one story, not simulated. The `swipeable` non-adoption gap (right `Drawer`, not `AppDrawer`) restated as a known, unfixed issue, per `Overlays/AppDrawer`'s own story | Done | P3 |
| PageShell | `layout/PageShell.tsx` | Generic centered page wrapper: title/error/help/maxWidth | Yes | **Yes** (`Layout/PageShell`) | Listed only | Only via `RoutePage.tsx` (never called directly by page files) | **Fixed (Phase 2B):** verified `noContainer` was fully dead (declared on both `PageShell` and `RoutePage`'s own prop types, but never consumed by `PageShell`'s render logic) and removed it from both — zero behavior change, confirmed via `tsc`/build | Done | P1 |
| FormShell | `layout/FormShell.tsx` | Rounded elevated Paper wrapper | Yes | **Yes** (`Layout/FormShell`) | Listed only | `RoutePage.tsx`; Resume/ResumeCode/ResumeMethod via shared PageShell+PageHeader composition | **Done (Phase 7):** the three resume pages no longer hand-rebuild the surrounding shell/header pattern | Done | P1 |
| PageHeader | `layout/PageHeader.tsx` | Title + subhead + help, used inside RoutePage | Yes | **Yes** (`Layout/PageHeader`) | Listed only | `RoutePage.tsx` only | Thin composition of PageTitle | Done | P1 |
| PageTitle | `layout/PageTitle.tsx` | Title/subhead/back-button primitive | Yes | **Yes** (`Layout/PageTitle`) | Listed only | PageHeader, PageShell, DevTools, and directly by Resume/ResumeCode/ResumeMethod/Receipt/AdvisorLogin | Back button `aria-label="Go back"`; custom `formPageTitle` variant | Done | P1 |
| SectionDivider | `layout/SectionDivider.tsx` | Chip-labeled section divider | Yes | **Yes** (`Layout/SectionDivider`) | Listed only | 4 shared form components + 8 pages | **Fixed (Phase 2B):** the inverted `chipVariant` mapping and the `variant="subsection"` preset's internal value were both corrected — `"filled"` now renders filled, `"outlined"` renders outlined. Verified every real call site uses the `subsection` preset (none pass `chipVariant` directly), so the fix produces **zero visual change** in the running app while making the API correct for future use | Done | P1 |
| ApplicantSectionDivider | `layout/ApplicantSectionDivider.tsx` | Applicant-scoped section header (+ `ApplicantSectionLabel` export) | Yes | **Yes** (`Layout/ApplicantSectionDivider`) | Listed only | 2 shared form components + 8 pages | Client-overridable titles/icons | Done | P1 |
| CategoryHeader | `layout/CategoryHeader.tsx` | Coverage-category heading w/ icon badge | Yes | **Yes** (`Layout/CategoryHeader`) | Listed only | QuoteCalculator, ProductCatalog, CategoryCard | Fixed at `h3` (already fixed for heading-order per CL-022) | Done | P1 |
| CategoryCard | `layout/CategoryCard.tsx` | Card wrapping CategoryHeader + content stack | Yes | **Yes** (`Layout/CategoryCard`) | Listed only | ProductCatalog, Payment, Beneficiary | | Done | P1 |
| ProductCard | `layout/ProductCard.tsx` | Bordered card w/ `selected` state (green border/tint) | Yes | **Yes** (`Layout/ProductCard`) | Listed only (claims "QuoteEstimator" usage — stale name) | EstimatorProductCard, ProductCatalog, QuoteModal, QuoteCalculator, Beneficiary, Payment, Receipt | Selected/unselected state | Done | P1 |
| ClientHelpBanner | `layout/ClientHelpBanner.tsx` | Full-bleed support bar (call/chat/link/schedule) | Yes | **Yes** (`Layout/ClientHelpBanner`) | Listed only | AppHeader only (renders when client has a support phone) | **Done (Phase 2F):** `componentInventory.ts`'s stale "Home page, AppMenu" usage claim corrected to the real "AppHeader" call site, verified via grep | Done | P3 |
| **FormRoutePage** (`RoutePage.tsx`) | `app/RoutePage.tsx` | The de-facto page template (PageShell+FormShell+PageHeader+PageNav+ProgressStep+RHF wiring+autosave) | Yes (de facto) | **Yes** (`Application Patterns/Application Page Template`) | Live composition story | 17 of 30 routed page files | **Done (Phase 6):** documented as the real composed template with standard, transition, and standalone variants. The audit corrected the stale prior counts (18 of 27) against the current router and render sites. | Done | P3 |
| FieldGrid | `layout/FieldGrid.tsx` | Responsive equal, wide+narrow, wide+two-narrow, and custom form rows | Yes | **Yes** (`Layout/FieldGrid`) | No | Membership, Eligibility, Beneficiary, Contact, Profile | **Done (Phase 7):** replaces every flagged duplicate and fixes Profile's height rows to collapse below `sm` | Done | P3 |
| IconListItem | `layout/IconListItem.tsx` | Two-column list row with leading icon/ordinal | Yes | **Yes** (via `Application Patterns/YesNoDetailList`) | No | YesNoDetailList | **Done (Phase 7)** | Done | P3 |
| Resume/ResumeCode/ResumeMethod shared shell migration | three resume pages | PageShell+FormShell+PageHeader composition | Yes | **Yes** (component stories + Application Page Template) | No | 3 resume-flow pages | **Done (Phase 7):** all three pages now use the shared composition while preserving their route-specific forms | Done | P3 |

---

## 2. Forms

`FieldRenderer.tsx` (`components/forms/FieldRenderer.tsx`) is the central dispatcher and the single highest-value Storybook target in the app. **Done (Phase 2B):** `Forms/FieldRenderer` now has 26 stories — a controls-driven `Playground` plus one named story per supported input pattern below, 4 forced-error states, a genuinely new `Disabled` state (not shown anywhere in the app's own docs before), and the `?inputChecks` completion-icon debug mode exposed as a toggle for the first time.

| Field type | Source signal | Usage count | Story? | Notes | Action | Priority |
|---|---|---|---|---|---|---|
| text | `inputType: "text"` | 91 | Yes | | Done | P2 |
| number | `inputType: "number"` | 16 | Yes | digit-only sanitization | Done | P2 |
| date | `inputType: "date"` | 8 | Yes | masked MM/DD/YYYY | Done | P2 |
| radio | `inputType: "radio"` | 33 | Yes | custom `role="radiogroup"`/`SelectionGroup` rows, not native `RadioGroup` — same pattern duplicated inline elsewhere (see below) | Done | P2 |
| dropdown | `inputType: "dropdown"` | 11 | Yes | | Done | P2 |
| searchable-select | explicit + auto-promoted at ≥10 options | 9 explicit | Yes | Auto-promotion threshold (`SEARCHABLE_SELECT_OPTION_THRESHOLD=10`) noted in the story | Done | P2 |
| checkbox | `inputType: "checkbox"` | 7 | Yes | required-checkbox validation | Done | P2 |
| checkbox-group | `inputType: "checkbox-group"` | 1 | Yes | `role="group"` | Done | P2 |
| multi-select | `inputType: "multi-select"` | 2 | Yes | native `Select multiple` w/ checkboxed items | Done | P2 |
| percent | `format: "percent"` | 1 | Yes | max 3 digits | Done | P2 |
| currency | `format: "currency"` or hardcoded id list | 22 + 3 hardcoded ids | Yes | `$12,345` formatting, 12-digit cap | Done | P2 |
| email | `format: "email"` | 6 | Yes | | Done | P2 |
| phone | `format: "phone"` | 6 | Yes (both with and without the type selector) | companion phone-type `Select` adornment, toggle via `showPhoneTypeSelector` | Done | P2 |
| ssn | `format: "ssn"` | 2 | Yes | most complex field type: digit-reveal mask, paste/delete handling, Privacy Notice helper text dispatching `app:open-privacy-notice` | Done | P2 |
| month-year | `format: "month-year"` | **0 current uses** | Yes | fully implemented, dead in production data — story keeps the code path covered and says so | Done | P2 |
| zip/postal | id/`autoComplete` heuristic on top of `text` | many | Not separately storied (covered by the `text` story) | ≥5-char rule; **still reimplemented inline in `Eligibility.tsx:375-400`** instead of reusing FieldRenderer's logic — not fixed this phase | Fix-then-document | P2 |
| Completion-icon adornments | `inputChecksEnabled()` gated by `?inputChecks` URL param | n/a | Yes — `Completion icons (debug — ?inputChecks)` story | First place this hidden/debug feature is documented at all | Done | P2 |

| Component | Source | Purpose | Reusable? | Story? | In DesignSystem.tsx? | Used in | Notes | Action | Priority |
|---|---|---|---|---|---|---|---|---|---|
| ConditionalGroup | `forms/ConditionalGroup.tsx` | Left-border indent wrapper for conditional follow-ups | Yes | **Yes** (`Forms/ConditionalGroup`) | Listed only | CoverageQuestions, Profile, Eligibility | The component adds no live-region/announcement of its own — that's still the parent's job. Numbered health-question reveals now use the distinct `YesNoDetailList` pattern. | Done | P1 |
| DynamicList / DynamicListItem | `forms/DynamicList.tsx`, `DynamicListItem.tsx` | Add/edit/remove repeatable-record pattern | Yes | **Yes** (`Forms/DynamicList` — Empty/Populated/Maximum-items/Grid-fields; `Forms/DynamicListItem` — Default/no-label/long-content) | Live demo | Eligibility, Profile, HealthSi/Li/Di | All state transitions (add, edit-prefill, remove-confirm, max-reached) are real interactions in the stories, not screenshots | Done | P1 |
| SelectionGroup | `forms/SelectionGroup.tsx` | Bordered clickable option row underlying radio/checkbox/icon-toggle | Yes | **Yes** (`Forms/SelectionGroup`) | Listed only | FieldRenderer + widely across coverage/resume components | Both selected-state mechanisms (`data-checked` attr vs. CSS `:has(:checked)`) shown separately; `:focus-visible` outline has its own story. No `disabled` prop exists on the component — not fabricated for the story | Done | P1 |
| EligibilityFields | `forms/EligibilityFields.tsx` | Shared DOB/ZIP/State trio w/ ZIP→State auto-derivation | Yes | **Yes** (`Coverage & Commerce/EligibilityFields`) | Listed only | QuoteCalculator, Home page | **Done (Phase 2E):** Default/ZIP-auto-derives-State/required-errors/age-ineligible. The deferred `attempted`-gated error display (vs. FieldRenderer's always-on RHF errors) is called out explicitly in the story | Done | P2 |
| PhysicianInformation | `forms/PhysicianInformation.tsx` | Row-arrangement helper for physician contact fields | Yes | **Yes** (`Coverage & Commerce/PhysicianInformation`) | Listed only | Profile page | **Done (Phase 2E):** uses the real `profilePersonalSelfPhysician` page-section config and real field IDs, verified via a temporary smoke test (not committed) that every referenced field ID actually resolves before writing the story | Done | P2 |
| CoverageQuestions | `forms/CoverageQuestions.tsx` | Orchestrates category-driven question sections | Yes | **Yes** (`Coverage & Commerce/CoverageQuestions`) | Listed only | Coverage page | **Done (Phase 2E):** 4 stories (no-category/LI/DI/with-spouse) driven by the real `getPageSections("coverage")` + `getClientPageFields` config through a real `react-hook-form` context — verified via a temporary smoke test that real sections/fields actually resolve for each category before shipping the story, so none of them silently render empty | Done | P6 |
| `field-types.ts` vs `types.ts` | `config/fields/field-types.ts`, `config/fields/types.ts` | Field-config type definitions | — | — | — | — | **Near-byte-duplicate files**; `types.ts` has one extra `FieldId` literal `types.ts` lacks in `field-types.ts` — likely dead file drift | Verify-then-document (confirm which is live before writing type docs referencing it) | P2 |
| RadioSelectionGroup | `forms/RadioSelectionGroup.tsx` | Accessible native-radio group using SelectionGroup rows | Yes | **Yes** (`Forms/RadioSelectionGroup`) | No | Beneficiary, ResumeMethod | **Done (Phase 7):** removes the two page-local implementations; FieldRenderer retains its RHF-controlled branch | Done | P2 |
| Beneficiary bare checkbox row | `Beneficiary.tsx:1242` | "Apply to other applicants' products" — plain `Checkbox`+`Typography`, not `SelectionGroup` | No | No | No | Beneficiary page | Visually inconsistent with every other checkbox in the app | Fix-then-document | P7 |

---

## 3. Navigation

| Component | Source | Purpose | Reusable? | Story? | In DesignSystem.tsx? | Used in | Notes | Action | Priority |
|---|---|---|---|---|---|---|---|---|---|
| PageNav | `navigation/PageNav.tsx` | Next/Submit button w/ loading state | Yes | **Yes** (`Navigation/PageNav`) | Listed only | Every `RoutePage`-based page | **Done (Phase 2C):** Default/CustomLabel/Transitioning/Disabled stories, wrapped in a real `<form>` since the button targets its form via the `form` attribute, not DOM nesting | Done | P4 |
| ProgressStep / VerticalStepperBreadcrumbs | `navigation/ProgressStep.tsx` | Desktop sticky-sidebar stepper vs. mobile accordion `Stepper`, plus breadcrumb variant | Yes | **Yes** (`Navigation/ProgressStep`) | Listed only | Every `RoutePage`-based page (conditionally) | **Done (Phase 2C):** 7 stories covering collapsed steps (no coverage selected), the Health-consolidated breadcrumb with real dummy data from `generateFormDataUpToPage`, the mobile accordion layout (via the same `forceMobileLayout` theme technique as `Foundations/Breakpoints`, not the viewport addon), both post-review and advisor-handoff lock states, and `VerticalStepperBreadcrumbs` standalone. `ApplicationFormContext` (the context object, not just the `useApplicationForm` hook) is now exported so stories can supply fixed demo values without going through the real sessionStorage-backed provider | Done | P4 |
| `progressSteps.ts` config | `config/progressSteps.ts` | 5-step model, dynamically filters out fully-skipped steps | — | — | — | — | **Done (Phase 2C):** the data-driven step-collapsing case is covered by `ProgressStep`'s own "collapsed steps" story rather than a separate config-only story | Done | P4 |
| AppMenu | `layout/AppMenu.tsx` | (cross-ref §1) also functions as primary nav drawer | Yes | Partial | Live demo | AppHeader | See §1 | Enhance | P4 |

---

## 4. Content

| Component | Source | Purpose | Reusable? | Story? | In DesignSystem.tsx? | Used in | Notes | Action | Priority |
|---|---|---|---|---|---|---|---|---|---|
| ApplicationDocumentPreview | `content/ApplicationDocumentPreview.tsx` | Paginated print-style application review w/ per-section edit + e-sign block | Yes | **Yes** (`Content/ApplicationDocumentPreview`) | Listed only | Review page only | **Done (Phase 2F):** Default/hideSignature/onEditSection, using real dummy data from `generateFormDataUpToPage("review")` rather than hand-typed values | Done | P7 |
| HelpChips (`FormHelpChips`) | `content/HelpChips.tsx` | Scrollable row of contextual-help chips | Yes | **Yes** (`Content/HelpChips`) | Listed only | 6 pages — **most broadly reused component in the audit** | Mobile-only overflow-fade demonstrated in a narrow-container story; hidden-scrollbar a11y note kept as a flagged, unfixed issue in its own story | Done | P1 |
| LegalDocList | `content/LegalDocList.tsx` | Generic legal-document-body renderer | Yes | **Yes** (`Content/LegalDocList`) | Listed only | AppFooter's Terms of Use / Privacy Notice modals — **verified** via `<LegalDocList doc=...>` call sites in `AppFooter.tsx`, not assumed | **Done (Phase 2F):** Terms-of-Use/Privacy-Notice stories using the real client content, not placeholder text | Done | P4 |
| QuickDecisionExplainer (+ `QuickDecisionMark`/`QuickDecisionMarkStyled`/`QuickDecisionMarkPlain`/`InlineDrawerLink`) | `content/QuickDecisionExplainer.tsx` | Full QD explainer body + reusable inline mark/link primitives | Yes | **Yes** (`Content/QuickDecision`) | Listed only | HowApplyingWorksPanel (drawer chrome), QuickDecisionInfoBox (inline-expand chrome) | **Done (Phase 2F):** documented as a single combined page with `QuickDecisionInfoBox` and `QuickDecisionIndicator`, per this row's own recommendation — not 3 separate story files | Done | P6 |
| QuickDecisionInfoBox | `content/QuickDecisionInfoBox.tsx` | Collapsible banner wrapping QuickDecisionExplainer's content inline | Yes | **Yes** (`Content/QuickDecision`) | Listed only | ProductCatalog, CoverageOptionsPanel — **verified** via grep, not assumed | **Done (Phase 2F):** see combined page above; `aria-controls`/`aria-expanded` wiring is exercised live (click "Show more") | Done | P6 |
| QuickDecisionIndicator | `ui/QuickDecisionIndicator.tsx` | Bare icon-only QD badge (no text) | Yes | **Yes** (`Coverage & Commerce/Product Adornments`) | Listed only | 4 files | **Done (Phase 2F):** the visual inconsistency vs. the text+icon `QuickDecisionMark` family is stated directly in the combined `Product Adornments` page (grouped with `FeaturedBadge`, per this row's own recommendation) — flagged, not fixed, since there's no bug to fix, only an inconsistency to know about | Done | P6 |

---

## 5. Feedback

| Component | Source | Purpose | Reusable? | Story? | In DesignSystem.tsx? | Used in | Notes | Action | Priority |
|---|---|---|---|---|---|---|---|---|---|
| AppSnackbar | `feedback/AppSnackbar.tsx` | Base snackbar, severity→role mapping (alert vs. status) | Yes | **Yes** (`Feedback/AppSnackbar`) | Listed only | ProgressSavedSnackbar, Coverage page | Bottom on mobile, top-center on desktop; ProgressSavedSnackbar preset documented in the same file | Done | P1 |
| EmptyState | `feedback/EmptyState.tsx` | Icon+title+body placeholder | Yes | **Yes** (`Feedback/EmptyState`) | Listed only | CoverageCart, QuoteCalculator, error states | No live-region (correct — static content) | Done | P1 |
| LoadingOverlay | `feedback/LoadingOverlay.tsx` | 4 sizes incl. `fullscreen`, status live-region | Yes | **Yes** (`Feedback/LoadingOverlay`) | Listed only | Page transitions, async actions | All 4 sizes shown; richer spinner+mark+heading+body states use `ProcessingStatusPage` | Done | P1 |
| PageAlert | `feedback/PageAlert.tsx` | Canonical full-width contextual alert | Yes | **Yes** (`Feedback/PageAlert`) | Listed only | PageShell error/info | Severity→role mapping; supersedes PageErrorAlert; all 4 severities plus dismissible and no-message states shown | Done | P1 |
| PageErrorAlert | `feedback/PageErrorAlert.tsx` | Deprecated 5-line re-export of PageAlert | No (shim) | No | Noted in PageAlert's description | Legacy imports only | Should not get its own story | Retire | P5 |
| PageTransitionSkeleton | `feedback/PageTransitionSkeleton.tsx` | Route-transition placeholder, 3 skeleton bars | Yes | **Yes** (`Feedback/PageTransitionSkeleton`) | Listed only | RoutePage transition state | `aria-hidden` on visible bars, `aria-label` carries the announcement | Done | P1 |
| ProgressSavedSnackbar | `feedback/ProgressSavedSnackbar.tsx` | Preset "Progress saved" success snackbar | Yes | **Yes** (story inside `Feedback/AppSnackbar`) | Listed only | RoutePage (global) | Thin preset over AppSnackbar | Done | P5 |
| Inline `Alert` bypassing PageAlert | `RoutePage.tsx:593`, `Beneficiary.tsx` (×6), `Membership.tsx` (×4), `Payment.tsx` (×2), `Review.tsx` (×3), `Profile.tsx`, `Receipt.tsx`, `Resume.tsx`, `ResumeCode.tsx`, `AdvisorSendConfirmation.tsx`, `ApplicationEditConfirmation.tsx` | Raw `Alert` used directly instead of the shared `PageAlert` | No | No | No | ~13 pages, ~20+ occurrences | The majority of real in-app alerts bypass the sanctioned shared component — worth a design-system-adoption pass, not just a story | Fix-then-document (at minimum document as the "known deviation," ideally migrate) | P5 |
| ProcessingStatusPage | `feedback/ProcessingStatusPage.tsx` | Spinner+mark+heading+body processing surface | Yes | **Yes** (`Feedback/ProcessingStatusPage`) | No | DocuSign, HealthQd | **Done (Phase 7)** | Done | P5 |
| useCountdown + ExpiringCodeAlert + ResendCountdownRow | `hooks/useCountdown.ts`, `feedback/*` | Restartable countdown and canonical active/expired/resend UI | Yes | **Yes** (`Feedback/Resume Expiration`) | No | Resume, ResumeCode | **Done (Phase 7)** | Done | P5 |
| DetailsTable | `layout/DetailsTable.tsx` | Accessible label/value confirmation table | Yes | **Yes** (`Application Patterns/DetailsTable`) | No | AdvisorSendConfirmation, ApplicationEditConfirmation | **Done (Phase 7)** | Done | P5 |

**Done (Phase 2B):** `Guidelines/Dynamic Feedback & Status` migrated `DesignSystem.tsx`'s "Design rules → Alerts" `alertRules` matrix (the last outstanding Phase 2A deferral), documented the polite-vs-assertive live-region mapping shared by every feedback component above, and re-stated the ~13-page inline-`Alert` deviation and the `ProcessingStatusPage` extraction candidate as guidance rather than raw audit notes.

---

## 6. Overlays

| Component | Category | Source | Responsive behavior | Used in | Notes | Action | Priority |
|---|---|---|---|---|---|---|---|---|
| AppDrawer | Adaptive drawer | `layout/AppDrawer.tsx` | Right-panel desktop / bottom-sheet mobile; `swipeable` opt-in | AppHeader cart (only consumer passing `swipeable`), AppMenu's 4 sub-drawers, page-level drawers on Beneficiary/Home/HealthDi/Payment/Membership/HealthSi/Coverage | **Done (Phase 2D):** `Overlays/AppDrawer` — Default (desktop), Mobile bottom sheet, Swipeable, and No-title/ariaLabel-only stories; the inconsistent-adoption gap (swipeable is only used by the cart) is stated as a fact in the story description, not fixed | Done | P6 |
| AppModal | Dialog/Modal | `layout/AppModal.tsx` | `fullScreen` below `md`; numeric `maxWidth`; `role: dialog\|alertdialog` | ConfirmationDialog, SendApplicationDialog, AppFooter legal modals, CoverageCart, DynamicList, Beneficiary/PortalAdmin/MockEmailPreview | **Done (Phase 2D):** `Overlays/AppModal` — Default, single-action, two-actions/alertdialog, `showCloseIcon={false}`, and `forceFullScreen` stories | Done | P6 |
| ConfirmationDialog | Alert dialog | `layout/ConfirmationDialog.tsx` | Inherits AppModal | Review, Coverage | **Done (Phase 2D):** `Overlays/ConfirmationDialog` — Default, `confirmColor="error"`, and custom-labels stories | Done | P6 |
| CookieDialog | Fixed banner (not a true Dialog) | `layout/CookieDialog.tsx` | Fixed position, no backdrop/focus-trap | AppShell (global, gated on `localStorage.cookieConsent`) | **Done (Phase 2D):** `Overlays/CookieDialog` — the naming clarification (fixed banner, not a true Dialog) is stated directly in the story's own description rather than left implicit | Done | P6 |
| QuoteModal | Modal | `layout/QuoteModal.tsx` | 2-col sticky-summary layout | **Resolved (Phase 2D):** confirmed dead code by the team — kept in the repo, not given a story. `componentInventory.ts`'s `usedIn` claim corrected from "Coverage page, AppHeader" to reflect the confirmed-dead status, and its false `AppDrawer`/`EstimatorProductCard` cross-references were reviewed (`AppDrawer`'s `usedIn` no longer lists QuoteModal) | Retire (docs only — file not deleted) | P6 |
| SendApplicationDialog | Alert dialog | `layout/SendApplicationDialog.tsx` | Inherits AppModal | Profile, Review (advisor↔applicant handoff) | **Done (Phase 2D):** `Overlays/SendApplicationDialog` — to-applicant (with name), to-advisor (`showRecipientName=false`), and missing-recipient-data (em-dash fallback) stories; also added to `componentInventory.ts`, which was missing this row entirely before now | Done | P6 |

---

## 7. Coverage & Commerce

| Component | Source | Purpose | Used in | Notes | Action | Priority |
|---|---|---|---|---|---|---|
| ProductCatalog | `forms/ProductCatalog.tsx` | Main coverage-shopping surface (category sections → product cards → inline cart) | Coverage page | **Done (Phase 2E):** `Coverage & Commerce/ProductCatalog` — drives the real `useCoverageState()` hook inside an isolated `ApplicationFormContext`, not fabricated props; select a category → reveal products → the real ~2s loading delay → real client pricing. Exercises the inline `CoverageCart` variant for free once a product is added | Done | P6 |
| CoverageCategorySelector | `forms/CoverageCategorySelector.tsx` | Multi-select category checklist | Coverage, QuoteCalculator | **Done (Phase 2E):** `Coverage & Commerce/CoverageCategorySelector` — Default/none-selected/required-error/custom-legend | Done | P6 |
| CoverageNeedsCalculator | `forms/CoverageNeedsCalculator.tsx` | Income-replacement needs calculator | AppMenu drawer only | **Done (Phase 2E):** `Coverage & Commerce/CoverageNeedsCalculator` | Done | P6 |
| QuoteCalculator | `forms/QuoteCalculator.tsx` | Drawer quote tool, category→questions→estimate→apply | Home, Membership | **Done (Phase 2E):** `Coverage & Commerce/QuoteCalculator` — 3 stories (`collectEligibility` on/off, custom title). Fully self-contained (no `useApplicationForm`/`useCoverageState` dependency, unlike ProductCatalog), so no context wrapper was needed. `componentInventory.ts`'s stale "AppMenu drawer" usage claim corrected to the real Home/Membership call sites | Done | P6 |
| EstimatorProductCard | `forms/EstimatorProductCard.tsx` | Simplified member-only product card (no riders/waiting periods) | QuoteCalculator | **Done (Phase 2E):** `Coverage & Commerce/EstimatorProductCard` — Unselected/Selected/Featured/QD/Calculating | Done | P6 |
| CoverageCart | `ui/CoverageCart.tsx` | Selected-coverage summary, `drawer` and `inline` variants | AppHeader (drawer), ProductCatalog (inline) | **Done (Phase 2E):** `Coverage & Commerce/CoverageCart` covers the `drawer` variant (Empty/Populated, seeded with real coverage IDs and the `coverageId:applicantId` composite key format its amount lookup actually uses); the `inline` variant is exercised live inside `ProductCatalog`'s own story instead of duplicated here | Done | P6 |
| CoverageOptionsPanel | `ui/CoverageOptionsPanel.tsx` | "About Coverage" browser, `page`/`drawer` variants | Home (page), AppMenu (drawer) | **Fixed and done (Phase 2E):** the placeholder `href="#"` product link (a real, verified no-op — its `onClick` only called `preventDefault()`) was replaced with plain non-interactive text, since there's no real product-detail destination for it to point to. `Coverage & Commerce/CoverageOptionsPanel` — page/drawer/initialCategory | Done | P6 |
| CoveragePortfolioDrawer | `ui/CoveragePortfolioDrawer.tsx` | Read-only existing-coverage drawer (dummy TPA data) | Coverage page (TPA-verified users only) | **Done (Phase 2E):** added to `componentInventory.ts` (previously missing entirely) and `Coverage & Commerce/CoveragePortfolioDrawer` — member-only/with-spouse | Done | P6 |
| ProductCostBreakdown | `ui/ProductCostBreakdown.tsx` | Premium+riders+fee line-item breakdown | ProductCatalog (client-config gated) | **Done (Phase 2E):** `Coverage & Commerce/ProductCostBreakdown` — monthly/annual/no-riders/multiple-riders. `componentInventory.ts`'s stale "CoverageCart" usage claim corrected to ProductCatalog (the real, audited call site) | Done | P6 |
| TotalCostSummary | `ui/TotalCostSummary.tsx` | Shared "Total Estimated Cost" panel | CoverageCart, QuoteCalculator | **Done (Phase 2E):** `Coverage & Commerce/TotalCostSummary` — default/annual-suffix/calculating/disclaimer/single-item | Done | P6 |
| FeaturedBadge | `ui/FeaturedBadge.tsx` | "Featured" chip | ProductCatalog, EstimatorProductCard | **Done (Phase 2E):** documented together with `QuickDecisionIndicator` in one `Coverage & Commerce/Product Adornments` page per the Phase 1 recommendation, not as a standalone story — the point of that page is to show their visual inconsistency side by side | Done | P6 |
| RateFrequencyToggle / RateFrequencyControl | `ui/RateFrequencyToggle.tsx`, `ui/RateFrequencyControl.tsx` | Primitive Switch plus canonical labeled Monthly/Annual row | QuoteCalculator, CoverageCart | **Done (Phase 7):** both call sites now use `RateFrequencyControl`; its live story owns the complete row | Done | P6 |
| MemberVerification | `ui/MemberVerification.tsx` | Multi-step identity-verification modal (dummy TPA match) | Eligibility page | **Done (Phase 2E):** added to `componentInventory.ts` (previously missing entirely) and `Coverage & Commerce/MemberVerification` — one fully interactive story covering all 4 method branches (text/voice/security-questions/skip) | Done | P6 |
| HowApplyingWorksPanel | `ui/HowApplyingWorksPanel.tsx` | Step explainer, `page`/`drawer` variants | Home (page), AppMenu (drawer) | **Done (Phase 2E):** `Coverage & Commerce/HowApplyingWorksPanel` — page/drawer (drawer variant's nested sub-drawers are live). Decorative step-number `aria-hidden` gap restated as a known, unfixed issue in the story itself, per this component's "Document" (not "Fix-then-document") action | Done | P6 |
| `config/coverages`, `coverageCategories.ts`, `coverageConstants.ts` | — | Data shapes for products/categories/shared question logic | Consumed throughout | Document as reference tables, not components | Document | P6 |

---

## 8. Interactive & Application-Level Patterns (cross-cutting)

| Pattern | Evidence | Recommendation | Action | Priority |
|---|---|---|---|---|
| Show more/less | `InformationArchitecture.tsx:4298-4326` (`TruncatedString`) | Single real occurrence; MUI `Accordion` covers the rest | Pattern-only | P7 |
| Add/edit/remove reinvented | `Beneficiary.tsx` (own modal, own upsert, **no remove-confirmation** unlike `DynamicList`) | Beneficiary reuses `DynamicListItem` cards and the focus-return convention, but not the modal/confirm machinery — half-componentized | Fix-then-document (add missing remove-confirm at minimum) | P7 |
| YesNoDetailList | `forms/YesNoDetailList.tsx` | Numbered yes/no rows revealing DynamicList details | **Done (Phase 7):** HealthLi/HealthDi/HealthSi share the canonical component and `IconListItem` layout | Done | P7 |
| Selectable cards | `CategoryCard`/`SelectionGroup` used consistently everywhere checked | Positive control — no inline reinvention found | Document as the reference pattern | P1 |
| Search/filter | `InformationArchitecture.tsx` — 3 independent `.toLowerCase().includes()` filters (pages/fields/config search) | Internal doc-tool only, low priority; extract `useTextFilter` if touched again | Componentize (low priority) | P7 |
| Editable-in-place | None found | N/A | — | — |
| Save/resume countdown | `hooks/useCountdown.ts` + resume feedback components | **Done (Phase 7):** shared by Resume and ResumeCode | Done | P5/P7 |
| Empty states | No inline reinventions found | Positive control | — | P1 |
| Loading states | `ProcessingStatusPage` for rich status; `LoadingOverlay` for blocking overlays | **Done (Phase 7)** | Done | P5 |
| `scrollToFirstError` duplicated + incomplete | `RoutePage.tsx:403-411` (shared) vs. `Coverage.tsx:333-344` (re-implemented inline, drops the `window.scrollTo` fallback) | **Neither implementation actually calls `.focus()`** on the error field — only `scrollIntoView`. If "move focus to first error" is a stated a11y requirement (it's referenced in `ProjectOverview.stories.tsx`'s site-rules table), this is a real gap in both places, not just a duplication issue | Fix-then-document | P5 |

---

## 9. States (cross-cutting — document via Storybook controls/variants, not a separate catalog)

Components most in need of an explicit state matrix in their stories: `FieldRenderer` (per field type: default/filled/error/disabled — disabled is not demonstrated anywhere today), `SelectionGroup` (default/hover/focus-visible/selected/disabled), `PageAlert`/`AppSnackbar` (all 4 severities × dismissible), `DynamicList`/`DynamicListItem` (empty/add/edit/max-reached/remove-confirm), `CoverageCart` (empty/loading/populated/ineligible-warning, both variants), `ProductCatalog` product cards (loading/ineligible/warning/$0-amount/calculating), Button (the theme override's hover-lift/disabled/loading states aren't shown anywhere — DesignSystem.tsx has no disabled or loading button examples at all).

## 10. Accessibility (cross-cutting — document via a11y addon + explicit notes, not a separate catalog)

**Established, consistent conventions** (document these as "the pattern," reuse across stories): icon-only buttons always get `aria-label`; custom radio/checkbox rows pair `role`+`aria-checked`+roving `tabIndex`+Space/Enter handling; dynamic/calculating regions use `role="status"`+`aria-live`; focus is deliberately returned after destructive actions (DynamicList, Beneficiary); severity-to-live-region-role mapping (`alert` for error/warning, `status` for info/success) is shared between AppSnackbar and PageAlert.

**Confirmed gaps to flag (not fix during this audit phase):**
- Standard-label `Select` variant in FieldRenderer has no `aria-labelledby` wired between the external `FormLabel` and the `Select`.
- `HelpChips`' hidden scrollbar may remove the only visible affordance that its chip row scrolls horizontally.
- `CoverageOptionsPanel`'s product name is a non-functional `href="#"` link.
- Neither `scrollToFirstError` implementation calls `.focus()` (see §8).
- Beneficiary's remove action has no confirmation step and needs verification that it's announced to assistive tech the way `DynamicList`'s equivalent path is.
- `HowApplyingWorksPanel`'s decorative step-number boxes aren't `aria-hidden`.

---

## Cross-check against `src/content/docs/componentInventory.ts`

This TypeScript file (not a markdown doc) drives the live "Component library" section on `DesignSystem.tsx` and is **largely accurate** — unlike the markdown docs in `src/docs/`, its file paths match real source. Confirmed issues to fix in Phase 2 (not fixed in this audit pass, since it's a content file, not this document):
- Missing rows entirely: `SendApplicationDialog`, `CoveragePortfolioDrawer`, `MemberVerification`.
- `QuoteModal`'s `usedIn` field claims "Coverage page, AppHeader" — contradicted by a repo-wide grep finding zero render sites outside a documentation demo. Needs verification before the claim is trusted or repeated elsewhere.
- **Updated (Phase 2B):** the first 20 component Storybook IDs were verified against an actual Storybook build rather than guessed.
- **Updated (Phase 2C and Netlify readiness):** `PageNav`, `ProgressStep`, and the named `ProgressSavedSnackbar` story were verified. The live inventory now stores only verified `storybookId` selections, omits unavailable stories, and resolves links through `src/config/storybook.ts` so separate local and Netlify origins work consistently.
- **Updated (Phase 2D):** 5 Overlays components (`AppDrawer`, `AppModal`, `ConfirmationDialog`, `CookieDialog`) corrected, plus `SendApplicationDialog` added as a brand-new row (previously missing entirely). `QuoteModal`'s `usedIn` claim resolved per the team's dead-code decision — changed from the unconfirmed "Coverage page, AppHeader" to state plainly that it isn't rendered anywhere; `AppDrawer`'s `usedIn` had the incorrect `QuoteModal` cross-reference removed.
- **Updated (Phase 2E):** the entire Coverage & Commerce cluster (15 components: `ProductCatalog`, `CoverageCategorySelector`, `CoverageNeedsCalculator`, `QuoteCalculator`, `EstimatorProductCard`, `CoverageCart`, `CoverageOptionsPanel`, `ProductCostBreakdown`, `TotalCostSummary`, `FeaturedBadge`+`QuickDecisionIndicator` together, `RateFrequencyToggle`, `HowApplyingWorksPanel`) plus 3 Forms-category components tied to it (`EligibilityFields`, `PhysicianInformation`, `CoverageQuestions`) now have real stories. `CoveragePortfolioDrawer` and `MemberVerification` added as brand-new rows (previously missing entirely, per the Phase 1 audit's flagged gap). Three stale `usedIn` claims were corrected against real grep/source evidence, not just assumed: `QuoteCalculator` ("AppMenu drawer" → the real "Home page, Membership page"), `ProductCostBreakdown` ("CoverageCart" → the real "ProductCatalog"), and `EstimatorProductCard`/`AppModal`/`AppDrawer` had their now-dead `QuoteModal` cross-references removed.
- **Updated (Phase 2F):** the remaining 4 Content-section components (`ApplicationDocumentPreview`, `LegalDocList`, `QuickDecisionExplainer`, `QuickDecisionInfoBox`) and the entire Layout "App shell" cluster (`AppBody`, `AppFooter`, `AppHeader`, `AppMenu`, `AppShell`, `ClientHelpBanner`) now have real stories — 56 of 57 rows now have verified Storybook IDs; only the intentionally-unstoried `QuoteModal` remains unavailable, by design, per the Phase 2D team decision. `ClientHelpBanner`'s stale "Home page, AppMenu" usage claim was corrected to the real "AppHeader" call site (verified via grep — `ClientHelpBanner` is not actually rendered from either of the two places it claimed). `AppHeader`'s and `AppShell`'s stories drive real page-position state (progress bar %, cart badge count) via `window.history.pushState()`, since both determine their current page from `window.location.pathname` through a custom history-patched subscription rather than react-router's `useLocation()` — confirmed with a temporary, not-committed smoke test that this technique actually surfaces the real progress bar and cart badge before relying on it in the final stories.

## Cross-check against `src/docs/Site_Components_Inventory_Tier1/2/3-6.md`

These three files are a **prescriptive, still-Draft requirements exercise**, not a current-state reference. They use path conventions that never existed in this codebase (`src/layout/`, `src/navigation/`, `src/overlays/`, `src/ui/ECart`) and name components that don't exist under those names. Tier 3-6 partially self-corrects Tier 1/2 but is itself out of date on at least one point (`PageErrorAlert`/`PageAlert` split). **Recommendation: leave these three files in place as historical/spec artifacts (do not delete — they may still hold intent worth mining later), but do not use them as a source of truth for Storybook work.** This document and `StorybookAudit.md` supersede them for that purpose.

## Cross-check against `src/docs/pageflows.md`

A business-flow narrative (page inventory + ID'd requirements), largely accurate at the flow-sequence level but explicitly marks several items "not yet represented" or "Needs Confirmation." Out of scope for component documentation; not touched by this audit.

## Cross-check against `src/docs/RefactorPlan.md`

Its target folder structure (`common/`, `overlays/`, `content/`, `feedback/` as separate top-level folders) has **partially diverged from what actually happened** — there is no `common/` folder, overlay components live inside `layout/` rather than a separate `overlays/` folder, and a `ui/` folder was introduced that the plan never anticipated. Its Storybook section outline was the starting point for this audit's proposed hierarchy in `StorybookAudit.md` but has been revised to match the real category boundaries (Overlays as a Storybook IA concern even though the source folder is `layout/`).
