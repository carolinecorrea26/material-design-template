import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, Button, Stack, Typography } from "@mui/material";
import ProductCatalog from "./ProductCatalog";
import CoverageCategorySelector from "./CoverageCategorySelector";
import { useCoverageState } from "../../app/useCoverageState";
import {
  ApplicationFormContext,
  type ApplicationFormValues,
} from "../../app/ApplicationFormContext";
import { withApplicantsApplying } from "../../utils/applicantsApplying";
import { coverageCategories } from "../../config/coverageCategories";

/**
 * ProductCatalog is the main coverage-shopping surface: category sections →
 * product cards → an inline CoverageCart at the end. It has no props of its
 * own state machine — everything (selected categories, revealed/loading
 * products, rate frequency, per-product amounts/riders, the running total)
 * comes from useCoverageState(), the same hook the real Coverage page uses.
 * Rather than fabricate 25+ props by hand, this story calls that real hook
 * inside a locally-scoped ApplicationFormContext (isolated from the app's
 * own sessionStorage-backed values, so this story never leaks state into or
 * out of the running app), and drives it through the same real interactions
 * a user would: pick a category, then reveal products. Every price, product
 * name, and eligibility rule shown is the real client config, not mocked
 * data — this is intentionally the least "fake" story in the whole
 * Storybook instance.
 */
const meta = {
  title: "Coverage & Commerce/ProductCatalog",
  component: ProductCatalog,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ProductCatalog>;

export default meta;

function LocalFormProvider({ children }: { children: React.ReactNode }) {
  const [values, setValues] = useState<ApplicationFormValues>({});
  return (
    <ApplicationFormContext.Provider
      value={{
        values,
        setPageValues: (pageValues) =>
          setValues(
            (current) =>
              withApplicantsApplying({
                ...current,
                ...pageValues,
              }) as ApplicationFormValues,
          ),
        resetValues: () => setValues({}),
      }}
    >
      {children}
    </ApplicationFormContext.Provider>
  );
}

function ProductCatalogDemo() {
  const state = useCoverageState();

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        This is the real useCoverageState() hook driving the real
        ProductCatalog component — select a category below, then reveal
        products. Rate frequency, amount pickers, and "Add coverage" are all
        live.
      </Alert>

      <CoverageCategorySelector
        categories={coverageCategories}
        selectedIds={state.selectedCategories}
        onToggle={state.handleCategoryToggle}
      />

      {state.selectedCategories.length > 0 && !state.showProducts && (
        <Button
          variant="contained"
          onClick={() => state.revealProducts()}
          sx={{ alignSelf: "flex-start" }}
        >
          See my coverage options
        </Button>
      )}

      {state.showProducts && (
        <ProductCatalog
          availableCategories={state.availableCategories}
          selectedCategories={state.selectedCategories}
          categoryProducts={state.categoryProducts}
          categoryEligibility={state.categoryEligibility}
          allCategoriesIneligible={state.allCategoriesIneligible}
          hasQdCategorySelected={state.hasQdCategorySelected}
          selectedCoverageIds={state.selectedCoverageIds}
          productApplicants={state.productApplicants}
          storedAmounts={state.storedAmounts}
          storedRiders={state.storedRiders}
          storedRiderAmounts={state.storedRiderAmounts}
          storedWaitingPeriods={state.storedWaitingPeriods}
          storedMaxBenefitPeriods={state.storedMaxBenefitPeriods}
          calculatingRateKeys={state.calculatingRateKeys}
          rateFrequency={state.rateFrequency}
          frequencyCalculating={state.frequencyCalculating}
          selectionCalculating={state.selectionCalculating}
          showRateFrequencyToggle={state.showRateFrequencyToggle}
          showProducts={state.showProducts}
          productsLoading={state.productsLoading}
          grandTotal={state.grandTotal}
          activeClient={state.activeClient}
          onToggleApplicant={state.toggleApplicantForProduct}
          onAmountChange={state.handleAmountChange}
          onFrequencyToggle={state.handleFrequencyToggle}
          onRiderToggle={state.handleRiderToggle}
          onRiderAmountChange={state.handleRiderAmountChange}
          onWaitingPeriodChange={state.handleWaitingPeriodChange}
          onMaxBenefitPeriodChange={state.handleMaxBenefitPeriodChange}
          getVisibleApplicants={state.getVisibleApplicants}
          calcApplicantPremium={state.calcApplicantPremium}
          generateAmountChoices={state.generateAmountChoices}
          hasSpouse={state.hasSpouse}
        />
      )}
    </Stack>
  );
}

export const Interactive: StoryObj = {
  render: () => (
    <LocalFormProvider>
      <ProductCatalogDemo />
    </LocalFormProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Revealing products always shows a ~2 second loading state first (the real RATE_CALCULATION_DELAY_MS), not a mocked-away instant transition — that's the actual behavior a user sees.",
      },
    },
  },
};

export const NoCategorySelected: StoryObj = {
  name: "Empty state (nothing selected yet)",
  render: () => (
    <LocalFormProvider>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Before any category is selected, ProductCatalog itself never
          mounts — the Coverage page shows only CoverageCategorySelector.
        </Typography>
        <CoverageCategorySelector
          categories={coverageCategories}
          selectedIds={[]}
          onToggle={() => {}}
        />
      </Stack>
    </LocalFormProvider>
  ),
};
