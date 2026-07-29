import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Stack,
  Typography,
} from "@mui/material";
import SelectionGroup from "../components/forms/SelectionGroup";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FormRoutePage from "../app/RoutePage";

import AppDrawer from "../components/ui/AppDrawer";
import FormHelpChips from "../components/content/HelpChips";
import QuickDecisionDrawerContent from "../components/content/QuickDecisionExplainer";
import { QuickDecisionMark } from "../components/content/QuickDecisionExplainer";
import CoverageSummary from "../components/CoverageSummary";
import CoverageQuestions from "../components/forms/CoverageQuestions";
import ProductCatalog from "../components/ProductCatalog";
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
      {pageError && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" sx={{ width: "100%" }}>
            {pageError}
          </Alert>
        </Box>
      )}
      <Stack spacing={3}>
        {/* Category selection (multi-select) */}
        <FormControl
          component="fieldset"
          error={state.selectedCategories.length === 0 && !!pageError}
        >
          <FormLabel component="legend" required sx={{ mb: 1.5 }}>
            Choose a coverage category
          </FormLabel>
          <Stack spacing={1.5}>
            {state.availableCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = state.selectedCategories.includes(category.id);
              const productNames = state.coverages
                .filter((c) => c.categoryId === category.id)
                .map((c) => c.name)
                .join(", ");
              return (
                <SelectionGroup
                  key={category.id}
                  component="div"
                  role="checkbox"
                  aria-checked={isSelected}
                  checked={isSelected}
                  tabIndex={0}
                  onClick={() => state.handleCategoryToggle(category.id)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      state.handleCategoryToggle(category.id);
                    }
                  }}
                >
                  <Box
                    className="SelectionGroup-icon"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: "1.5rem" }} />
                  </Box>
                  <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      component="span"
                      className="SelectionGroup-label"
                      sx={{ fontSize: "0.875rem" }}
                    >
                      {category.label}
                    </Box>
                    {productNames && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.75rem" }}
                      >
                        {productNames}
                      </Typography>
                    )}
                  </Stack>
                </SelectionGroup>
              );
            })}
          </Stack>
          {state.selectedCategories.length === 0 && pageError && (
            <FormHelperText>
              Please select at least one coverage category.
            </FormHelperText>
          )}
        </FormControl>

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
        <CoverageSummary
          onClose={() => state.setSummaryDrawerOpen(false)}
          source="coverage-page"
        />
      </AppDrawer>
    </>
  );
}
