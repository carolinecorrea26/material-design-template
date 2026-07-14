# Component Inventory

Source snapshot reviewed: `src(2).zip`

## Purpose

This inventory documents the current component structure before moving or refactoring files. It is intended to support a safe, incremental cleanup for developer handoff and Storybook documentation.

No files should be moved based on this document alone. Use this as the review baseline, then move a small set of obvious files at a time.

## Classification key

| Classification | Meaning |
|---|---|
| Generic reusable UI | Reusable UI pattern that is not tied to a specific product/page/business flow. |
| App shell/chrome | Outer application frame such as header, body, footer, global banners, or shell wrapper. |
| Form pattern | Reusable form-rendering, form-section, conditional, or field-list pattern. |
| Content/help pattern | Reusable pattern for displaying help, notes, informational content, or supporting text. |
| Feedback/status pattern | UI that communicates status, validation, success, warning, loading, or empty states. |
| Overlay pattern | UI that opens above/outside the normal page flow, such as drawers, dialogs, modals, and previews. |
| Feature-level/application-specific | Composite UI or state tied to this prototype's application flow or insurance-specific behavior. |
| Routing/application-flow logic | Route/page controller logic, form progression, validation, autosave, and page flow orchestration. |
| Needs review | Do not move yet. The file needs a boundary decision before relocation. |

## Current component folders

| Current folder | Current status | Notes |
|---|---|---|
| `src/components/common` | Empty target folder | Contains `.gitkeep`. No current components. |
| `src/components/content` | Empty target folder | Contains `.gitkeep`. Intended for reusable content display patterns. |
| `src/components/coverage` | Existing populated folder | Current app-specific coverage/quote components. Do not move in the first generic cleanup pass. |
| `src/components/feedback` | Empty target folder | Contains `.gitkeep`. Intended for alerts/status/validation/empty/loading patterns. |
| `src/components/fields` | Existing populated folder | Current reusable form field and form-section patterns. Strong candidate to become `components/forms`. |
| `src/components/forms` | Empty target folder | Contains `.gitkeep`. Intended destination for reusable form patterns. |
| `src/components/help` | Existing populated folder | Current reusable help-chip/help-drawer/help-panel system. Likely split between `content` and `overlays`, but review before moving. |
| `src/components/layout` | Empty target folder | Contains `.gitkeep`. Intended for page/page-section/layout wrappers. |
| `src/components/overlays` | Existing populated folder | Contains overlay components, but several are feature-level rather than generic overlay primitives. |
| `src/components/page` | Existing populated folder | Mixed folder: layout components, form-section component, stepper/breadcrumbs, and route-flow controller. Should be split carefully. |
| `src/components/shell` | Existing populated folder | App shell/chrome. Current folder name is generic and reasonable; do not move in the first pass. |

## Detailed inventory

### `src/components/coverage`

| File | What it does | Classification | Suggested future destination | Reason |
|---|---|---|---|---|
| `CoverageQuestions.tsx` | Renders coverage-page follow-up questions based on selected coverage categories, applicant visibility, client coverage question mappings, and section visibility rules. Uses `FieldRenderer`, `ApplicantSection`, and `ConditionalGroup`. | Feature-level/application-specific | Needs review | This is tied to coverage selection behavior and form-flow data. It is not a generic component. Do not move until feature boundaries are decided. |
| `EstimatedCostPanel.tsx` | Displays selected coverage totals, per-product estimated cost rows, loading/calculating states, and a monthly/annual rate-frequency switch. | Feature-level/application-specific; feedback/status elements inside | Needs review | It is a coverage/cart summary panel, not a generic panel yet. Could later be decomposed into generic `Panel`, `EmptyState`, or `StatusBadge` patterns, but not in the first pass. |
| `ProductCatalog.tsx` | Displays eligible coverage categories/products, applicant selection, benefit amounts, riders, waiting/max benefit period controls, QuickDecision info, aggregate notes, and estimated cost panel. | Feature-level/application-specific | Needs review | Large composite coverage-selection feature. Keep out of generic `components` until a `features` boundary is intentionally designed. |
| `QuickDecisionBadge.tsx` | Renders the QuickDecision icon indicator. | Feedback/status pattern, but app-specific label/icon | Needs review | Small status indicator, but the meaning is product-specific. Could eventually become a generic badge/status component if generalized. |
| `QuoteCard.tsx` | Landing-page quote tool with stored estimate values, category selection, eligibility/estimate inputs, quote calculation, and comparison modal behavior. | Feature-level/application-specific | Needs review | Large composite quote feature. Do not move in the generic component cleanup pass. |
| `useCoverageState.ts` | Hook/helper for coverage selection state, benefit amounts, riders, waiting periods, selected applicants, premium calculations, and displayed premium frequency. | Feature-level/application-specific logic | Needs review | This is business/application state logic, not a UI component. It may eventually belong under a feature or utility area, but requires a feature-boundary decision first. |

