# Component Inventory

Source snapshot reviewed: `src(2).zip`

## Purpose

This inventory documents the current component structure before moving or refactoring files. It is intended to support a safe, incremental cleanup for developer handoff and Storybook documentation.

No files should be moved based on this document alone. Use this as the review baseline, then move a small set of obvious files at a time.

## Classification key

| Classification                     | Meaning                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| Generic reusable UI                | Reusable UI pattern that is not tied to a specific product/page/business flow.                    |
| App shell/chrome                   | Outer application frame such as header, body, footer, global banners, or shell wrapper.           |
| Form pattern                       | Reusable form-rendering, form-section, conditional, or field-list pattern.                        |
| Content/help pattern               | Reusable pattern for displaying help, notes, informational content, or supporting text.           |
| Feedback/status pattern            | UI that communicates status, validation, success, warning, loading, or empty states.              |
| Overlay pattern                    | UI that opens above/outside the normal page flow, such as drawers, dialogs, modals, and previews. |
| Feature-level/application-specific | Composite UI or state tied to this prototype's application flow or insurance-specific behavior.   |
| Routing/application-flow logic     | Route/page controller logic, form progression, validation, autosave, and page flow orchestration. |
| Needs review                       | Do not move yet. The file needs a boundary decision before relocation.                            |

## Current component folders

