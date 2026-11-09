import { canViewCoveragePortfolio } from "../domain/tpaIntegration";
import { requirementText } from "../domain/requirementContent";
import { resolveApplicationCoverage } from "../domain/coverageRuntime";
import { useRef, useState } from "react";
import { Box, Button, Divider, Stack } from "@mui/material";
import PageAlert from "../components/feedback/PageAlert";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import FormRoutePage from "../app/RoutePage";

import AppDrawer from "../components/layout/AppDrawer";
import FormHelpChips from "../components/content/HelpChips";
import CoverageQuestions from "../app/sections/ConfiguredCoverageQuestions";
import ProductCatalog from "../app/sections/ConfiguredProductCatalog";
import { useCoverageState } from "../app/useCoverageState";
import CoveragePortfolioDrawer from "../components/coverage/CoveragePortfolioDrawer";
import { useApplicationForm } from "../app/ApplicationFormContext";
import type { CoverageApplicantId } from "../config/coverages/types";
import type { BeforeNextContext } from "../app/RoutePage";
import ConfirmationDialog from "../components/layout/ConfirmationDialog";
import { useComponentContent } from "../components/content/ComponentContentContext";
import CoverageSelectionFeedback from "../components/coverage/CoverageSelectionFeedback";


export default function Coverage() {
  const content = useComponentContent();
  const state = useCoverageState();
  const { values } = useApplicationForm();

  const isTpaVerified = canViewCoveragePortfolio(state.activeClient, values);
  const hasSpouse =
    Array.isArray(values.dependents) &&
    (values.dependents as string[]).includes("spouse");

  const [portfolioDrawerOpen, setPortfolioDrawerOpen] = useState(false);
  const pendingContinueRef = useRef<(() => void) | null>(null);
  const [dependentCoverageDialogOpen, setDependentCoverageDialogOpen] =
    useState(false);

  const helpItems: {
    id: string;
    label: string;
    title: React.ReactNode;
    content: React.ReactNode;
  }[] = [];

  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const activeHelpItem =
    helpItems.find((item) => item.id === activeHelpId) ?? null;

  function getProductApplicants(
    formValues: Record<string, unknown>,
  ): Record<string, CoverageApplicantId[]> {
    if (
      formValues.productApplicants != null &&
      typeof formValues.productApplicants === "object" &&
      !Array.isArray(formValues.productApplicants)
    ) {
      return formValues.productApplicants as Record<
        string,
        CoverageApplicantId[]
      >;
    }

    return {};
  }

  function hasOnlyDependentCoverage(formValues: Record<string, unknown>) {
    const selectedCoverageIds = Array.isArray(formValues.coverageSelections)
      ? formValues.coverageSelections.map(String)
      : [];

    if (selectedCoverageIds.length === 0) {
      return false;
    }

    const productApplicants = getProductApplicants(formValues);
    let hasDependentApplicant = false;

    for (const coverageId of selectedCoverageIds) {
      const applicants = Array.isArray(productApplicants[coverageId])
        ? productApplicants[coverageId]
        : [];

      if (applicants.includes("member")) {
        return false;
      }

      if (applicants.includes("spouse") || applicants.includes("child")) {
        hasDependentApplicant = true;
      }
    }

    return hasDependentApplicant;
  }

  function handleBeforeNext({
    values: nextValues,
    continueNavigation,
  }: BeforeNextContext) {
    if (!hasOnlyDependentCoverage(nextValues)) {
      return true;
    }

    pendingContinueRef.current = continueNavigation;
    setDependentCoverageDialogOpen(true);
    return false;
  }

  function handleDependentCoverageContinue() {
    setDependentCoverageDialogOpen(false);
    const continueNavigation = pendingContinueRef.current;
    pendingContinueRef.current = null;
    continueNavigation?.();
  }

  function handleDependentCoverageCancel() {
    setDependentCoverageDialogOpen(false);
    pendingContinueRef.current = null;
  }

  return (
    <FormRoutePage
      pageId="coverage"
      validate={state.validate}
      onBeforeNext={handleBeforeNext}
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
        <>
          <CoveragePageContent
            control={control}
            errors={errors}
            watchedValues={watchedValues}
            allFields={allFields}
            pageSections={pageSections}
            trigger={trigger}
            state={state}
            isTpaVerified={isTpaVerified}
            onOpenPortfolio={() => setPortfolioDrawerOpen(true)}
          />

          <CoveragePortfolioDrawer
            open={portfolioDrawerOpen && isTpaVerified}
            onClose={() => setPortfolioDrawerOpen(false)}
            hasSpouse={hasSpouse}
          />

          <ConfirmationDialog
            open={dependentCoverageDialogOpen}
            onClose={handleDependentCoverageCancel}
            title={content.dialogs.confirmation.dependentCoverage.title}
            message={content.dialogs.confirmation.dependentCoverage.message}
            confirmLabel={requirementText("coverage.dialog.dependent.confirm")}
            cancelLabel={requirementText("coverage.dialog.dependent.cancel")}
            onConfirm={handleDependentCoverageContinue}
          />

          <CoverageSelectionFeedback
            summaryOpen={state.summaryDrawerOpen}
            onCloseSummary={() => state.setSummaryDrawerOpen(false)}
            addedOpen={state.addedSnackbarOpen}
            onCloseAdded={() => state.setAddedSnackbarOpen(false)}
          />
        </>
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
  isTpaVerified,
  onOpenPortfolio,
}: {
  control: any;
  errors: any;
  watchedValues: any;
  allFields: any[];
  pageSections: any[];
  trigger: () => Promise<boolean>;
  state: ReturnType<typeof useCoverageState>;
  isTpaVerified: boolean;
  onOpenPortfolio: () => void;
}) {
  const content = useComponentContent();
  const [pageError, setPageError] = useState<string | null>(null);

  function handleCoverageQuestionChange() {
    if (state.showProducts) {
      state.setShowProducts(false);
    }
    setPageError(null);
  }

  return (
    <>
      {/* TPA portfolio banner */}
      {isTpaVerified && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            size="medium"
            startIcon={<AccountBalanceWalletRoundedIcon />}
            onClick={onOpenPortfolio}
          >
            {requirementText("coverage.portfolio.button")}
          </Button>
        </Box>
      )}

      {state.coverages.length === 0 && <PageAlert severity="info" message={requirementText("coverage.no-coverage")} />}
      {state.selectedCoverageIds.some(id => !state.coverages.some(product => product.id === id)) && <PageAlert severity="warning" message={<Stack spacing={1}>
        <span>{requirementText("coverage.selection-unavailable")}</span>
        <Button sx={{ alignSelf: "flex-start" }} onClick={() => state.setPageValues({ coverageSelections: state.selectedCoverageIds.filter(id => state.coverages.some(product => product.id === id)) })}>{requirementText("coverage.selection-unavailable.action")}</Button>
      </Stack>} />}
      {/* Coverage questions: category question and its follow-ups */}
      <PageAlert severity="error" message={pageError ?? undefined} />
      <CoverageQuestions
        control={control}
        errors={errors}
        watchedValues={watchedValues}
        allFields={allFields}
        pageSections={pageSections}
        selectedCategories={state.selectedCategories}
        hasSpouse={state.hasSpouse}
        onFieldChange={handleCoverageQuestionChange}
        coverageQuestions={state.clientCoverageQuestions}
        availableCategories={state.availableCategories}
        categoryProducts={state.categoryProducts}
        onCategoryToggle={state.handleCategoryToggle}
        categoryError={state.selectedCategories.length === 0 && !!pageError}
        categoryErrorMessage={content.coverage.selectAtLeastOneCategoryError}
      />

      {/* Divider between coverage questions and products */}
      {state.selectedCategories.length > 0 && state.showProducts && (
        <Divider sx={{ my: 4 }} />
      )}

      {/* Product reveal: product boxes and the combined selected-product cost */}
      {state.selectedCategories.length > 0 && state.showProducts && (
        <Box>
          <ProductCatalog
            getRateDisplay={state.getRateDisplay}
            getCoverageBehavior={(product, applicant) => resolveApplicationCoverage(product, applicant, watchedValues, state.coverages)}
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
                  setPageError(content.coverage.correctErrorsMessage);
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
              {requirementText("coverage.reveal.button")}
            </Button>
          </Box>
        )}


    </>
  );
}