### `src/components/fields`

| File | What it does | Classification | Suggested future destination | Reason |
|---|---|---|---|---|
| `ApplicantSection.tsx` | Wraps applicant-specific sections with an optional applicant label banner and optional info note. | Form pattern | `src/components/forms/ApplicantSection.tsx` | Reusable form-section pattern. Also contains repeated section-banner styling that may later be extracted. |
| `ConditionalGroup.tsx` | Wraps conditional/follow-up questions with a left primary border and inset spacing. | Form pattern | `src/components/forms/ConditionalGroup.tsx` | Generic conditional form-group display pattern. |
| `DynamicList.tsx` | Reusable add/edit/remove list component using `react-hook-form`, a dialog form, `FieldRenderer`, and `DynamicListItem`. | Form pattern; overlay behavior inside | `src/components/forms/DynamicList.tsx` | Generic dynamic form-list pattern. Contains dialog behavior, but the primary purpose is a form pattern. |
| `DynamicListItem.tsx` | Renders a list item surface with edit/remove actions. | Form pattern | `src/components/forms/DynamicListItem.tsx` | Generic reusable item row used by dynamic list patterns. |
| `FieldRenderer.tsx` | Main field-rendering engine for configured fields. Handles text, date, select, autocomplete, checkbox, checkbox group, radio, toggle, multi-select, SSN masking, validation, formatting, labels, and completion/error indicators. | Form pattern | `src/components/forms/FieldRenderer.tsx` | Core reusable form renderer driven by field configuration. Strong candidate for Storybook documentation later. |
| `OptionRow.tsx` | Label-like selectable surface used around checkbox/radio option content. | Form pattern; generic reusable UI | `src/components/forms/OptionRow.tsx` | Reusable selectable form-row pattern. Could later use a generic `SelectableSurface` primitive if repeated elsewhere. |

### `src/components/help`

| File | What it does | Classification | Suggested future destination | Reason |
|---|---|---|---|---|
| `Chips.tsx` | Displays horizontally scrollable help chips with overflow fade and click handling. | Content/help pattern | `src/components/content/FormHelpChips.tsx` or keep until help split | Reusable help-content trigger pattern. The component is content/help, not business-specific. Rename only if the team wants clearer names. |
| `Drawer.tsx` | Responsive help drawer; right-side drawer on desktop and bottom drawer on smaller screens. | Overlay pattern | `src/components/overlays/FormHelpDrawer.tsx` or keep until help split | It is a reusable overlay wrapper for help content. Move only when imports can be updated safely. |
| `Panel.tsx` | Composes optional intro content, help chips, active help item state, and help drawer. | Content/help pattern with overlay composition | `src/components/content/FormPageHelp.tsx` or keep until help split | This is a reusable page-help pattern, but it composes an overlay. Move after deciding whether to split `Chips`, `Drawer`, and `Panel` together. |

### `src/components/overlays`