| Current folder              | Status    | Contents                                                                                                                                                              |
| --------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/common`     | Populated | `CoverageCategoryChips`, `CostSummaryPanel`, `QuickDecisionIndicator`, `RateFrequencyToggle`, `FeaturedBadge`                                                         |
| `src/components/content`    | Populated | `HelpChips`, `HelpPanel`, `QuickDecisionExplainer`                                                                                                                    |
| `src/components/feedback`   | Empty     | `.gitkeep` placeholder for future alerts/status/validation patterns                                                                                                   |
| `src/components/forms`      | Populated | `ApplicantSection`, `CategoryQuestionFields`, `ConditionalGroup`, `DynamicList`, `DynamicListItem`, `FieldRenderer`, `OptionRow`, `SectionTitle`                      |
| `src/components/layout`     | Populated | `Page`, `Title`                                                                                                                                                       |
| `src/components/navigation` | Populated | `Stepper`                                                                                                                                                             |
| `src/components/overlays`   | Populated | `CostEstimateDrawer`, `CoverageCalculator`, `CoverageProductList`, `CoverageSummaryDrawer`, `DocumentPreview`, `HelpDrawer`, `HomeQuoteEntry`, `QuoteComparisonModal` |
| `src/components/shell`      | Populated | `AppShell`, `Body`, `CookieBanner`, `Footer`, `Header`                                                                                                                |
| `src/app`                   | Populated | `App`, `ApplicationFormContext`, `RoutePage`, `router`, `theme`, `useCoverageState`                                                                                   |

## Removed folders

- `src/components/fields/` — dissolved into `forms/`
- `src/components/help/` — split into `content/` and `overlays/`
- `src/components/page/` — split into `app/`, `layout/`, and `navigation/`
- `src/components/coverage/` — dissolved into `common/`, `forms/`, `overlays/`, and `app/`

## Shared utilities extracted

| Utility                                       | Location                           | Purpose                                                                        |
| --------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `getCategoryRequirements(selectedCategories)` | `src/config/coverageConstants.ts`  | Shared logic for which additional fields are needed by coverage category.      |
| `getBenefitAmountLabel(categoryId)`           | `src/config/coverageConstants.ts`  | Returns "Benefit amount" or "Monthly benefit amount" by category.              |
| `formatCurrencyInput(value)`                  | `src/utils/formatting/currency.ts` | Formats raw digits as currency display string. Extracted from duplicated code. |

## All completed moves and renames

| Original file                                | New location                                        | Status  |
| -------------------------------------------- | --------------------------------------------------- | ------- |
| `src/components/fields/ApplicantSection.tsx` | `src/components/forms/ApplicantSection.tsx`         | ✅ Done |
| `src/components/fields/ConditionalGroup.tsx` | `src/components/forms/ConditionalGroup.tsx`         | ✅ Done |
| `src/components/fields/DynamicList.tsx`      | `src/components/forms/DynamicList.tsx`              | ✅ Done |
| `src/components/fields/DynamicListItem.tsx`  | `src/components/forms/DynamicListItem.tsx`          | ✅ Done |
| `src/components/fields/FieldRenderer.tsx`    | `src/components/forms/FieldRenderer.tsx`            | ✅ Done |
| `src/components/fields/OptionRow.tsx`        | `src/components/forms/OptionRow.tsx`                | ✅ Done |
| `src/components/page/SectionTitle.tsx`       | `src/components/forms/SectionTitle.tsx`             | ✅ Done |
| `src/components/page/Page.tsx`               | `src/components/layout/Page.tsx`                    | ✅ Done |
| `src/components/page/Title.tsx`              | `src/components/layout/Title.tsx`                   | ✅ Done |
| `src/components/help/Chips.tsx`              | `src/components/content/HelpChips.tsx`              | ✅ Done |
| `src/components/help/Panel.tsx`              | `src/components/content/HelpPanel.tsx`              | ✅ Done |
| `src/components/help/Drawer.tsx`             | `src/components/overlays/HelpDrawer.tsx`            | ✅ Done |
| `src/components/page/RoutePage.tsx`          | `src/app/RoutePage.tsx`                             | ✅ Done |
| `src/components/page/Stepper.tsx`            | `src/components/navigation/Stepper.tsx`             | ✅ Done |
| `src/components/coverage/QuoteCard.tsx`      | `src/components/overlays/HomeQuoteEntry.tsx`        | ✅ Done |
| `src/components/coverage/QuickDecisionBadge` | `src/components/common/QuickDecisionIndicator.tsx`  | ✅ Done |
| `src/components/coverage/EstimatedCostPanel` | `src/components/common/CostSummaryPanel.tsx`        | ✅ Done |
| `src/components/coverage/CoverageQuestions`  | `src/components/forms/CategoryQuestionFields.tsx`   | ✅ Done |
| `src/components/coverage/ProductCatalog`     | `src/components/overlays/CoverageProductList.tsx`   | ✅ Done |
| `src/components/coverage/useCoverageState`   | `src/app/useCoverageState.ts`                       | ✅ Done |
| `src/components/shell/App.tsx`               | `src/components/shell/AppShell.tsx`                 | ✅ Done |
| `src/components/overlays/QuickDecisionInfo`  | `src/components/content/QuickDecisionExplainer.tsx` | ✅ Done |
| `src/components/overlays/QuoteComparison`    | `src/components/overlays/QuoteComparisonModal.tsx`  | ✅ Done |
| `src/components/overlays/CostEstimate`       | `src/components/overlays/CostEstimateDrawer.tsx`    | ✅ Done |
| `src/components/overlays/ApplicationSummary` | `src/components/overlays/CoverageSummaryDrawer.tsx` | ✅ Done |

## New shared components extracted

| Component               | Location  | Extracted from                                              |
| ----------------------- | --------- | ----------------------------------------------------------- |
| `CoverageCategoryChips` | `common/` | CostEstimateDrawer, QuoteComparisonModal                    |
| `RateFrequencyToggle`   | `common/` | EstimatedCostPanel → CostSummaryPanel, QuoteComparisonModal |
| `FeaturedBadge`         | `common/` | ProductCatalog, CostEstimateDrawer, QuoteComparisonModal    |

## Code cleanup completed

| File                       | Change                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HomeQuoteEntry.tsx`       | Removed `testQuote` single mode (1340 → 267 lines). Only uses QuoteComparisonModal.                                                                     |
| `CostEstimateDrawer.tsx`   | Uses shared `getCategoryRequirements`, `getBenefitAmountLabel`, `CoverageCategoryChips`, `FeaturedBadge`, `formatCurrencyInput`.                        |
| `QuoteComparisonModal.tsx` | Uses shared `getCategoryRequirements`, `getBenefitAmountLabel`, `CoverageCategoryChips`, `RateFrequencyToggle`, `FeaturedBadge`, `formatCurrencyInput`. |
| `CostSummaryPanel.tsx`     | Uses shared `RateFrequencyToggle`.                                                                                                                      |
| `CoverageProductList.tsx`  | Uses shared `FeaturedBadge`.                                                                                                                            |

## Recommended next step

Proceed to Step 5 (styling cleanup) or Step 6 (Storybook stories for stable generic patterns).
