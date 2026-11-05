import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Stack } from "@mui/material";
import ProductCatalog from "./ProductCatalog";
import ComponentFixture from "../../../.storybook/fixtures/ComponentFixture";
import ConfiguredProductCatalog from "../../app/sections/ConfiguredProductCatalog";
import { useCoverageState } from "../../app/useCoverageState";
import {
  ApplicationFormContext,
  useApplicationForm,
  type ApplicationFormValues,
} from "../../app/ApplicationFormContext";
import { withApplicantsApplying } from "../../utils/applicantsApplying";
import { resolveApplicationCoverage } from "../../domain/coverageRuntime";
import CoverageSelectionFeedback from "./CoverageSelectionFeedback";
import PageAlert from "../feedback/PageAlert";
import ControlledFieldRenderer from "../forms/ControlledFieldRenderer";
import CoverageScenario from "../../../.storybook/coverageScenario";
import { readSharedCatalog, type SharedCatalog } from "../../persistence/sharedCatalog";
import { coverageStoryBaseValues, coverageStoryScenarios, type CoverageStoryScenario } from "./coverageStoryScenarios";


import ProductCatalogExample from '../../../.storybook/ProductCatalogExample';

/** Interactive coverage shopping with the real useCoverageState hook and isolated application state. */
const meta = {
  id: "coverage-commerce-productcatalog",
  title: "Components/Coverage and pricing/Product selection/Product catalog",
  component: ProductCatalog,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { catalog: { position: 1 }, docs: { description: { component: "The standalone example uses explicit product inputs and local callbacks. Other examples are application integrations that exercise eligibility, pricing and selection rules." } }, layout: "padded" },
} satisfies Meta<typeof ProductCatalog>;

export default meta;

function LocalFormProvider({ children, scenario }: { children: React.ReactNode; scenario: CoverageStoryScenario }) {
  const [values, setValues] = useState<ApplicationFormValues>({ ...coverageStoryBaseValues, ...scenario.values, selectedCategoryChips: scenario.categories });
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

function ProductCatalogDemo({ scenario }: { scenario: CoverageStoryScenario }) {
  const state = useCoverageState();
  const { values, setPageValues } = useApplicationForm();
  const revealProducts = state.revealProducts;
  const [validationMessage, setValidationMessage] = useState<string | undefined>();
  useEffect(() => { if (scenario.categories.length) revealProducts(); }, [revealProducts, scenario]);

  return (
    <Stack spacing={3}>
      {scenario.editableWorkFacts && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <ControlledFieldRenderer field={{ id: 'story-work-hours', label: 'Work hours per week', inputType: 'number' }} value={String(values['hours-worked-per-week'] ?? '')} onChange={value => setPageValues({ 'hours-worked-per-week': String(value) })} />
        <ControlledFieldRenderer field={{ id: 'story-monthly-income', label: 'Average monthly income', inputType: 'number' }} value={String(values['average-monthly-income'] ?? '')} onChange={value => setPageValues({ 'average-monthly-income': String(value) })} />
      </Stack>}
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
        <ConfiguredProductCatalog
          getRateDisplay={state.getRateDisplay}
          getCoverageBehavior={(product, applicant) => resolveApplicationCoverage(product, applicant, values, state.coverages)}
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
          calculatingRateKeys={scenario.previewState === "recalculating" ? new Set(state.selectedCoverageIds.flatMap(id => (state.productApplicants[id] ?? []).map(applicant => `${id}:${applicant}`))) : state.calculatingRateKeys}
          rateFrequency={state.rateFrequency}
          frequencyCalculating={scenario.previewState === "recalculating" || state.frequencyCalculating}
          selectionCalculating={state.selectionCalculating}
          showRateFrequencyToggle={state.showRateFrequencyToggle}
          showProducts={state.showProducts}
          productsLoading={scenario.previewState === "loading" || state.productsLoading}
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
      {state.showProducts && !state.productsLoading && scenario.previewState !== 'loading' && <>
        <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={() => setValidationMessage(state.validate(values))}>Check selection requirements</Button>
        <PageAlert severity="error" message={validationMessage} />
      </>}
      <CoverageSelectionFeedback summaryOpen={state.summaryDrawerOpen} onCloseSummary={() => state.setSummaryDrawerOpen(false)} addedOpen={state.addedSnackbarOpen} onCloseAdded={() => state.setAddedSnackbarOpen(false)} />
    </Stack>
  );
}

function ScenarioExample({ scenario, catalog, storyId }: { scenario: CoverageStoryScenario; catalog: SharedCatalog; storyId: string }) {
  return <CoverageScenario key={storyId} scenario={scenario} catalog={catalog}>
    <LocalFormProvider scenario={scenario}><ProductCatalogDemo scenario={scenario} /></LocalFormProvider>
  </CoverageScenario>;
}

export const Interactive: StoryObj = { name: 'Standalone product reveal', parameters: { standalone: true }, render: () => <ComponentFixture>{fixture => <ProductCatalogExample fixture={fixture} />}</ComponentFixture> };
export const FirstProductFromEmptyCart: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.firstProduct} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const AdditionalProductWithExistingCart: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.additionalProduct} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const AddAfterClearingCart: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.addAfterClearingCart} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const DisabilityBelowWorkHours: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.diWorkHours} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const DisabilityMissingWorkHours: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.missingWorkHours} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const DisabilityMissingIncome: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.missingIncome} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const MixedEligibleAndIneligibleCategories: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.mixedEligibility} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const MutuallyExclusiveProductSelected: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.mutuallyExclusive} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const RestoredMutuallyExclusiveConflict: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.restoredConflict} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const SpouseNotEligible: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.spouseIneligible} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const SelectedWaitingAndBenefitPeriods: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.selectedOptions} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const ApplicantRiderOptions: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.riders} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const RiderOnlyWithZeroBaseCoverage: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.riderOnly} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const SelectedProductEstimateUnavailable: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.rateUnavailable} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const ReferenceRateTable: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.referenceRates} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const UnresolvedProductRequirements: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.unresolvedRequirements} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const NoCategorySelected: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.noCategory} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };

export const ProductsLoading: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.loading} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
export const SelectedProductRecalculating: StoryObj = { render: (_args, context) => <ScenarioExample scenario={coverageStoryScenarios.recalculating} catalog={context.loaded.catalog as SharedCatalog} storyId={context.id} /> };