| File | What it does | Classification | Suggested future destination | Reason |
|---|---|---|---|---|
| `ApplicationSummary.tsx` | Application/cart summary drawer with selected coverage, applicants, riders, premium estimates, edit/remove actions, confirmation dialog, route navigation, and badge count hook. | Overlay pattern; feature-level/application-specific | Needs review | Overlay UI, but tightly tied to application coverage data and routing. Do not move in generic cleanup. |
| `CostEstimate.tsx` | Drawer content for coverage estimate flow with category selection, validation, amount selection, loading/calculating states, and estimated premiums. | Feature-level/application-specific | Needs review | Not a generic cost-estimate component. It is an application-specific quote/coverage feature. |
| `CoverageCalculator.tsx` | Simple life insurance coverage needs calculator using income, years, debts, and existing coverage inputs. | Feature-level/application-specific; could be overlay content | Needs review | It is reusable as content inside an overlay, but domain-specific. Keep until feature/content boundaries are decided. |
| `DocumentPreview.tsx` | Builds and renders an application document preview from form values, field catalog, page sections, coverage selections, beneficiaries, review consent, and signature info. | Overlay pattern; feature-level/application-specific | Needs review | It is a preview component, but heavily tied to application data/sections. Do not treat as a generic overlay primitive. |
| `QuickDecisionInfo.tsx` | Renders QuickDecision explanatory drawer content and exports `QuickDecisionMark` text/superscript mark. | Content/help pattern; feature-level/application-specific | Needs review | Mostly content display, but product-specific. Could later live near related feature/content, not generic components. |
| `QuoteComparison.tsx` | Modal quote comparison flow with category/product selection, validation, amount choices, rate frequency switch, quote estimates, and navigation into application. | Overlay pattern; feature-level/application-specific | Needs review | It is a modal, but the logic is quote/coverage-specific. Do not move in generic cleanup. |

### `src/components/page`

| File | What it does | Classification | Suggested future destination | Reason |
|---|---|---|---|---|
| `Page.tsx` | Generic page wrapper with title/subhead/help/error/actions slots and centered max-width content layout. | Generic reusable UI; layout pattern | `src/components/layout/Page.tsx` | Clear generic layout wrapper. Safe candidate for a later small move. |
| `RoutePage.tsx` | Large route-level form controller. Loads fields/sections/content, initializes `react-hook-form`, merges stored values, evaluates visibility, handles validation, autosave messages, dev-fill behavior, progress snapshots, back/next navigation, and renders page content. | Routing/application-flow logic | Needs review | Not layout. Not a generic component. Keep in place until an intentional `app` or `features/application-flow` destination is chosen. |
| `SectionTitle.tsx` | Renders applicant-based form section title banner or custom section title with optional icon. Uses `formSectionTitle` config. | Form pattern | `src/components/forms/SectionTitle.tsx` | Form-section title pattern, not generic page layout. Contains repeated banner styling also seen in `ApplicantSection`. |
| `Stepper.tsx` | Renders vertical stepper and breadcrumb navigation based on active progress steps, page IDs, application values, and pending breadcrumb completion event. | Navigation/progress pattern with application-flow coupling | Needs review | It is navigation/progress UI, but tied to page IDs, progress config, and app form values. Could move later, but not before deciding whether it belongs in `components/navigation` or application-flow feature. |
| `Title.tsx` | Renders page title, optional subhead, and optional back icon button. | Generic reusable UI; layout pattern | `src/components/layout/Title.tsx` or `src/components/layout/PageTitle.tsx` | Clear page-title layout pattern. Safe candidate for a later small move/rename if desired. |

### `src/components/shell`

