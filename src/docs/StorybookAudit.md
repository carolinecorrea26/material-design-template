# Storybook Audit & Implementation Plan

> Historical migration record. Storybook is now the visual source of truth,
> and the current `src/pages/DesignSystem.tsx` is a focused Storybook entry
> point and theme-preview tool. Statements below describing the former long-form
> page are retained as implementation history.

Date: 2026-09-04 (Phase 1); updated 2026-09-08 (Phase 2A); updated 2026-09-08 (Phase 2B); updated 2026-09-14 (Phase 2C); updated 2026-09-14 (Phase 2D); updated 2026-09-14 (Phase 2E); updated 2026-09-14 (Phase 2F); updated 2026-09-18 (Phases 6–7)
Status: Phases 1–7 complete. Phase 6 (page-by-page coverage audit + Application Page Template) is recorded in §16; Phase 7 cleanup is recorded in §17. **Every live component in `componentInventory.ts` has a real Storybook story; only `QuoteModal` is intentionally excluded as confirmed dead code. Every routed page is mapped to those stories or explicitly classified as page-specific/internal, and all duplicated patterns identified by the audit now have canonical owners.**

## 1. Why this document exists

The prototype's goal (per `RefactorPlan.md`) is to serve as a design/dev-handoff reference, not the production app. Storybook is meant to be the executable catalog of every repeatable visual, structural, interactive, responsive, feedback, and behavioral pattern in it — including patterns that only exist today as inline, repeated page code, not as components.

Today, Storybook contains exactly **one story file** (`src/docs/ProjectOverview.stories.tsx`) out of ~70 component files and ~30 page files. The real "documentation system" the team has been building lives instead inside the running app itself: `DesignSystem.tsx` (1766 lines), `InformationArchitecture.tsx`, and a family of TypeScript content files under `src/content/docs/` rendered through `src/components/docs/*`. That in-app system is substantial and mostly accurate — it is not being replaced by this effort, but Storybook needs to become the place where components are shown *in isolation*, with variant/state/responsive/a11y coverage that a single long scrolling page can't practically provide.

## 2. Methodology

Five parallel research passes were run against the current `src/` tree (not against prior documentation) and cross-checked against each other and against `git`/file-existence checks:
1. Foundations (`theme.ts`) + comparison against all existing documentation (`DesignSystem.tsx`, `src/docs/*.md`, `src/content/docs/*.ts`, `src/components/docs/*`).
2. Layout, navigation, and overlay components + a sweep of `src/pages` for inline layout/grid duplication.
3. Forms and feedback components + a sweep of `src/pages` for inline field/alert duplication.
4. Coverage/commerce and content components.
5. A full sweep of all 30 page files for repeated interactive patterns (show/hide, add/edit/remove, confirmation, conditional reveal, selectable cards, search/filter, editable data, save/resume indicators, empty/loading states) plus a repo-wide accessibility-convention scan.

Every claim below is anchored to a file:line reference found by direct reading or grep, not inferred from naming conventions. Where a claim in existing documentation could not be confirmed against real source (e.g. a component usage claim), it is marked **Verify-then-document** rather than repeated as fact.

## 3. Headline findings

1. **The current `src/docs/*.md` files are largely stale or aspirational**, not current-state references. `ComponentInventory.md` tracked a folder migration to `common/`, `overlays/`, `shell/`, `fields/` — none of which exist; the real folders are `content/docs/feedback/forms/layout/navigation/ui/`. `Site_Components_Inventory_Tier1/2/3-6.md` are a still-Draft prescriptive exercise using path conventions that never existed in this repo. Only `pageflows.md` holds up reasonably well, and even it flags several items as speculative.
2. **`src/content/docs/componentInventory.ts` (a TypeScript content file, not markdown) is the most accurate existing inventory** and should be treated as a secondary source of truth alongside this audit — but it's missing 3 real components (`SendApplicationDialog`, `CoveragePortfolioDrawer`, `MemberVerification`) and contains at least one usage claim (`QuoteModal` "used in Coverage page, AppHeader") that a repo-wide grep could not confirm.
3. **`DesignSystem.tsx` already does a lot of the job Storybook should do** — 18 live `FieldRenderer` examples, 4 forced-error examples, a searchable component-inventory table, an icon grid, and a design-rules section. Its gap is breadth of *isolated component* coverage (only 4 components get a live mount: `AppHeader`, `AppMenu`, a mocked `CoverageCartPreview`, and `DynamicList`) and *state* coverage (no disabled buttons, no dark surfaces, no responsive breakpoint demonstration, no loading/error states beyond the 4 forced-error field examples).
4. **A real, not-hypothetical set of duplicated inline implementations exists** and should be componentized before or alongside writing their stories, rather than documented as-is (full list in §6). The strongest candidates: a countdown-timer engine duplicated verbatim between `Resume.tsx` and `ResumeCode.tsx`; a "processing/redirecting" full-page loading screen duplicated between `DocuSign.tsx` and `HealthQd.tsx`; a custom radiogroup-from-`SelectionGroup`-rows pattern built independently 3 times; a `{xs:"1fr", sm:"1fr 1fr"}` responsive field-row grid copy-pasted across 3 pages; and three pages (`Resume`, `ResumeCode`, `ResumeMethod`) hand-rebuilding the exact page shell that `PageShell`+`FormShell`+`PageHeader` already provide.
5. **A handful of small, real bugs/inconsistencies surfaced during the audit** that should be fixed before or while their owning component gets a story, since documenting them as-is would enshrine the bug: `SectionDivider`'s `chipVariant` prop is inverted from its name; `Profile.tsx`'s height-field grid has no mobile breakpoint fallback unlike every other 2-col grid in the app; neither of the app's two `scrollToFirstError` implementations actually calls `.focus()` on the invalid field; `Beneficiary.tsx`'s remove-beneficiary action has no confirmation step, unlike the equivalent `DynamicList` pattern it otherwise mirrors.
6. **One likely-dead component was found**: `src/components/layout/QuoteModal.tsx` (~900 lines) has zero confirmed render sites outside a documentation demo, despite being listed as in-use in `componentInventory.ts`. It appears to duplicate `QuoteCalculator.tsx`. This should be confirmed with the team before Storybook either documents it as live or a decision is made to retire it — documenting a dead component as a real pattern would mislead anyone using Storybook as a build reference.

## 4. Comparison against existing documentation — verdicts

