import { useCallback, useRef, useState } from "react";
import { Box, Button, Divider, Stack } from "@mui/material";
import PageAlert from "../components/feedback/PageAlert";
import CoverageCategorySelector from "../components/forms/CoverageCategorySelector";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FormRoutePage from "../app/RoutePage";

import AppDrawer from "../components/layout/AppDrawer";
import FormHelpChips from "../components/content/HelpChips";
import QuickDecisionDrawerContent from "../components/content/QuickDecisionExplainer";
import { QuickDecisionMark } from "../components/content/QuickDecisionExplainer";
import CoverageCart from "../components/ui/CoverageCart";
import CoverageQuestions from "../components/forms/CoverageQuestions";
import ProductCatalog from "../components/forms/ProductCatalog";
import { useCoverageState } from "../app/useCoverageState";

export default function Coverage() {
  const state = useCoverageState();

  const helpItems: {
    id: string;
    label: string;
    title: React.ReactNode;
    content: React.ReactNode;
  }[] = [];

  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const activeHelpItem =
    helpItems.find((item) => item.id === activeHelpId) ?? null;

  return (
    <FormRoutePage
      pageId="coverage"
      validate={state.validate}
      help={
        <>
          <FormHelpChips items={helpItems} onSelect={setActiveHelpId} />
          <AppDrawer
            open={!!activeHelpItem}
            title={activeHelpItem?.title ?? ""}
            onClose={() => setActiveHelpId(null)}
          >
            {activeHelpItem?.content}
          </AppDrawer>
        </>
      }
      hideNextButton={() =>
        // Hide Next while products are loading
        (state.showProducts && state.productsLoading) ||
        // Hide Next when "See my coverage options" button is visible
        (state.selectedCategories.length > 0 &&
          !state.showProducts &&
          state.needsAdditionalQuestions)
      }
    >
      {({
        control,
        errors,
        watchedValues,
        allFields,
        pageSections,
        trigger,
      }) => (
        <CoveragePageContent
          control={control}
          errors={errors}
          watchedValues={watchedValues}
          allFields={allFields}
          pageSections={pageSections}
          trigger={trigger}
          state={state}
        />
      )}
    </FormRoutePage>
  );
}

function CoveragePageContent({
  control,
  errors,
  watchedValues,
  allFields,
  pageSections,
  trigger,
  state,
}: {
  control: any;
  errors: any;
  watchedValues: any;
  allFields: any[];
  pageSections: any[];
  trigger: () => Promise<boolean>;
  state: ReturnType<typeof useCoverageState>;
}) {
  // Use a ref so the callback always has the latest showProducts value
  const showProductsRef = useRef(state.showProducts);
  showProductsRef.current = state.showProducts;
  const [pageError, setPageError] = useState<string | null>(null);

  const handleCoverageQuestionChange = useCallback(() => {
    if (showProductsRef.current) {
      state.setShowProducts(false);
    }
    setPageError(null);
  }, [state.setShowProducts]);

  return (
    <>
      {/* Section 1: Category chips + coverage questions */}
      <PageAlert severity="error" message={pageError ?? undefined} />
      <Stack spacing={3}>
        {/* Category selection (multi-select) */}
        <CoverageCategorySelector
          categories={state.availableCategories}
          selectedIds={state.selectedCategories}
          onToggle={state.handleCategoryToggle}
          error={state.selectedCategories.length === 0 && !!pageError}
          errorMessage="Please select at least one coverage category."
        />

        {/* Category-level question fields */}
        <CoverageQuestions
          control={control}
          errors={errors}
          watchedValues={watchedValues}
          allFields={allFields}
          pageSections={pageSections}
          selectedCategories={state.selectedCategories}
          categoryNeedsGender={state.categoryNeedsGender}
          categoryNeedsSmoker={state.categoryNeedsSmoker}
          categoryNeedsDi={state.categoryNeedsDi}
          categoryNeedsOo={state.categoryNeedsOo}
          categoryNeedsHours={state.categoryNeedsHours}
          hasSpouse={state.hasSpouse}
          onFieldChange={handleCoverageQuestionChange}
          coverageQuestions={state.clientCoverageQuestions}
        />
      </Stack>

      {/* Divider between coverage questions and products */}
      {state.selectedCategories.length > 0 && state.showProducts && (
        <Divider sx={{ my: 4 }} />
      )}

      {/* Section 2: Product catalog with estimated cost sidebar */}
      {state.selectedCategories.length > 0 && state.showProducts && (
        <Box>
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
            onQdDrawerOpen={() => state.setQdDrawerOpen(true)}
            getVisibleApplicants={state.getVisibleApplicants}
            calcApplicantPremium={state.calcApplicantPremium}
            generateAmountChoices={state.generateAmountChoices}
            hasSpouse={state.hasSpouse}
          />
        </Box>
      )}

      {/* "See my coverage options" button */}
      {state.selectedCategories.length > 0 &&
        !state.showProducts &&
        state.needsAdditionalQuestions && (
          <Box sx={{ mt: "2rem", mb: "1rem" }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={async () => {
                const isValid = await trigger();
                if (!isValid) {
                  setPageError(
                    "Please correct the errors below before continuing.",
                  );
                  // Scroll to first invalid field
                  requestAnimationFrame(() => {
                    const firstErrorField = document.querySelector(
                      '[aria-invalid="true"], .Mui-error input, .Mui-error textarea, .Mui-error .MuiSelect-select',
                    );
                    if (firstErrorField) {
                      firstErrorField.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  });
                  return;
                }
                setPageError(null);
                // Save current form answers to context before revealing products,
                // so the RoutePage reset effect doesn't clobber them.
                state.setPageValues(watchedValues as Record<string, any>);
                state.revealProducts();
              }}
              endIcon={<ArrowForwardRoundedIcon />}
            >
              See my coverage options
            </Button>
          </Box>
        )}

      <AppDrawer
        open={state.qdDrawerOpen}
        title={
          <>
            What is <QuickDecisionMark />?
          </>
        }
        onClose={() => state.setQdDrawerOpen(false)}
      >
        <QuickDecisionDrawerContent />
      </AppDrawer>

      <AppDrawer
        open={state.summaryDrawerOpen}
        onClose={() => state.setSummaryDrawerOpen(false)}
        swipeable
      >
        <CoverageCart
          variant="drawer"
          source="coverage-page"
          onClose={() => state.setSummaryDrawerOpen(false)}
        />
      </AppDrawer>
    </>
  );
}