| File | What it does | Classification | Suggested future destination | Reason |
|---|---|---|---|---|
| `App.tsx` | App shell wrapper that loads active client, controls cookie banner state, and composes header, body, footer, dev tools, and cookie banner. | App shell/chrome | Keep in `src/components/shell` for now | `shell` is a generic and accurate folder for app chrome. No need to move in first cleanup. |
| `Body.tsx` | Main content wrapper with max width, responsive padding, scroll-to-top on route change, and history/location event patching. | App shell/chrome; layout behavior | Keep in `src/components/shell` for now | It is part of the app shell. Could later be split if location-change utilities are centralized, but not needed now. |
| `CookieBanner.tsx` | Fixed cookie notice banner with close button, logo, privacy link, and dark alert styling. | Feedback/status pattern; app shell/chrome | Keep in `src/components/shell` for now; possible future `components/feedback` | It behaves like feedback, but is owned by the shell. Move only if shell is intentionally split later. |
| `Footer.tsx` | Footer app chrome with administered-by info, support contact methods, underwritten-by content, legal links/modal content, licensing, logos/ratings. | App shell/chrome; content display | Keep in `src/components/shell` | Footer is app chrome, not navigation. Current folder is appropriate. |
| `Header.tsx` | Header app chrome with logo, menu, progress, coverage summary drawer, quote/help/calculator drawers, support/contact content, and mobile/desktop header behavior. | App shell/chrome with overlay/navigation responsibilities | Keep in `src/components/shell`; needs review before any split | Large mixed shell component. Do not move based on name alone. It may later be decomposed, but that is not a first-pass folder move. |

## Empty target folders

These folders exist as targets but currently contain only `.gitkeep`:

- `src/components/common`
- `src/components/content`
- `src/components/feedback`
- `src/components/forms`
- `src/components/layout`
- `src/features`
- `src/app/providers`
- `src/utils/formatting`
- `src/utils/rules`
- `src/utils/data`

## Files marked `needs review`

These files should not be moved yet without a separate feature-boundary decision:

- `src/components/coverage/CoverageQuestions.tsx`
- `src/components/coverage/EstimatedCostPanel.tsx`
- `src/components/coverage/ProductCatalog.tsx`
- `src/components/coverage/QuickDecisionBadge.tsx`
- `src/components/coverage/QuoteCard.tsx`
- `src/components/coverage/useCoverageState.ts`
- `src/components/overlays/ApplicationSummary.tsx`
- `src/components/overlays/CostEstimate.tsx`
- `src/components/overlays/CoverageCalculator.tsx`
- `src/components/overlays/DocumentPreview.tsx`
- `src/components/overlays/QuickDecisionInfo.tsx`
- `src/components/overlays/QuoteComparison.tsx`
- `src/components/page/RoutePage.tsx`
- `src/components/page/Stepper.tsx`
- `src/components/shell/Header.tsx`

## Obvious first-pass candidates

These are the safest candidates for a later small move because their role is clear and generic:

| Current file | Candidate destination |
|---|---|
| `src/components/fields/ApplicantSection.tsx` | `src/components/forms/ApplicantSection.tsx` |
| `src/components/fields/ConditionalGroup.tsx` | `src/components/forms/ConditionalGroup.tsx` |
| `src/components/fields/DynamicList.tsx` | `src/components/forms/DynamicList.tsx` |
| `src/components/fields/DynamicListItem.tsx` | `src/components/forms/DynamicListItem.tsx` |
| `src/components/fields/FieldRenderer.tsx` | `src/components/forms/FieldRenderer.tsx` |
| `src/components/fields/OptionRow.tsx` | `src/components/forms/OptionRow.tsx` |
| `src/components/page/SectionTitle.tsx` | `src/components/forms/SectionTitle.tsx` |
| `src/components/page/Page.tsx` | `src/components/layout/Page.tsx` |
| `src/components/page/Title.tsx` | `src/components/layout/Title.tsx` or `src/components/layout/PageTitle.tsx` |

## Recommended next step

Do not move everything at once.

Recommended next commit after this inventory:

1. Move only `src/components/fields/*` to `src/components/forms/*`.
2. Update imports.
3. Run the app.
4. Run Storybook.
5. Commit if clean.

Suggested commit message:

```text
refactor: move reusable field components to forms
```