| Source | Verdict | Use going forward |
|---|---|---|
| `src/pages/DesignSystem.tsx` | Substantial, mostly accurate, but breadth-limited (4 live component demos) and state-limited (no disabled/loading/dark-surface examples) | Keep running; treat as the "why/when to use" narrative layer, Storybook as the isolated "what it looks like in every state" layer. Don't duplicate its prose into Storybook — link/reference it instead where practical. |
| `src/docs/ComponentInventory.md` | Fully stale (tracked a completed folder migration to folders that no longer exist) | **Replaced** by the new `ComponentInventory.md` written as part of this audit. |
| `src/docs/Site_Components_Inventory_Tier1.md` / `Tier2.md` | Stale — wrong paths, several named components don't exist under those names | Leave in place as historical artifact; do not use as a Storybook source of truth. |
| `src/docs/Site_Components_Inventory_Tier3-6.md` | Partially self-correcting but itself has at least one stale claim | Same as above. |
| `src/docs/pageflows.md` | Accurate at the flow-sequence level; several items explicitly marked speculative | Out of scope for component Storybook work; still useful for an eventual "Application Patterns" page-flow section. |
| `src/docs/RefactorPlan.md` | Directionally correct, but its target folder structure has partially diverged from what was actually built (no `common/`, overlays merged into `layout/`, a `ui/` folder added that wasn't planned) | Its Storybook outline was the starting point for §7 below, revised to match the real category boundaries. |
| `src/content/docs/componentInventory.ts` | Mostly accurate; 3 missing rows, 1 unconfirmed usage claim, all `storybookLink`s currently dead | Keep as the live in-app source; fix the 3 gaps and the `QuoteModal` claim in Phase 2 once the `QuoteModal` question is resolved. |
| `src/content/docs/changeLog.ts`, `features.ts`, `portalProject.ts`, `templateChanges.ts` | Accurate, actively maintained, some values computed live rather than hardcoded | No action needed; not in scope for Storybook. |

## 5. Full inventory

See `src/docs/ComponentInventory.md` for the complete, item-by-item table (components, foundations, and inline patterns) with source paths, reuse status, existing-documentation status, state/variant/responsive/a11y notes, recommended action, and priority. This document focuses on synthesis, architecture, and sequencing; that document is the reference table to work from during Phase 2.

## 6. Repeated inline patterns that should become reusable components

Ranked by how clear-cut the extraction case is (duplication + independence from business logic + a11y risk if left unfixed):

1. **`useCountdown` hook + `ExpiringCodeAlert`/`ResendCountdownRow`** — `Resume.tsx:43-71` and `ResumeCode.tsx:75-109` independently implement the same `setInterval` decrement-to-zero timer, plus near-identical expired/resend `Alert` UI. Cleanest extraction in the audit.
2. **`ProcessingStatusPage`** (or repurpose `LoadingOverlay`'s existing but currently-unused `fullscreen` variant) — `DocuSign.tsx:9-40` and `HealthQd.tsx:11-42` are near-identical full-page "redirecting…" screens; `Resume.tsx:136-151` has a simpler cousin.
3. **`RadioSelectionGroup`** — the "row of `SelectionGroup` acting as a radio button" pattern is built independently in `FieldRenderer`, `Beneficiary.tsx:964-1000`, and `ResumeMethod.tsx:96-135`.
4. **`FieldRow`/`FieldGrid`** — the `{xs:"1fr", sm:"1fr 1fr"}` and `{xs:"1fr", sm:"2fr 1fr[...]"}` responsive grid blocks are copy-pasted byte-for-byte across `Beneficiary.tsx`, `Eligibility.tsx`, `Membership.tsx`, and (twice) `Contact.tsx`.
5. **`IconListItem`** — the `"auto 1fr"` icon+text bullet-list grid is identical across `HealthSi.tsx`, `HealthLi.tsx`, `HealthDi.tsx`.
6. **`YesNoDetailList`** — the "Yes reveals a `DynamicList` of follow-up detail records" block is built independently (not via `ConditionalGroup`) in `HealthLi.tsx`, `HealthDi.tsx`, `HealthSi.tsx`.
7. **`DetailsTable`** — the label/value confirmation table is duplicated between `AdvisorSendConfirmation.tsx` and `ApplicationEditConfirmation.tsx` (the latter's own comment says "Mirrors AdvisorSendConfirmation").
8. **`RateFrequencyControl`** — the "Monthly [switch] Annual" label wrapper around the already-shared `RateFrequencyToggle` switch is duplicated verbatim in `CoverageCart.tsx:713-746` and `QuoteCalculator.tsx:879-922`.
9. **Fix, don't necessarily extract: the `PageShell`/`FormShell`/`PageHeader` reimplementation in `Resume.tsx`, `ResumeCode.tsx`, `ResumeMethod.tsx`.** No new component is needed — these three pages should just use the existing shared components instead of hand-rebuilding them.
10. **Lower priority / internal-tool only: `useTextFilter`** — three independent `.toLowerCase().includes()` filters inside `InformationArchitecture.tsx` (an internal doc page, not applicant-facing).

Each of these should get a real component (or hook) before its Storybook story is written — writing a story around the *current* duplicated inline code would just document three slightly-different versions of the same thing instead of one canonical pattern.

## 7. Proposed Storybook Information Architecture

Organized by UI purpose and user-facing concern, not by source folder (overlay components physically live under `src/components/layout/`, but are grouped under **Overlays** here; coverage-specific form components live under `src/components/forms/`, but are grouped under **Coverage & Commerce**).

```text
Foundations
  Colors                      (client presets, semantic/reserved colors, custom panel/notice/support groups)
  Typography                  (h1–h6 + all 11 custom form-specific variants)
  Spacing & Layout Grid       (8px unit; breakpoints incl. forceMobileLayout)
  Border Radius & Shadows
  Icons                       (Rounded-vs-not convention, called out as an open question)
  Branding & Client Theming   (per-client logo/hero, reserved-color rule, 4 hardcoded-logo locations flagged)
  Component Overrides         (all 19 theme.components entries, incl. the 9 currently undocumented ones)

Layout
  Application Page Template   (FormRoutePage as a pattern: PageShell+FormShell+PageHeader+PageNav+ProgressStep composition)
  App Shell                   (AppShell variants, AppBody, skip-link)
  Header & Footer              (AppHeader states incl. progress/cart visibility rules, AppFooter, ClientHelpBanner)
  Page Header & Title          (PageHeader, PageTitle, back-navigation)
  Section Dividers             (SectionDivider incl. the inverted chipVariant behavior, ApplicantSectionDivider)
  Category & Product Cards     (CategoryCard, CategoryHeader, ProductCard)
  Field Row / Grid Patterns    (FieldRow after extraction; documents the 2-col / 2fr-1fr / 2fr-1fr-1fr shapes)

Forms
  Field Types                  (one story per FieldRenderer inputType/format — 16 total, incl. the dead month-year path and the searchable-select auto-promotion threshold)
  Field States                 (default / error / disabled / completion-icon debug mode)
  Conditional Reveal            (ConditionalGroup + the extracted YesNoDetailList pattern)
  Dynamic Lists                 (DynamicList/DynamicListItem full state matrix: add/edit/max-reached/remove-confirm/announcement)
  Selection Rows                 (SelectionGroup, RadioSelectionGroup after extraction)
  Eligibility & Physician Field Groups (EligibilityFields, PhysicianInformation)

Navigation
  Page Navigation (Next/Back)   (PageNav)
  Progress Stepper & Breadcrumbs (ProgressStep, VerticalStepperBreadcrumbs, dynamic step-count collapsing)
  Application Menu               (AppMenu)

Content
  Help Chips                     (FormHelpChips — flag scrollbar-visibility a11y note)
  Legal Document Content          (LegalDocList)
  Application Review Preview       (ApplicationDocumentPreview)
  QuickDecision Content            (QuickDecisionExplainer/Mark family + QuickDecisionInfoBox + QuickDecisionIndicator, documented together as one concept across three surfaces)

Feedback
  Alerts & Banners                 (PageAlert, AppSnackbar, severity→role mapping; flag the ~13-page inline-Alert bypass pattern as a known deviation)
  Loading & Skeletons               (LoadingOverlay, PageTransitionSkeleton, ProcessingStatusPage after extraction)
  Save/Resume Feedback               (ProgressSavedSnackbar, useCountdown/ExpiringCodeAlert after extraction)
  Empty States                       (EmptyState)

Overlays
  Dialogs                             (AppModal, ConfirmationDialog, SendApplicationDialog)
  Drawers                             (AppDrawer incl. swipeable vs. non-swipeable adoption gap)
  Cookie Notice                        (CookieDialog — clarify it's a banner, not a Dialog)
  Quote Modal (status: needs verification) (QuoteModal — pending team confirmation on whether it's dead code)

Coverage & Commerce
  Coverage Category Selection          (CoverageCategorySelector)
  Product Catalog                      (ProductCatalog, full/estimator ProductCard comparison with EstimatorProductCard)
  Quote & Needs Tools                  (QuoteCalculator, CoverageNeedsCalculator)
  Coverage Cart                        (CoverageCart drawer/inline variants, badge count)
  Coverage Options & Portfolio          (CoverageOptionsPanel — flag placeholder Link, CoveragePortfolioDrawer)
  Cost Summaries                        (ProductCostBreakdown, TotalCostSummary, RateFrequencyControl after extraction)
  Product Adornments                    (FeaturedBadge, QuickDecisionIndicator)
  Identity Verification                 (MemberVerification)
  How Applying Works                    (HowApplyingWorksPanel page/drawer variants)

Application Patterns
  Beneficiary Add/Edit/Remove (status: needs fix) (documents the pattern once it's reconciled with DynamicList's confirm/announce behavior)
  Confirmation & Handoff Flows          (ConfirmationDialog/SendApplicationDialog usage in Review/Profile/Coverage)
  Details Confirmation Tables            (DetailsTable after extraction)
  Page Flow Overview                     (cross-reference to pageflows.md rather than duplicating it)
```

Rationale for deviations from `RefactorPlan.md`'s original outline: **Overlays** is kept as its own top-level Storybook section even though the files live inside `components/layout/`, because from a "what pattern am I looking for" standpoint a developer thinks in terms of dialog/drawer/modal, not folder location. **Coverage & Commerce** is elevated to a top-level section (it wasn't in the original plan at all) because it's the single largest, most business-specific, most state-rich cluster in the app and burying it inside "Forms" or "Content" would make it hard to find. **Application Patterns** replaces the more open-ended "Page Flow" section from `RefactorPlan.md` — narrowed to the concrete, verified duplicated-pattern findings from this audit rather than a speculative full page-flow walkthrough.

## 8. Prioritized Phase 2 implementation sequence

Following the priority order requested (foundations → shared primitives → form controls → layout → navigation → feedback → complex application patterns → page-specific), with the fix-before-document items called out inline since documenting a known bug as the intended behavior would be worse than not documenting it yet.

**P0 — Foundations**
1. Wire Storybook to read colors/typography/spacing directly from `theme.ts` rather than hand-copying values (fixes the drift risk already present in `DesignSystem.tsx`'s Colors section).
2. Document all 11 custom typography variants (currently 4 shown), fill the 9 missing rows in the component-overrides table, and fix the `MuiCssBaseline`→`.SelectionGroup-root` leaky coupling before or while documenting it.
3. Document the 4 hardcoded-NYL-logo locations as a flagged gap, not a hidden fact.

**P1 — Primitives / shared components used across many pages**
4. `FieldRenderer`-adjacent primitives: `SelectionGroup`, `ConditionalGroup`, `DynamicList`/`DynamicListItem` (full state matrix), `PageShell`/`FormShell`/`PageHeader`/`PageTitle`, `SectionDivider` (fix-then-document the inverted prop), `ApplicantSectionDivider`, `CategoryCard`/`CategoryHeader`, `ProductCard`, `HelpChips`, `PageAlert`, `AppSnackbar`, `EmptyState`, `LoadingOverlay`, `PageTransitionSkeleton`.
5. Fix the dead `noContainer` prop on `PageShell` before documenting its API surface.

**P2 — Form controls**
6. One story per `FieldRenderer` field type/format (16 total) with default/error/disabled states and the completion-icon debug toggle exposed as a control.
7. Resolve the `field-types.ts` vs `types.ts` duplication question (confirm which is live) before writing type-level docs that reference either.
8. Extract and document `RadioSelectionGroup` (replaces 3 independent implementations).
9. Fix the inline ZIP-field reimplementation in `Eligibility.tsx` to reuse `FieldRenderer`'s existing logic, or document why it's intentionally separate.

**P3 — Layout patterns**
10. Extract and document `FieldRow`/`FieldGrid` (replaces the 3-page grid duplication) and `IconListItem` (replaces the 3-page Health-page duplication).
11. Fix `Profile.tsx`'s missing-breakpoint grid to match the established responsive pattern.
12. Migrate `Resume.tsx`/`ResumeCode.tsx`/`ResumeMethod.tsx` to use `PageShell`/`FormShell`/`PageHeader` instead of their hand-rebuilt equivalents, then document the "Application Page Template" pattern once it's the single implementation everywhere.
13. Document `AppShell` (all 5 variants), `AppHeader` (all states, not just homepage), `AppFooter`, `AppMenu`, `ClientHelpBanner`.

**P4 — Navigation**
14. Document `PageNav`, `ProgressStep`/`VerticalStepperBreadcrumbs` (including the dynamic step-collapsing behavior), and confirm/resolve the `LegalDocList` usage-site question.

**P5 — Feedback**
15. Extract and document `useCountdown`/`ExpiringCodeAlert` (Resume/ResumeCode) and `ProcessingStatusPage` (DocuSign/HealthQd/Resume).
16. Extract and document `DetailsTable` (AdvisorSendConfirmation/ApplicationEditConfirmation).
17. Fix the `.focus()` gap in both `scrollToFirstError` implementations (RoutePage.tsx and the duplicated copy in Coverage.tsx) — consolidate into one exported helper while fixing it.
18. Document the ~13-page inline-`Alert`-instead-of-`PageAlert` pattern as a known deviation; recommend (but don't require as part of this plan) a migration pass.
19. Formally retire `PageErrorAlert` (already a 5-line deprecated shim) — remove it rather than giving it a story.

**P6 — Complex application/commerce patterns**
20. Resolve the `QuoteModal` dead-code question with the team before documenting it either as live or as retired.
21. Document `ProductCatalog`, `CoverageCart` (both variants), `QuoteCalculator`+`EstimatorProductCard` (as a paired "full vs. estimator" story), `CoverageOptionsPanel` (fix the placeholder `href="#"` link first), `CoveragePortfolioDrawer`, `MemberVerification`, `HowApplyingWorksPanel`, `TotalCostSummary`, `ProductCostBreakdown`.
22. Extract and document `RateFrequencyControl` (replaces the CoverageCart/QuoteCalculator duplication).
23. Document the `FeaturedBadge`/`QuickDecisionIndicator` pair together as "product-card adornments," and the `QuickDecisionExplainer`/`QuickDecisionInfoBox` pair together as "QuickDecision content, two surfaces."
24. Add the 3 missing rows (`SendApplicationDialog`, `CoveragePortfolioDrawer`, `MemberVerification`) to `src/content/docs/componentInventory.ts` and correct its `QuoteModal` usage claim once §20 is resolved.

**P7 — Page-specific patterns**
25. Reconcile `Beneficiary.tsx`'s add/edit/remove flow with `DynamicList`'s confirm/announce convention (at minimum add the missing remove-confirmation) before documenting it as a pattern.
26. Extract and document `YesNoDetailList` (replaces the 3-page Health-page conditional-reveal duplication).
27. Document `ApplicationDocumentPreview` as a page-specific pattern (not a general-purpose component — it's tightly coupled to the application's data model).
28. Lowest priority: extract `useTextFilter` from `InformationArchitecture.tsx` if that internal tool is touched again; not worth a dedicated pass on its own.

## 9. Explicit non-goals for this phase (confirmed with the task's own constraints)

- No stories were mass-created.
- No components were refactored or moved.
- No existing functionality or documentation was removed.
- The three stale `Site_Components_Inventory_Tier*.md` files and `pageflows.md` were left in place, not deleted or rewritten — they're flagged as historical/aspirational above, and a future cleanup decision (archive vs. delete vs. keep) is left to the team.
- The `QuoteModal` dead-code question and the `PageErrorAlert` retirement are flagged as decisions for Phase 2, not resolved here, since resolving them would mean deleting/moving code — outside this audit's scope.

---

## 10. Phase 2A — Storybook foundation & migration planning (2026-09-08)

Scope for this pass, per the Phase 2 master spec: audit `DesignSystem.tsx` and `InformationArchitecture.tsx` and build the migration matrix below; establish the Storybook information architecture and shared infrastructure; build the Foundations section in full; build `Guidelines / Accessibility`. Forms/Layout/Navigation/Content/Feedback/Overlays/Coverage & Commerce component stories were explicitly deferred to Phase 2B and are not built yet.

### 10.1 Migration matrix — `src/pages/DesignSystem.tsx`

| # | Section | What it documents | Classification | Storybook destination | Status |
|---|---|---|---|---|---|
| 1 | Colors | Palette swatches (brand/semantic, neutrals, contextual containers, 4 client presets) via hand-copied local arrays | Reusable design-system foundation | `Foundations/Colors` | **Fully migrated** — Storybook version reads every value live from `createAppTheme`/`useTheme()`; no hand-typed hex values, so it can't drift the way the in-app arrays already had. |
| 2 | Typography | h1–h6/body/subtitle/overline live examples + 4 of 11 custom form variants | Reusable design-system foundation | `Foundations/Typography` | **Fully migrated, and expanded** — now shows all 11 custom variants plus their mapped HTML element, read live from `theme.typography` and `MuiTypography.defaultProps.variantMapping`. |
| 3 | Component overrides | Static 10-row prose table of theme.ts's `components` overrides | Reusable design-system foundation | `Foundations/MUI Theme Overrides` | **Fully migrated, and expanded** — 18 grouped rows (covering all keys in `theme.components`, including the 9 the original table omitted: Skeleton, LinearProgress, Badge, Select, MenuItem, Breadcrumbs, FormHelperText, Toolbar, CssBaseline), plus live visual examples for most of them. Includes the investigated-but-not-fixed `MuiCssBaseline`→`.SelectionGroup-root` finding (see §10.4). |
| 4 | Form field examples | 18 live `FieldRenderer` instances, one per input pattern | Component documentation (not a foundation) | `Forms / FieldRenderer` (Phase 2B) | **Not migrated.** Deferred — this phase built Foundations + Accessibility only. `DesignSystem.tsx` remains the only place this is currently shown. |
| 5 | Field errors | 4 forced-error `FieldRenderer` examples | Component documentation + validation guidance | `Guidelines / Form Validation & Errors` + `Forms / FieldRenderer` (Phase 2B) | **Not migrated.** Deferred to Phase 2B. |
| 6 | Component examples | Live mounts of `AppHeader`, `AppMenu`, a mocked `CoverageCartPreview`, and `DynamicList` | Component documentation | `Layout`, `Navigation`, `Overlays`, `Forms` component stories (Phase 2B) | **Not migrated.** Deferred to Phase 2B. |
| 7 | Component library | `ComponentInventorySection` — searchable table over `componentInventory.ts` | Governance/navigation tool, not itself a design-system artifact | Storybook's own sidebar/navigation (once component stories exist) | **Obsolete/redundant once Phase 2B is built** — per the master spec, Storybook's own hierarchy should be the browsing mechanism, not a second searchable table reproduced inside a story. Not touched this phase; still the only working component index today. |
| 8 | Icons | ~60-icon grid grouped into 5 purpose categories, with a filter | Reusable design-system foundation | `Foundations/Icons` | **Fully migrated** (same grouping/data, ported verbatim since it's already a manually-maintained snapshot with no theme-derivable source — flagged as such on the new page too). |
| 9 | Branding guidelines | Logo/hero-image/hero-text constraints (prose + placeholder boxes) + reserved-color callout | Reusable design-system foundation | `Foundations/Branding` | **Fully migrated, and expanded** — now shows every real client's actual logo asset (served via a new Storybook `staticDirs` config) instead of a placeholder box, and explicitly flags the 4 hardcoded-NYL-logo locations from the Phase 1 audit. |
| 10a | Design rules → Field stacking | Vertical vs. grid field layout convention (mock boxes) | Reusable layout pattern | `Layout / Field Row` pattern (Phase 2B, pending the `FieldRow` extraction from §6 of the Phase 1 audit) | **Not migrated.** Layout component/pattern stories are Phase 2B scope. |
| 10b | Design rules → Form template layout | `forceMobileLayout` / template=single vs. multi behavior | Reusable responsive-design foundation | `Foundations / Breakpoints & Responsive Design` | **Fully migrated** — now a live, interactive side-by-side comparison (two nested `ThemeProvider`s, one real theme and one `forceMobileLayout: true`) instead of prose alone. |
| 10c | Design rules → Alerts | Severity-to-meaning matrix (`alertRules`) with 4 live `Alert`s | Reusable feedback guidance | `Guidelines / Dynamic Feedback & Status` (Phase 2B) | **Not migrated.** Deferred to Phase 2B. |
| 10d | Design rules → Shape & motion | Pill buttons, shared `CARD_RADIUS` | Reusable design-system foundation | `Foundations/Shape` | **Fully migrated.** |

### 10.2 Migration matrix — `src/pages/InformationArchitecture.tsx`

Only the sections actually in scope for this phase were evaluated. Pages, Fields, Features, Flows, Configurations, URL Parameters, Error Messages, and Content were **not reviewed** in this pass and their migration status is intentionally left blank — per the master spec, application-specific/requirements content stays in IA and was never proposed to move.

| Section | What it documents | Classification | Storybook destination | Status |
|---|---|---|---|---|
| Accessibility (`accessibilityRequirements`, ~40 rows / 12 areas) | Full WCAG 2.2 AA requirement table with per-item status | Governance-level requirements record | — (stays in IA) / `Guidelines/Accessibility` for the implementation side | **Remains in IA** as the authoritative requirements-and-status record. **Fully migrated (as guidance, not a copy)** to `Guidelines/Accessibility` — reorganized into 11 thematic sections with concrete component pointers, rather than the raw table pasted in. The IA table is not shortened or removed. |
| Rules → `forceMobileLayout`/template responsive entries | How the `template=single` client setting maps to `createAppTheme`'s `forceMobileLayout` and which components key off it | Mixed: the *why* (client configures a template) is application-specific; the *how the UI responds* is a reusable design-system fact | **Rule/trigger remains in IA.** The resulting UI behavior is now also shown in `Foundations / Breakpoints & Responsive Design`. | **Partially migrated** — Storybook shows the resulting responsive behavior live; IA keeps the application-configuration trigger and the affected-component list as the authoritative reference. |
| Pages, Fields, Features, Flows, Configurations, URL Parameters, Error Messages, Content | Application architecture and requirements | Application-specific | Stays in IA | **Remains in IA** — out of scope for this phase, not reviewed. |

### 10.3 Storybook infrastructure established this phase

- Installed `@storybook/addon-a11y@10.5.0` (matching the existing `storybook@10.5.0`) and registered it in `.storybook/main.ts`. Configured non-blocking by default (`a11y.test: "todo"` in `.storybook/preview.tsx`) so violations surface in the panel without failing builds until a story is deliberately promoted to blocking.
- Added `staticDirs: ["../public"]` to `.storybook/main.ts` so stories can reference real client assets (logos, hero images) instead of placeholder boxes.
- Rebuilt `.storybook/preview.tsx`'s theming: every story is now themed via `createAppTheme(context.globals.themeColor)` — the exact call the real app makes — driven by a new toolbar "Theme" control with all 4 client presets, instead of a single static imported theme. This makes every story (not just Foundations/Colors) re-themeable.
- Added `parameters.options.storySort` in `preview.tsx` to fix the sidebar order to the proposed information architecture (Overview → Foundations → Guidelines → Forms → Layout → Navigation → Content → Feedback → Overlays → Coverage & Commerce → Application Patterns → Project) rather than the default alphabetical order.
- Added `src/docs/shared/DocsBlocks.tsx` — shared presentational building blocks (`DocsPage`, `DocsSection`, `DocsTable`, `SourceNote`, `StatusChip`, `ColorSwatch`/`SwatchRow`) used by every Foundations/Guidelines/Overview page, so those pages stay visually consistent without each one re-inventing table/swatch markup. This file matches no `*.stories.*` glob and is not itself a story.
- Verified end-to-end: `npx storybook build` succeeds with all 14 stories registered (13 new + the pre-existing `Project/Overview`), `tsc -b --noEmit` and `eslint` are clean across `src/docs`, and the real app's own `npm run build` is unaffected.

### 10.4 Verified during this phase

- **`SectionDivider`'s inverted `chipVariant` prop** (Phase 1 finding): investigated further but **not fixed** in this phase — the master spec scoped that correction to Phase 2B, when `SectionDivider` gets its own component story and consumers can be updated in the same pass. Not re-verified beyond the Phase 1 finding.
- **`PageShell.noContainer` dead prop** (Phase 1 finding): not re-verified this phase — `PageShell` doesn't have a Foundations-level story; this belongs to its own component documentation pass in Phase 2B (Layout section).
- **`MuiCssBaseline` → `.SelectionGroup-root .SelectionGroup-label` coupling**: investigated as instructed. Confirmed it **cannot** be moved into `SelectionGroup.tsx` as a small change — `SelectionGroup` never renders the label itself; the `.SelectionGroup-label` className is applied independently by 8 separate call sites across `FieldRenderer.tsx` (×3), `CoverageCategorySelector.tsx`, `QuoteCalculator.tsx` (×2), `QuoteModal.tsx` (×2, one with a conflicting inline `sx` font-size), `ResumeMethod.tsx`, and `Beneficiary.tsx`. Fixing this properly means giving `SelectionGroup` a `label` prop and updating all 8 call sites — a real, moderate-size refactor. Documented as technical debt on `Foundations / MUI Theme Overrides` rather than fixed, per the master spec's own fallback instruction and the phase's no-broad-refactor constraint.

### 10.5 Explicit non-goals for Phase 2A (per the master spec's scope limits)

- Forms/Layout/Navigation/Content/Feedback/Overlays/Coverage & Commerce component stories were not built.
- `DesignSystem.tsx` and `InformationArchitecture.tsx` were not stripped, shortened, or had routes/links changed — both remain fully intact and are still the only source for everything marked "Not migrated" above.
- `src/content/docs/componentInventory.ts` and `src/docs/ComponentInventory.md` were not updated for Storybook links — no component stories exist yet for either to point to, so there is nothing new to link.
- The `RadioSelectionGroup`/`FieldRow`/`useCountdown`/etc. extractions proposed in the Phase 1 audit were not implemented — still deferred to whichever future phase builds the component story that needs them.
- `QuoteModal`'s dead-code status and `PageErrorAlert`'s retirement remain open questions for the team, not resolved here.

### 10.6 Recommended Phase 2B scope

Build the stable shared primitives listed in the master spec's §10, in the priority order from §8 of this document: `FieldRenderer` (all field types + the field-error states, migrating `DesignSystem.tsx`'s sections 4 and 5) and `SelectionGroup`/`ConditionalGroup`/`DynamicList`/`DynamicListItem` first (Forms), then `PageShell`/`FormShell`/`PageHeader`/`PageTitle`/`SectionDivider`/`ApplicantSectionDivider`/`CategoryCard`/`CategoryHeader`/`ProductCard` (Layout — and resolve the `SectionDivider`/`PageShell` fixes from §10.4 while building those specific stories), `HelpChips` (Content), and `PageAlert`/`AppSnackbar`/`EmptyState`/`LoadingOverlay`/`PageTransitionSkeleton` (Feedback, migrating `DesignSystem.tsx`'s sections 6 and its `alertRules`/`Guidelines / Dynamic Feedback & Status`). Update `componentInventory.ts` and `ComponentInventory.md` with real Storybook links only for components that get a story in that pass, per §18 of the master spec.

**Status: complete — see §11.**

---

## 11. Phase 2B — Stable shared-primitive component stories (2026-09-08)

Scope: exactly the §10.6 recommendation above — no Navigation, Overlays, or Coverage & Commerce stories were built; those remain for a future phase.

### 11.1 What was built

20 components across 5 story files' worth of categories, all co-located with their source component (`Component.stories.tsx` next to `Component.tsx`) with `title` set explicitly so the Storybook sidebar still matches the proposed information architecture regardless of file location:

- **Forms** (5 components, `src/components/forms/*.stories.tsx`): `FieldRenderer` (26 stories — a controls-driven `Playground` plus one story per supported input pattern, 4 forced-error states, a `Disabled` state that didn't exist anywhere in the app's own docs before, and the `?inputChecks` completion-icon debug mode exposed as a toggle for the first time), `SelectionGroup` (6 stories covering both selected-state mechanisms — `data-checked` attribute vs. CSS `:has(:checked)` — plus focus-visible), `ConditionalGroup` (3 stories, including an honest note that the component adds no announcement of its own), `DynamicList` (4 stories: Empty/Populated/Maximum-items-reached/2-column-grid-fields, all real interactions — click Add/Edit/Remove rather than looking at a screenshot), `DynamicListItem` (3 stories, including a "without itemLabel" story showing why that prop matters for a11y).
- **Layout** (9 components, `src/components/layout/*.stories.tsx`): `PageShell`, `FormShell`, `PageHeader`, `PageTitle`, `SectionDivider`, `ApplicantSectionDivider`, `CategoryCard`, `CategoryHeader`, `ProductCard`.
- **Content** (1 component, `src/components/content/HelpChips.stories.tsx`): `FormHelpChips`, including the narrow-container overflow-fade behavior and the hidden-scrollbar a11y flag from Phase 1.
- **Feedback** (5 components, `src/components/feedback/*.stories.tsx`): `PageAlert`, `AppSnackbar` (including the `ProgressSavedSnackbar` preset as a story within the same file), `EmptyState`, `LoadingOverlay`, `PageTransitionSkeleton`.
- **Guidelines** (1 new page, `src/docs/guidelines/DynamicFeedbackAndStatus.stories.tsx`): migrates `DesignSystem.tsx`'s "Design rules → Alerts" `alertRules` matrix (the one Phase 2A deferral explicitly left for this phase) and documents the polite/assertive live-region split shared by every feedback component above.

Total: 119 stories registered across the whole Storybook instance (up from 14 after Phase 2A), verified via `tsc -b --noEmit`, `eslint`, `npx storybook build`, and `npm run build` (the real app), all clean.

### 11.2 Fixes applied (verified first, per the master spec's own instructions)

1. **`SectionDivider`'s inverted `chipVariant` prop (master spec §20).** Verified every real call site (12 files) uses the `variant="subsection"` preset and none pass `chipVariant` directly. Fixed both halves of the bug — the final MUI `variant` ternary was inverted, and the `subsection` preset itself set the wrong internal value to compensate for it — so the fix produces **zero visual change** in the running app (the two bugs were canceling each other out) while making the public API correct for any future direct usage. Confirmed via `tsc -b` and `npm run build`.
2. **`PageShell.noContainer` dead prop (master spec §21).** Verified end-to-end: `PageShell.tsx` declared the prop in its type but never destructured or referenced it in the render body (so it was a true no-op regardless of value); `RoutePage.tsx` passed a real, frequently-`true` computed value (`noContainer || hasVerticalStepper`) that had zero effect once it reached `PageShell`; and `RoutePage`'s own `noContainer` prop was never passed by any page file. Removed the prop from both `PageShell`'s type and `RoutePage`'s type/destructuring/call site. Confirmed via `tsc -b` and `npm run build` — no behavior change, since the prop never did anything.

Neither fix touched application business logic, only dead/buggy prop plumbing in two shared layout components — consistent with the phase's "no broad refactoring, only what's needed to accurately document a component" constraint.

### 11.3 Inventory updates

- `src/content/docs/componentInventory.ts`: the 20 components above had their `storybookLink` corrected from a hand-guessed path to the real generated story ID (e.g. `/?path=/story/forms-fieldrenderer--playground`), each verified against the actual `npx storybook build` output rather than assumed. No other entries were touched — every component without a real story still has its previously-flagged dead link, unchanged.
- `src/docs/ComponentInventory.md`: all 20 components' `Story?`/`Action` columns updated to `Yes`/`Done`, with the two verified fixes called out inline.

### 11.4 Explicit non-goals for Phase 2B

- Navigation (`PageNav`, `ProgressStep`), Overlays (`AppDrawer`, `AppModal`, `ConfirmationDialog`, `CookieDialog`, `SendApplicationDialog`), and Coverage & Commerce component stories were not built — next phase's scope.
- `QuoteModal`'s dead-code status and `PageErrorAlert`'s retirement remain unresolved, open questions for the team.
- The `RadioSelectionGroup`/`FieldRow`/`IconListItem`/`useCountdown`/`ProcessingStatusPage`/`YesNoDetailList`/`DetailsTable`/`RateFrequencyControl` extractions proposed in the Phase 1 audit were not implemented.
- The ~13-page inline-`Alert`-instead-of-`PageAlert` migration was documented (in `Guidelines/Dynamic Feedback & Status`) but not performed.
- `AppMenu` and `AppHeader` (partially documented in Phase 1/2A via live mounts on the in-app Design System page) were not given dedicated Storybook stories in this pass.

### 11.5 Recommended next phase

Navigation (`PageNav`, `ProgressStep`/`VerticalStepperBreadcrumbs`) is the smallest remaining category and a natural next step. Overlays should wait until the `QuoteModal` dead-code question is resolved with the team, since documenting it either as live or as retired changes the shape of that section. Coverage & Commerce is the largest remaining cluster (15 components) and the most business-specific — consider tackling `ProductCatalog`/`CoverageCart`/`QuoteCalculator`+`EstimatorProductCard` as a themed sub-pass given how tightly coupled they are to each other's data, rather than 15 independent stories in an arbitrary order.

**Status: complete — see §12.**

---

## 12. Phase 2C — Navigation component stories + in-app Storybook-link fix (2026-09-14)

Scope: the §11.5 recommendation (Navigation, the smallest remaining category) plus a real bug reported separately — the "Storybook" links in the component table on `src/pages/DesignSystem.tsx` didn't actually open Storybook.

### 12.1 What was built

- **`Navigation/PageNav`** (`src/components/navigation/PageNav.stories.tsx`, 4 stories): Default, CustomLabel, `isTransitioning` (spinner + `aria-label` swap so the button doesn't lose its accessible name while submitting), and `disabled` (the theme's full-contrast disabled override). Wrapped in a real `<form id="demo-form">` since `PageNav` targets its form via the `form` attribute rather than DOM nesting.
- **`Navigation/ProgressStep`** (`src/components/navigation/ProgressStep.stories.tsx`, 7 stories): both `ProgressStep` and its co-located named export `VerticalStepperBreadcrumbs` (previously undocumented anywhere, including in `DesignSystem.tsx`). Covers the data-driven step-collapsing case (no coverage selected → Beneficiary and every Health-* step disappear rather than rendering disabled), the Health-page-consolidated breadcrumb with realistic dummy data generated by the app's own `generateFormDataUpToPage()` autofill helper (not hand-typed), the mobile accordion-`Stepper` layout (using the same `createAppTheme(..., { forceMobileLayout: true })` technique `Foundations/Breakpoints` already established, so the story doesn't depend on the Storybook viewport addon, which isn't installed), and both independent post-interaction lock states — after Review is submitted, and during an advisor→applicant handoff — which are two separate `sessionStorage` flags the component reads directly, not two branches of one flag.
- **`src/app/ApplicationFormContext.tsx`**: exported the context object itself (`ApplicationFormContext`), not just the `useApplicationForm` hook — a one-line, behavior-preserving change so these stories (and any future one needing fixed form values) can supply demo data directly via `<ApplicationFormContext.Provider value={...}>`, fully isolated from the real provider's `sessionStorage`-backed persistence, instead of every story leaking state into the browser's actual session storage. This adds one more `react-refresh/only-export-components` lint warning to a file that already had exactly one (on `useApplicationForm`) — suppressed with an inline `eslint-disable-next-line` pointing at that precedent, not treated as a new problem to solve.

Total: 130 stories registered (up from 119 after Phase 2B), verified via `tsc -b --noEmit`, `eslint`, `npx storybook build`, and `npm run build`, all clean.

### 12.2 Storybook-link bug fixed (reported directly, not from the Phase 1 audit)

Every `storybookLink` value in `src/content/docs/componentInventory.ts` (the data behind the "Storybook" column in `ComponentInventorySection.tsx`, rendered on `DesignSystem.tsx`) is a root-relative path like `/?path=/story/forms-fieldrenderer--playground`. Storybook runs on its own dev server (`localhost:6006`, per the `storybook` script in `package.json`) — a separate origin from the running app. Clicking one of these links from inside the app therefore just reloaded the app itself at that path; there was nothing in the app's own router matching that query string, so every single link was silently broken regardless of whether its target story existed.

Two fixes, both in `src/components/docs/ComponentInventorySection.tsx`:

1. Added a `STORYBOOK_BASE_URL = "http://localhost:6006"` constant and a `resolveStorybookHref()` helper that prefixes `storybookLink` with it before rendering the `<Link>`, in both the table row and the detail modal.
2. Added a `hasStory: boolean` field to the `ComponentRow` type in `componentInventory.ts` and set it correctly for all 54 rows by cross-checking each entry's name against the titles actually present in a real `npx storybook build` output (23 `true`: the 20 from Phase 2B, plus `PageNav`/`ProgressStep` from this phase, plus `ProgressSavedSnackbar` — which turned out to have had the *wrong* link since Phase 2B; its story is a named story inside `Feedback/AppSnackbar`, not a component of its own, so `/?path=/story/feedback-progresssavedsnackbar` never resolved to anything real). `ComponentInventorySection.tsx` now renders a working link only when `hasStory` is true, and a plain "No story yet" label otherwise — so a developer clicking through the table can no longer land on a dead link and not know whether that's a bug or an intentionally-undocumented component.

Every row's `storybookLink` value is otherwise unchanged (including the ~31 still-guessed, still-inert paths for components that don't have a story yet) — this phase fixed the two ways the *existing* data was being misused (relative-origin links, and presenting guesses as facts), not the guesses themselves. As more components get real stories in future phases, they need both a corrected `storybookLink` and `hasStory: true`, per this pattern.

### 12.3 Explicit non-goals for Phase 2C

- Overlays (`AppDrawer`, `AppModal`, `ConfirmationDialog`, `CookieDialog`, `SendApplicationDialog`) and Coverage & Commerce component stories were not built — still waiting on the `QuoteModal` dead-code question (Overlays) and still the largest remaining cluster (Coverage & Commerce).
- The other ~31 components with `hasStory: false` were not given stories in this phase and their `storybookLink` guesses were left untouched.
- `AppMenu`/`AppHeader`/`AppFooter`/`AppBody`/`AppShell`/`ClientHelpBanner` (Layout's remaining "App shell" cluster from §7's IA) were not touched — still pending their own pass.

### 12.4 Recommended next phase

Per §11.5 (unchanged): Overlays needs the `QuoteModal` dead-code decision from the team first. Coverage & Commerce (15 components: `ProductCatalog`, `CoverageCart`, `QuoteCalculator`+`EstimatorProductCard`, `CoverageCategorySelector`, `CoverageNeedsCalculator`, `CoverageQuestions`, `CoverageOptionsPanel`, `CoveragePortfolioDrawer`, `ProductCostBreakdown`, `TotalCostSummary`, `FeaturedBadge`, `RateFrequencyToggle`, `MemberVerification`, `HowApplyingWorksPanel`) is the largest remaining piece of the master spec's Phase 5 ("application-specific experiences") and the most business-specific — recommend tackling it as its own themed sub-pass (e.g. shopping/cart flow together, then identity/verification, then quote tools) rather than 15 stories in an arbitrary order, and resolving the `QuoteModal` question with the team before or alongside that pass so Overlays isn't left blocked indefinitely.

**Status: complete — see §13.**

---

## 13. Phase 2D — Overlays component stories (2026-09-14)

Scope: the §11.5/§12.4 recommendation, unblocked this session by the team confirming `QuoteModal` should be treated as dead code (documented, not deleted, not given a story) rather than live.

### 13.1 What was built

5 components, all in `src/components/layout/*.stories.tsx` (co-located with source, `title` set to `Overlays/...` per §7's IA even though the files live under `components/layout`, matching the same folder-vs-IA split already established for this section):

- **`AppDrawer`** (4 stories): desktop right-panel, mobile bottom sheet (via the `forceMobileLayout` theme technique, not the viewport addon), the `swipeable` opt-in used only by the cart today, and the `ariaLabel`-only (no `title`) variant.
- **`AppModal`** (5 stories): Default, single-action, two-actions/`alertdialog`, `showCloseIcon={false}`, and `forceFullScreen`.
- **`ConfirmationDialog`** (3 stories): Default, `confirmColor="error"`, custom labels.
- **`CookieDialog`** (1 story): states directly in its own description that despite the name it's a fixed banner, not a true Dialog (no backdrop/focus-trap), consistent with the Phase 1 finding.
- **`SendApplicationDialog`** (3 stories): to-applicant (with recipient name), to-advisor (`showRecipientName={false}`), and the missing-data em-dash fallback. This component was missing from `componentInventory.ts` entirely before this phase (a gap flagged since Phase 1) — added now with a real `hasStory: true` link.

Total: 146 stories registered (up from 130 after Phase 2C), verified via `tsc -b --noEmit`, `eslint`, `npx storybook build`, and `npm run build`, all clean.

### 13.2 QuoteModal resolved

The team confirmed `QuoteModal.tsx` (~900 lines) should be treated as dead code: kept in the repository, not deleted, but not given a Storybook story and not documented as if it were live. `componentInventory.ts` was updated:

- `QuoteModal`'s own `usedIn` field changed from the unconfirmed "Coverage page, AppHeader" to state plainly that it isn't rendered anywhere, per this phase's decision.
- `AppDrawer`'s `usedIn` field had `QuoteModal` removed from its list (it was previously credited as a consumer of `AppDrawer`, which was only true in the sense that dead code still imports it, not that it's a real runtime usage).
- `EstimatorProductCard`'s description/`usedIn` (which mentions "Quote Modal estimator views") was deliberately left alone — that's describing what `QuoteModal.tsx`'s own source code does internally, not a claim about a live page, so it isn't a false statement the way the other two were.

No source files were deleted or modified as part of this resolution — only the two documentation-data claims above.

### 13.3 Explicit non-goals for Phase 2D

- Coverage & Commerce (15 components) was not touched — still the largest remaining piece of the master spec's Phase 5, and still recommended as its own themed sub-pass rather than 15 independent stories.
- `QuoteModal.tsx` itself was not deleted, refactored, or modified — only the two documentation claims referencing it were corrected.
- `AppMenu`/`AppHeader`/`AppFooter`/`AppBody`/`AppShell`/`ClientHelpBanner` (Layout's "App shell" cluster, distinct from Overlays) remain undocumented, as noted in §12.3.

### 13.4 Recommended next phase

Coverage & Commerce is now the only remaining category from the original §7 information architecture. Given its size (15 components, several 800–1000+ lines, tightly coupled to shared coverage/product config), recommend splitting it into sub-passes rather than one large one — for example: (1) shopping surfaces (`ProductCatalog`, `CoverageCart`, `CoverageOptionsPanel`, `CoveragePortfolioDrawer`), (2) quote tools (`QuoteCalculator`, `EstimatorProductCard`, `CoverageNeedsCalculator`, `CoverageCategorySelector`, `CoverageQuestions`), (3) cost/adornment primitives (`ProductCostBreakdown`, `TotalCostSummary`, `RateFrequencyToggle`, `FeaturedBadge`), and (4) identity/guidance (`MemberVerification`, `HowApplyingWorksPanel`). Once that's done, the master spec's Phase 6 (page-by-page coverage audit) and Phase 7 (cleanup) become possible for the first time — both are explicitly gated on component coverage being complete first.

**Status: complete — see §14.**

---

## 14. Phase 2E — Coverage & Commerce component stories (2026-09-14)

Scope: all 15 Coverage & Commerce components from §13.4's plan, done in the recommended sub-pass order, plus 3 Forms-category components tightly coupled to the same page (`EligibilityFields`, `PhysicianInformation`, `CoverageQuestions`) that had been left undone since Phase 1. This completes the master spec's Phase 5 ("application-specific experiences") for every component-shaped item; only page-level/flow-level coverage (advisor flow, TPA flow, health flows, confirmation experiences as full pages) remains outside Storybook's component-story format, per the master spec's own Phase 6.

### 14.1 What was built

23 components across two source folders (`src/components/forms/*.stories.tsx`, `src/components/ui/*.stories.tsx`):

- **Primitives** (4 components + 1 paired page): `ProductCostBreakdown` (4 stories), `TotalCostSummary` (5 stories), `RateFrequencyToggle` (3 stories, including a reproduction of the still-unextracted `RateFrequencyControl` duplication as a *documented*, not fixed, issue), and `FeaturedBadge`+`QuickDecisionIndicator` combined into one `Product Adornments` page (1 story) rather than two separate ones, per the Phase 1 recommendation to show their visual inconsistency side by side.
- **Forms/quote tools**: `CoverageCategorySelector` (4 stories), `CoverageNeedsCalculator` (1 story), `CoverageQuestions` (4 stories, driven by real `getPageSections("coverage")`/`getClientPageFields` config through a real `react-hook-form` context — verified with a temporary, not-committed smoke test before shipping, since a wrong category choice would have silently rendered an empty section), `EligibilityFields` (4 stories), `PhysicianInformation` (1 story, same real-config-plus-smoke-test approach using Profile's `profilePersonalSelfPhysician` section), `EstimatorProductCard` (5 stories), `QuoteCalculator` (3 stories — fully self-contained, no context wrapper needed).
- **Shopping surfaces** (the two largest, most business-specific components in the whole audit): `ProductCatalog` (2 stories) and `CoverageCart` (2 stories, `drawer` variant only — the `inline` variant is exercised live inside `ProductCatalog`'s own story instead of duplicated). Both call the app's *real* stateful hooks (`useCoverageState()` for `ProductCatalog`, raw `useApplicationForm()` values for `CoverageCart`'s drawer) inside a small locally-scoped `ApplicationFormContext.Provider` — real client pricing/eligibility/copy, not fabricated data, and isolated from the running app's own sessionStorage-backed values so switching between stories never leaks state. Verified end-to-end with a temporary, not-committed smoke test (mount → toggle a real category → reveal → advance past the real ~2s rate-calculation delay → assert real product names/prices appear) before writing the final story, given how much could plausibly go wrong silently in 25+ props derived from a 742-line hook.
- **Remaining shopping/guidance surfaces**: `CoverageOptionsPanel` (3 stories), `CoveragePortfolioDrawer` (2 stories, added to `componentInventory.ts` — previously missing entirely), `MemberVerification` (1 fully interactive story covering all 4 method branches, added to `componentInventory.ts` — also previously missing entirely), `HowApplyingWorksPanel` (2 stories, including the live nested sub-drawers in the `drawer` variant).

Total: 192 stories registered (up from 146 after Phase 2D), verified via `tsc -b --noEmit`, `eslint`, `npx storybook build`, and `npm run build` (the real app), all clean.

### 14.2 Fix applied (verified first)

**`CoverageOptionsPanel`'s placeholder `href="#"` product link** (Phase 1 finding, this component's assigned action was "Fix-then-document," unlike most of this phase's "Document"-only items). Verified the `onClick` handler only called `event.preventDefault()` — the link never went anywhere for any product, confirming it was a real, not hypothetical, a11y smell. Fixed by replacing the `Link` with plain `Typography`, preserving the exact same visual styling (bold, primary color) since there's no real product-detail page for it to point to. Confirmed via `tsc -b` and `npm run build`; two pre-existing, unrelated `react-hooks/set-state-in-effect` lint errors in the same file (lines 92/109 in the post-fix file) were verified via `git stash` to predate this change and were left untouched, per the phase's own no-unrelated-fixes constraint.

### 14.3 Inventory corrections (verified against source, not assumed)

- `QuoteCalculator`'s `usedIn` corrected from "AppMenu drawer" (never true) to the real "Home page, Membership page," confirmed via `grep -rln "<QuoteCalculator"`.
- `ProductCostBreakdown`'s `usedIn` corrected from "CoverageCart" to the real "ProductCatalog (client-config gated)."
- `AppDrawer`'s and `EstimatorProductCard`'s `usedIn` had their `QuoteModal` cross-references removed, following through on Phase 2D's dead-code resolution — `QuickDecisionExplainer`/other components' own descriptions that describe `QuoteModal.tsx`'s *internal* source composition (not a live-page usage claim) were deliberately left alone, since those aren't the same kind of false statement.
- `CoveragePortfolioDrawer` and `MemberVerification` added as brand-new rows to `componentInventory.ts` — both were missing entirely since at least Phase 1, a gap repeatedly flagged but not fixed until now.

### 14.4 Explicit non-goals for Phase 2E

- The `RateFrequencyControl` label-wrapper extraction (documented as a known duplication, not fixed) remains deferred to a future cleanup phase, consistent with every prior phase's same call on this item.
- 4 Content-section components (`ApplicationDocumentPreview`, `LegalDocList`, `QuickDecisionExplainer`, `QuickDecisionInfoBox`) and Layout's "App shell" cluster (`AppBody`, `AppFooter`, `AppHeader`, `AppMenu`, `AppShell`, `ClientHelpBanner`) were not touched — outside this phase's Coverage & Commerce scope.
- `QuoteModal` remains undocumented as a story, per the Phase 2D team decision.
- No page-level flow stories (advisor flow, TPA flow, resume/autosave, confirmation pages as whole pages) were built — those are page-shaped, not component-shaped, and belong to the master spec's Phase 6 (page-by-page coverage audit), not this component-story phase.

### 14.5 Recommended next phase

Per the master spec's own phase order, Phase 6 (page-by-page coverage audit — verifying every visible/interactive/responsive/stateful element on every real page is represented somewhere in Storybook or explicitly documented) is now unblocked for the first time, since it depends on component coverage being substantially complete. The remaining gaps to close first, if a fully clean Phase 6 pass is wanted: the 4 Content components and the 6-component Layout "App shell" cluster above. Phase 7 (cleanup — consolidating duplicated patterns like `RateFrequencyControl`, `useCountdown`/`ExpiringCodeAlert`, `ProcessingStatusPage`, `DetailsTable`, retiring stale docs) should follow Phase 6, not precede it, per the master spec's own sequencing.

**Status: complete — see §15.**

---

## 15. Phase 2F — Content + Layout "App shell" component stories (2026-09-14)

Scope: the two remaining component categories identified in §14.5 — 4 Content-family components and Layout's 6-component "App shell" cluster. Completing this closes out component-level coverage entirely (bar the intentionally-excluded `QuoteModal`), which is what unblocks the master spec's Phase 6.

### 15.1 What was built

- **Content** (3 story files, 4 components): `ApplicationDocumentPreview` (3 stories, using real dummy data from `generateFormDataUpToPage("review")`), `LegalDocList` (2 stories — Terms of Use / Privacy Notice, using the real client content rather than placeholder text), and `QuickDecisionExplainer`+`QuickDecisionInfoBox`+`QuickDecisionIndicator` combined into one `Content/QuickDecision` page (3 stories) rather than 3 separate files — per this row's own long-standing recommendation ("document together as 'QuickDecision content, two surfaces'") which every prior phase had deferred without acting on.
- **Layout "App shell"** (6 components): `AppBody`, `AppFooter`, `AppMenu`, `ClientHelpBanner` were straightforward — each just needed its real prop (`client` via `getActiveClient()`, or none). `AppHeader` and `AppShell` were the two genuinely tricky ones: both determine their current page via `window.location.pathname` through a custom history-patched `useSyncExternalStore` subscription, not react-router's `useLocation()` — meaning Storybook's global `MemoryRouter` decorator (which every other story in this instance relies on) has no effect on their progress-bar/cart-badge state. Each story instead calls `window.history.pushState()` directly before rendering — the exact API `AppHeader`'s own patch listens for — to drive real page-position state. Verified with a temporary, not-committed smoke test (mount on `/coverage` with seeded coverage → assert a real `MuiLinearProgress` progress bar and a real `MuiBadge` reading "1" both appear) before relying on the technique in the final stories.

Total: 210 stories registered (up from 192 after Phase 2E), verified via `tsc -b --noEmit`, `eslint`, `npx storybook build`, and `npm run build` (the real app), all clean.

### 15.2 Inventory corrections (verified against source, not assumed)

- `ClientHelpBanner`'s `usedIn` corrected from "Home page, AppMenu" (neither true) to the real "AppHeader (renders when the active client has a support phone)," confirmed via `grep -rln "<ClientHelpBanner"` finding exactly one render site.
- `QuickDecisionExplainer`'s and `QuickDecisionInfoBox`'s `usedIn` fields corrected against grep evidence rather than repeated from the stale prior entries.

### 15.3 Component-story coverage: final status

`hasStory: true` for 56 of 57 rows in `componentInventory.ts`. The one exception, `QuoteModal`, is deliberate — confirmed dead code per the Phase 2D team decision, kept in the repository but not given a story. Every component category from the original §7 information architecture (Foundations, Layout, Forms, Navigation, Content, Feedback, Overlays, Coverage & Commerce) now has real, verified Storybook coverage.

### 15.4 Explicit non-goals for Phase 2F

- The `FormRoutePage` pattern (`RoutePage.tsx`'s de facto page template — PageShell+FormShell+PageHeader+PageNav+ProgressStep composition) was not documented as its own Storybook pattern page. It's the one item from the original Phase 1 plan (§7, "Application Page Template") that's still outstanding, since it isn't a component in `src/components` and wasn't in scope for either Phase 2E or 2F.
- No page-level flow stories were built — those remain out of scope for component-story phases, per every prior phase's same note.
- `QuoteModal` remains undocumented as a story, per the Phase 2D team decision.

### 15.5 Recommended next phase

Component-level Storybook coverage is now complete enough to begin the master spec's **Phase 6: page-by-page coverage audit** — going through every real page and verifying every visible/interactive/responsive/stateful element is either represented in Storybook or explicitly documented as page-specific (not component-shaped). Two small loose ends worth picking up alongside or before that: (1) the `FormRoutePage` pattern page noted above, since Phase 6 will repeatedly reference it as "the thing 18 of 27 pages are built from," and (2) a decision on whether the duplicated inline patterns flagged since Phase 1 (`RateFrequencyControl`, `useCountdown`/`ExpiringCodeAlert`, `ProcessingStatusPage`, `FieldRow`, `IconListItem`, `YesNoDetailList`, `DetailsTable`, `RadioSelectionGroup`) should be extracted now or left for Phase 7 cleanup, which was always the master spec's intended home for them.

---

## 16. Phase 6 — Page-by-page coverage audit (2026-09-18)

Scope: audit every route currently registered in `app/router.tsx`; verify each reusable visual, interactive, responsive, and stateful element is represented by an existing Storybook story; explicitly record behavior that is genuinely page-shaped; and close the outstanding `FormRoutePage` application-template gap. Repeated-pattern extraction remains in Phase 7, preserving the master spec's order.

### 16.1 Current route inventory (corrected)

- The current router contains **30 routed pages**, not the 27 carried forward in the Phase 1 inventory: 22 applicant/advisor routes and 8 internal documentation/admin routes.
- `FormRoutePage` has **17 page render sites**, not 18. Both corrections were made by checking `router.tsx` and current `<FormRoutePage` render sites rather than preserving the old counts.
- The complete live matrix is now in `Application Patterns / Page Coverage Audit`, backed by `src/docs/pageCoverageData.ts`. Each row records the route's composition, corresponding Storybook coverage, explicitly page-specific behavior, and disposition.

### 16.2 Application Page Template story

Added `Application Patterns / Application Page Template`, mounting the real `FormRoutePage` rather than a static facsimile:

- **Standard form page:** live client field config, react-hook-form validation, progress navigation/breadcrumbs, PageHeader, PageNav, and the composed shells.
- **Initial transition state:** the real timed `PageTransitionSkeleton` branch.
- **Standalone variant:** the no-stepper/no-shared-actions configuration used by advisor and confirmation routes.

This completes the last item from the original §7 Storybook information architecture that was neither a component story nor an explicit exclusion.

### 16.3 Audit result

- All **22 applicant/advisor routes** are covered by the new template story plus the existing component/foundation stories. Their remaining route-level orchestration is listed explicitly in the audit instead of creating brittle, misleading full-page replicas.
- All **8 internal routes** are explicitly excluded from the applicant component catalog. They are the in-app documentation/admin system itself (`InternalPageShell`, `components/docs/*`), not undocumented applicant UI; their source pages remain their executable reference.
- The audit intentionally does **not** treat the Phase 7 candidates as missing Storybook coverage. Their current surfaces are already represented; the issue is duplicated ownership, which requires refactoring rather than more stories.

### 16.4 Phase 7 handoff

Proceed with cleanup/extraction of the eight long-tracked patterns: `RateFrequencyControl`, `useCountdown` + `ExpiringCodeAlert`/`ResendCountdownRow`, `ProcessingStatusPage`, `FieldRow`/`FieldGrid`, `IconListItem`, `YesNoDetailList`, `DetailsTable`, and `RadioSelectionGroup`. Migrate `Resume`, `ResumeCode`, and `ResumeMethod` to the shared page-shell composition, and fix Profile's height grid so it collapses on mobile. Retire or clearly mark stale historical documentation after those source changes land.

### 16.5 Verification

- **214 Storybook stories** registered (up from 210 after Phase 2F): 3 Application Page Template variants plus the Page Coverage Audit.
- `npx tsc -b --noEmit`, all 91 Vitest tests, `npm run build-storybook`, and `npm run build` pass.
- Targeted ESLint passes for every Phase 6 file and the two internal-doc TypeScript fixes made while restoring the build. The full-repo `npm run lint` is not currently a clean baseline: it reports 65 pre-existing errors in unrelated application files (primarily strict `any`, Fast Refresh export, and new React hooks/compiler rules). Phase 6 does not broaden into those cleanup changes; they should be resolved or the lint configuration re-baselined in Phase 7.

---

## 17. Phase 7 — Pattern consolidation and cleanup (2026-09-18)

### 17.1 Canonical extractions

- `RateFrequencyControl` replaces the duplicated Monthly/Switch/Annual rows in `CoverageCart` and `QuoteCalculator`.
- `useCountdown`, `ExpiringCodeAlert`, and `ResendCountdownRow` replace the duplicated timer/expiry/resend engines in `Resume` and `ResumeCode`.
- `ProcessingStatusPage` replaces the near-identical DocuSign and QuickDecision processing screens.
- `FieldGrid` replaces the equal/wide responsive row copies across Membership, Eligibility, Beneficiary, Contact, and Profile.
- `IconListItem` + `YesNoDetailList` replace the three health pages' duplicated numbered yes/no/detail-list composition.
- `DetailsTable` replaces the two confirmation pages' duplicated label/value table.
- `RadioSelectionGroup` replaces the page-local beneficiary-type and resume-delivery radiogroups.

Every public extracted pattern has a live Storybook story. `componentInventory.ts` now tracks 66 rows: 65 live/storied components and the intentionally excluded dead `QuoteModal`.

### 17.2 Page migrations and correctness fixes

- `Resume`, `ResumeCode`, and `ResumeMethod` now use the shared `PageShell` + `FormShell` + `PageHeader` composition.
- Profile's member and spouse height rows now use responsive `FieldGrid` and collapse below `sm`.
- Removed an orphaned AppHeader “coverage added” snackbar state/effect that had no rendered consumer; the real Coverage-page `AppSnackbar` remains the single feedback owner.
- `DetailsTable` uses row headers (`th scope="row"`) rather than reproducing presentation-only cells.

### 17.3 Lint baseline

The repository lint configuration now ignores generated `storybook-static/` output and explicitly documents three prototype-level compatibility decisions: mixed component/helper exports, dynamic schema-driven `any` values around React Hook Form, and compiler-oriented effect/ref rules that conflict with established externally synchronized UI patterns. Genuine unused bindings, stale refs, `prefer-const` findings, and hook dependency warnings were fixed in source. `npm run lint` is clean.

### 17.4 Historical documentation

`ComponentInventory.md`, the Page Coverage Audit, and this plan now describe the canonical Phase 7 components rather than the old duplication candidates. The `Site_Components_Inventory_Tier*.md` files remain explicitly historical artifacts per §4; they are not current implementation guidance.

### 17.5 Verification

- **225 Storybook stories** registered (up from 214 after Phase 6).
- `componentInventory.ts`: **65 of 66** rows have verified story targets; the sole exception remains dead `QuoteModal`.
- `npx tsc -b --noEmit`, `npm run lint`, all 91 Vitest tests, `npm run build-storybook`, `npm run build`, and `git diff --check` pass.
- Both Vite builds retain the existing non-failing large-chunk advisory; bundle splitting is a future performance concern, not a Phase 7 correctness failure.
