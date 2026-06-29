import { useCallback, useRef } from "react";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import FormRoutePage from "../components/page/RoutePage";
import FormPageHelp from "../components/help/Panel";
import FormHelpDrawer from "../components/help/Drawer";
import QuickDecisionDrawerContent from "../components/overlays/QuickDecisionInfo";
import { QuickDecisionMark } from "../components/overlays/QuickDecisionInfo";
import ApplicationSummaryDrawer from "../components/overlays/ApplicationSummary";
import CoverageQuestions from "../components/coverage/CoverageQuestions";
import ProductCatalog from "../components/coverage/ProductCatalog";
import { useCoverageState } from "../components/coverage/useCoverageState";

export default function Coverage() {
  const state = useCoverageState();

  const helpItems: {
    id: string;
    label: string;
    title: React.ReactNode;
    content: React.ReactNode;
  }[] = [];

  return (
    <FormRoutePage
      pageId="coverage"
      validate={state.validate}
      help={<FormPageHelp items={helpItems} />}
      hideNextButton={() => !state.showProducts || state.productsLoading}
    >
      {({ control, errors, watchedValues, allFields, pageSections }) => (
        <CoveragePageContent
          control={control}
          errors={errors}
          watchedValues={watchedValues}
          allFields={allFields}
          pageSections={pageSections}
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
  state,
}: {
  control: any;
  errors: any;
  watchedValues: any;
  allFields: any[];
  pageSections: any[];
  state: ReturnType<typeof useCoverageState>;
}) {
  // Use a ref so the callback always has the latest showProducts value
  const showProductsRef = useRef(state.showProducts);
  showProductsRef.current = state.showProducts;

  const handleCoverageQuestionChange = useCallback(() => {
    if (showProductsRef.current) {
      state.setShowProducts(false);
    }
  }, [state.setShowProducts]);

  return (
    <>
      {/* Section 1: Category chips + coverage questions */}
      <Stack spacing={3}>
        {/* Category chips (multi-select) */}
        <Box>
          <Typography variant="overline" sx={{ mb: 1.5, display: "block" }}>
            Choose category
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
            {state.availableCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = state.selectedCategories.includes(category.id);
              return (
                <Chip
                  key={category.id}
                  className="coverageCategoryChip"
                  icon={<Icon sx={{ fontSize: "1.25rem !important" }} />}
                  label={
                    "shortLabel" in category
                      ? category.shortLabel
                      : category.label
                  }
                  variant={isSelected ? "filled" : "outlined"}
                  color={isSelected ? "primary" : "default"}
                  onClick={() => state.handleCategoryToggle(category.id)}
                />
              );
            })}
          </Stack>
        </Box>

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
        />

        {/* Empty state when no categories selected */}
        {state.selectedCategories.length === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "start",
              textAlign: "center",
              minHeight: 200,
              py: 6,
              px: 4,
            }}
          >
            <Stack spacing={1} alignItems="center">
              <PrivacyTipIcon sx={{ fontSize: 40, color: "text.disabled" }} />
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Your coverage options will appear here.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.disabled" }}>
                Select a coverage category to see available options.
              </Typography>
            </Stack>
          </Box>
        )}
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
              onClick={() => {
                // Save current form answers to context before revealing products,
                // so the RoutePage reset effect doesn't clobber them.
                state.setPageValues(watchedValues as Record<string, any>);
                state.revealProducts();
              }}
              endIcon={<ArrowForwardRoundedIcon />}
              sx={() => ({
                fontWeight: 700,
                padding: "16px",
                boxShadow: "0 8px 18px #0668ff3d",
                "&:hover": {
                  boxShadow: "0 8px 18px #0668ff3d",
                },
              })}
            >
              See my coverage options
            </Button>
          </Box>
        )}

      <FormHelpDrawer
        open={state.qdDrawerOpen}
        title={
          <>
            What is <QuickDecisionMark />?
          </>
        }
        onClose={() => state.setQdDrawerOpen(false)}
      >
        <QuickDecisionDrawerContent />
      </FormHelpDrawer>

      <ApplicationSummaryDrawer
        open={state.summaryDrawerOpen}
        onClose={() => state.setSummaryDrawerOpen(false)}
        source="coverage-page"
      />
    </>
  );
}
