import { getSurfaceField, getSurfaceFields, paymentControlField } from "../config/fields/storedSurfaces";
import SharedPaymentControls from "../components/forms/SharedPaymentControls";
import { sharedPaymentState, SHARED_METHOD_FIELD, SHARED_FREQUENCY_FIELD } from "../domain/sharedPaymentChoices";
import EstimatedRate from "../app/sections/ConfiguredEstimatedRate";
import TotalCostSummary from "../app/sections/ConfiguredTotalCostSummary";
import ReferenceRateTableLink from "../components/coverage/ReferenceRateTableLink";
import { resolveRatePresentation } from "../domain/ratePresentation";
import { mockRequest, type MockPayment, type MockQuote } from "../mock/client";
import { validateApplicationCoverages } from "../domain/coverageRuntime";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { usePrototypeRates } from "../app/usePrototypeRates";
import type { CoverageApplicantId } from "../domain/coverage";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { paymentSelectionAllowed } from "../domain/paymentPolicy";
import { paymentMethodOptions, paymentFrequencyOptions, PAYMENT_INFO_OPT_IN_FIELD_ID } from "../config/fields/paymentFields";
import { useRef, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import PaymentSections from "../components/payment/PaymentSections";
import { estimateMonthlyPremium } from "../utils/estimateMonthlyPremium";
import FormRoutePage from "../app/RoutePage";

import { getCoverageCategorySectionLabel } from "../config/coverageCategories";
import type { CoverageCategoryId } from "../config/coverages/types";
import { groupCoveragesByCategory } from "../utils/groupCoveragesByCategory";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { getActiveClient } from "../config/client/getActiveClient";
import { getClientPageRequirement } from "../config/client/getClientPageRequirement";
import type { FieldDefinition } from "../config/fields/types";
import { paymentHandlingHelpItem } from "../content/helpContent";
import FormHelpChips from "../components/content/HelpChips";
import AppDrawer from "../components/layout/AppDrawer";

type AppliedProduct = {
  coverageId: string;
  categoryId: CoverageCategoryId;
  coverageName: string;
  quickDecision: boolean;
  applicants: Array<{
    key: string;
    applicant: string;
    amount: number;
  }>;
};

function shouldShowPaymentQuestions(
  pageRequirement: "required" | "optional" | "none",
  values: Record<string, unknown>,
): boolean {
  if (pageRequirement !== "optional") {
    return true;
  }

  return values[PAYMENT_INFO_OPT_IN_FIELD_ID] === "yes";
}

function getPaymentPageError(
  pageRequirement: "required" | "optional" | "none",
  values: Record<string, unknown>,
): string | undefined {
  if (pageRequirement === "none") {
    return undefined;
  }

  if (
    pageRequirement === "optional" &&
    !shouldShowPaymentQuestions(pageRequirement, values)
  ) {
    return undefined;
  }

  const appliedProducts = getAppliedProducts(values);

  if (appliedProducts.length === 0) {
    return undefined;
  }

  const sharing = getSharedPaymentState(values);
  if (sharing.shareMethod && (!sharing.method || appliedProducts.some(product => prototypePaymentMethods(product.coverageId).length > 0 && values[`payment-method:${product.coverageId}`] !== sharing.method))) return "Choose a payment method available for all products.";
  if (sharing.shareFrequency && (!sharing.frequency || appliedProducts.some(product => prototypePaymentMethods(product.coverageId).length > 0 && values[`payment-frequency:${product.coverageId}`] !== sharing.frequency))) return "Choose a payment frequency available for all products.";

  const hasMissingPaymentInfo = appliedProducts.some((product) => {
    if (!prototypePaymentMethods(product.coverageId).length) return false;
    const paymentMethod = values[`payment-method:${product.coverageId}`];
    const paymentFrequency = values[`payment-frequency:${product.coverageId}`];

    return (
      typeof paymentMethod !== "string" ||
      paymentMethod.trim().length === 0 ||
      typeof paymentFrequency !== "string" ||
      paymentFrequency.trim().length === 0
    );
  });

  if (hasMissingPaymentInfo) {
    return "Please add payment information for all applicable products before continuing.";
  }

  return undefined;
}

function toPositiveAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function getApplicantLabel(applicant: string): string {
  if (applicant === "member") return "Self";
  if (applicant === "spouse") return "Spouse";
  if (applicant === "child") return "Child";
  return applicant;
}

function getFrequencyMultiplier(frequency: string): number {
  const option = paymentFrequencyOptions.find((o) => o.value === frequency);
  return option?.multiplier ?? 1;
}

function getFrequencyLabel(frequency: string): string {
  const option = paymentFrequencyOptions.find((o) => o.value === frequency);
  return option?.label ?? "Monthly";
}

function getAppliedProducts(values: Record<string, unknown>): AppliedProduct[] {
  const selectedCoverageIds = Array.isArray(values.coverageSelections)
    ? new Set(values.coverageSelections.map(String))
    : new Set<string>();

  const coverageAmounts =
    values.coverageAmounts &&
    typeof values.coverageAmounts === "object" &&
    !Array.isArray(values.coverageAmounts)
      ? (values.coverageAmounts as Record<string, unknown>)
      : {};

  const activeCoverages = getActiveClientCoverages();
  const coverageById = new Map(
    activeCoverages.map((coverage) => [coverage.id, coverage]),
  );

  const entries = Object.entries(coverageAmounts)
    .flatMap(([compoundKey, rawAmount]) => {
      const amount = toPositiveAmount(rawAmount);
      if (!amount) return [];

      const [coverageId, applicant] = compoundKey.split(":");
      if (!coverageId || !applicant) return [];

      if (
        selectedCoverageIds.size > 0 &&
        !selectedCoverageIds.has(coverageId)
      ) {
        return [];
      }

      const coverage = coverageById.get(coverageId);
      if (!coverage) return [];

      return [
        {
          key: compoundKey,
          coverageId,
          applicant,
          amount,
          categoryId: coverage.categoryId,
          coverageName: coverage.name,
          quickDecision: !coverage.underwritingBands?.length && coverage.underwritingType === "QD",
        },
      ];
    })
    .sort((a, b) => {
      if (a.categoryId !== b.categoryId) {
        return a.categoryId.localeCompare(b.categoryId);
      }

      if (a.coverageName !== b.coverageName) {
        return a.coverageName.localeCompare(b.coverageName);
      }

      return a.applicant.localeCompare(b.applicant);
    });

  const grouped = new Map<string, AppliedProduct>();

  entries.forEach((entry) => {
    const existing = grouped.get(entry.coverageId);

    if (existing) {
      existing.applicants.push({
        key: entry.key,
        applicant: entry.applicant,
        amount: entry.amount,
      });
      return;
    }

    grouped.set(entry.coverageId, {
      coverageId: entry.coverageId,
      categoryId: entry.categoryId,
      coverageName: entry.coverageName,
      quickDecision: entry.quickDecision,
      applicants: [
        {
          key: entry.key,
          applicant: entry.applicant,
          amount: entry.amount,
        },
      ],
    });
  });

  return [...grouped.values()].sort((a, b) =>
    a.coverageName.localeCompare(b.coverageName),
  );
}

function getPaymentDevFields(
  values: Record<string, unknown>,
  pageRequirement: "required" | "optional" | "none",
): FieldDefinition[] {
  if (pageRequirement === "none") {
    return [];
  }

  const fields: FieldDefinition[] = [];

  if (pageRequirement === "optional") {
    fields.push(getSurfaceField("paymentControls", PAYMENT_INFO_OPT_IN_FIELD_ID)!);
  }

  if (!shouldShowPaymentQuestions(pageRequirement, values)) {
    return fields;
  }

  const appliedProducts = getAppliedProducts(values);

  const hasAnyBankAccountSelected = appliedProducts.some((product) => {
    const fieldId = `payment-method:${product.coverageId}`;
    return values[fieldId] === "bank-account";
  });

  const sharing = getSharedPaymentState(values);
  const add = (field: FieldDefinition | undefined) => { if (field) fields.push(field); };
  if (sharing.shareMethod) add(paymentControlField("payment-shared-method", SHARED_METHOD_FIELD, sharing.methodOptions));
  if (sharing.shareFrequency) add(paymentControlField("payment-shared-frequency", SHARED_FREQUENCY_FIELD, sharing.frequencyOptions));
  for (const product of appliedProducts) {
    if (!sharing.shareMethod) add(paymentControlField("payment-method", `payment-method:${product.coverageId}`, prototypePaymentMethods(product.coverageId)));
    if (!sharing.shareFrequency) add(paymentControlField("payment-frequency", `payment-frequency:${product.coverageId}`, prototypePaymentFrequencies(product.coverageId, values[`payment-method:${product.coverageId}`])));
  }
  if (hasAnyBankAccountSelected) fields.push(...getSurfaceFields("paymentBank"));

  return fields;
}

export default function Payment() {
  const { setPageValues, requiresRevalidation } = useApplicationForm();
  const pageRequirement = getClientPageRequirement("payment");
  const helpItems = [paymentHandlingHelpItem];
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const activeHelpItem =
    helpItems.find((item) => item.id === activeHelpId) ?? null;

  const [mockError, setMockError] = useState("");
  const [mockBusy, setMockBusy] = useState(false);
  const [authorization, setAuthorization] = useState<{ input: string; paymentIds: string[]; status: string } | null>(null);
  const deferredSubmission = useRef<{ input: string; key: string } | null>(null);
  const entriesFor = (values: Record<string, unknown>) => getAppliedProducts(values).flatMap(p => p.applicants.map(a => ({ productKey: p.coverageId, applicant: a.applicant, amount: a.amount })));
  const inputFor = (values: Record<string, unknown>) => JSON.stringify({ entries: entriesFor(values), choices: getAppliedProducts(values).map(p => [values[`payment-method:${p.coverageId}`], values[`payment-frequency:${p.coverageId}`]]) });
  const authorize = async (values: Record<string, unknown>, paymentToken: string) => {
    const validation = getPaymentPageError(pageRequirement, values) ?? prototypePaymentError(values) ?? validateApplicationCoverages(getActiveClientCoverages(), values);
    if (validation) { setMockError(validation); return; }
    setMockBusy(true); setMockError(""); setAuthorization(null);
    try {
      const payments: MockPayment[] = [];
      for (const entry of entriesFor(values)) {
        const quote = await mockRequest<MockQuote>("/rates/quote", { siteKey: getPrototypeLibrary()!.site.siteKey, revision: getPrototypeLibrary()!.revision, productKey: entry.productKey, dimensions: { applicant: entry.applicant }, amount: entry.amount, paymentMethod: values[`payment-method:${entry.productKey}`], frequency: ({ annually: "annual", semiannually: "semiannual" } as Record<string, string>)[String(values[`payment-frequency:${entry.productKey}`])] ?? values[`payment-frequency:${entry.productKey}`] });
        payments.push(await mockRequest<MockPayment>("/payments/authorize", { quoteId: quote.quoteId, paymentToken, idempotencyKey: crypto.randomUUID() }));
      }
      setAuthorization({ input: inputFor(values), paymentIds: payments.map(p => p.paymentId), status: payments.every(p => p.status === "authorized") ? "authorized" : "declined" });
    } catch (error) { setMockError(error instanceof Error ? error.message : "Payment authorization failed"); }
    finally { setMockBusy(false); }
  };
  return (
    <FormRoutePage
      pageId="payment"
      onBeforeNext={({ values, continueNavigation }) => {
        if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return true;
        if (requiresRevalidation) { setMockError('Complete Coverage or Review against the current Library before submitting.'); return false; }
        const paymentDeferred = pageRequirement === "optional" && values[PAYMENT_INFO_OPT_IN_FIELD_ID] === "no";
        if (!paymentDeferred && (!authorization || authorization.status !== "authorized" || authorization.input !== inputFor(values))) { setMockError("Authorize payment for your current selections before submitting."); return false; }
        if (paymentDeferred && deferredSubmission.current?.input !== inputFor(values)) deferredSubmission.current = { input: inputFor(values), key: crypto.randomUUID() };
        const paymentIds = paymentDeferred ? [] : authorization!.paymentIds;
        const idempotencyKey = paymentDeferred ? deferredSubmission.current!.key : paymentIds[0];
        setMockBusy(true);
        void mockRequest<{ submissionId: string }>("/applications/submit", { siteKey: getPrototypeLibrary()!.site.siteKey, revision: getPrototypeLibrary()!.revision, entries: entriesFor(values), paymentIds, idempotencyKey, ...(paymentDeferred ? { paymentDeferred: true } : {}) }).then(result => { setPageValues({ "mock-submission-id": result.submissionId }); continueNavigation(); }).catch(error => setMockError(error.message)).finally(() => setMockBusy(false));
        return false;
      }}
      disableNextButton={mockBusy}
      runtimeFields={(values) => getPaymentDevFields(values, pageRequirement)}
      devFillFields={(values) => getPaymentDevFields(values, pageRequirement)}
      validate={(values) =>
        getPaymentPageError(pageRequirement, values as Record<string, unknown>) ?? prototypePaymentError(values)
      }
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
    >
      {({ control, errors, watchedValues, setValue }) => {
        const values = watchedValues as Record<string, unknown>;
        const categorySectionLabelOverrides =
          getActiveClient().coverages.categorySectionLabels;
        const showPaymentQuestions = shouldShowPaymentQuestions(
          pageRequirement,
          values,
        );
        const appliedProducts = getAppliedProducts(values);
        const sharing = getSharedPaymentState(values);

        const groupedCategories = groupCoveragesByCategory(appliedProducts);

        const hasAnyBankAccountSelected = appliedProducts.some((product) => {
          const fieldId = `payment-method:${product.coverageId}`;
          return watchedValues[fieldId] === "bank-account";
        });

        return <PaymentSections control={control} errors={errors}
          showPaymentQuestions={showPaymentQuestions}
          optInField={pageRequirement === "optional" ? getSurfaceField("paymentControls", PAYMENT_INFO_OPT_IN_FIELD_ID) : undefined}
          feedback={<>
            {import.meta.env.VITE_MOCK_PLATFORM_ENABLED && showPaymentQuestions && <Stack spacing={1}>
              <Stack direction="row" spacing={1}><Button disabled={mockBusy} onClick={() => void authorize(values, "mock-approved")}>Authorize payment</Button><Button disabled={mockBusy} onClick={() => void authorize(values, "mock-declined")}>Try declined payment</Button></Stack>
              {authorization && <Alert severity={authorization.status === "authorized" ? "success" : "warning"}>Payment: {authorization.status}. {authorization.input !== inputFor(values) ? "Elections changed; authorize again." : ""}</Alert>}
              {mockError && <Alert severity="error">{mockError}</Alert>}
            </Stack>}
            {!showPaymentQuestions && mockError && <Alert severity="error">{mockError}</Alert>}
          </>}
          sharedControls={appliedProducts.length > 0 && (sharing.shareMethod || sharing.shareFrequency) ? <SharedPaymentControls state={sharing} control={control} errors={errors} setValue={setValue}
            methodField={paymentControlField("payment-shared-method", SHARED_METHOD_FIELD, sharing.methodOptions)}
            frequencyField={paymentControlField("payment-shared-frequency", SHARED_FREQUENCY_FIELD, sharing.frequencyOptions)} /> : null}
          categories={groupedCategories.map(({ category, products }) => ({
            id: category.id, label: getCoverageCategorySectionLabel(category.id, categorySectionLabelOverrides), icon: category.icon,
            products: products.map(product => {
              const paymentMethodFieldId = `payment-method:${product.coverageId}`;
              const paymentFrequencyFieldId = `payment-frequency:${product.coverageId}`;
              const selectedPaymentMethod = values[paymentMethodFieldId];
              const frequencyField = paymentControlField("payment-frequency", paymentFrequencyFieldId, prototypePaymentFrequencies(product.coverageId, selectedPaymentMethod));
              const selectedFrequency =
                (values[paymentFrequencyFieldId] as string) ||
                "monthly";
              const frequencyMultiplier =
                getFrequencyMultiplier(selectedFrequency);
              const frequencyLabel =
                getFrequencyLabel(selectedFrequency);

              const applicantPremiums = product.applicants.map(
                (applicantEntry) => ({
                  applicant: applicantEntry.applicant,
                  monthlyPremium: estimateMonthlyPremium(
                    product.categoryId,
                    applicantEntry.amount,
                  ),
                }),
              );

              const totalMonthly = applicantPremiums.reduce(
                (sum, entry) => sum + entry.monthlyPremium,
                0,
              );

              const totalForFrequency =
                totalMonthly * frequencyMultiplier;

              const hasDependentBreakdown =
                applicantPremiums.some(
                  (entry) => entry.applicant !== "member",
                );

              return { id: product.coverageId, name: product.coverageName, quickDecision: product.quickDecision,
                methodField: !sharing.shareMethod ? paymentControlField("payment-method", paymentMethodFieldId, prototypePaymentMethods(product.coverageId)) : undefined,
                frequencyField: !sharing.shareFrequency && sharing.updates[paymentFrequencyFieldId] === undefined && frequencyField ? { ...frequencyField, disabled: !selectedPaymentMethod } : undefined,
                costs: (getPrototypeLibrary() ? <PrototypePaymentCosts product={product} values={values} /> : (
                  <Box
                    sx={{
                      mt: 0.5,
                      pt: 1.5,
                      borderTop: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Stack spacing={1.25}>
                      {hasDependentBreakdown && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Estimated{" "}
                          {frequencyLabel.toLowerCase().replace('annually', 'annual')} cost
                        </Typography>
                      )}

                      {hasDependentBreakdown &&
                        applicantPremiums.map((entry) => (
                          <Stack
                            key={entry.applicant}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              {getApplicantLabel(
                                entry.applicant,
                              )}
                            </Typography>
                            <EstimatedRate amount={entry.monthlyPremium * frequencyMultiplier} />
                          </Stack>
                        ))}

                      <Box
                        sx={{
                          borderTop: hasDependentBreakdown
                            ? "1px solid"
                            : "none",
                          borderColor: "divider",
                          pt: hasDependentBreakdown ? 1.25 : 0,
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="baseline"
                        >
                          <Typography variant="subtitle2">
                            {hasDependentBreakdown
                              ? "Total estimated cost"
                              : `Estimated ${frequencyLabel.toLowerCase().replace('annually', 'annual')} cost`}
                            <sup>1</sup>
                          </Typography>
                          <EstimatedRate amount={totalForFrequency} />
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                )),
              };
            }),
          }))}
          bankFields={hasAnyBankAccountSelected ? getSurfaceFields("paymentBank") : []} />;
      }}
    </FormRoutePage>
  );
}

function prototypePaymentError(values: Record<string, unknown>): string | undefined {
  const library = getPrototypeLibrary();
  if (!library || !shouldShowPaymentQuestions(getClientPageRequirement('payment'), values)) return;
  for (const product of getAppliedProducts(values)) {
    const policy = resolveCoverageJourneyPolicy(library.site, product.coverageId)?.payment;
    if (!policy || policy.collection === 'none') continue;
    const method = values[`payment-method:${product.coverageId}`];
    const raw = String(values[`payment-frequency:${product.coverageId}`] ?? '');
    const frequency = ({ annually: 'annual', semiannually: 'semiannual' } as Record<string, string>)[raw] ?? raw;
    const methodField = paymentControlField('payment-method', `payment-method:${product.coverageId}`, prototypePaymentMethods(product.coverageId));
    const frequencyField = paymentControlField('payment-frequency', `payment-frequency:${product.coverageId}`, prototypePaymentFrequencies(product.coverageId, method));
    if (!methodField?.options?.some(option => option.value === method) || !frequencyField?.options?.some(option => option.value === raw)) return 'Choose an available payment method and frequency.';
    if (!paymentSelectionAllowed(policy, method as 'bank-account', frequency as 'monthly')) return 'Choose a payment method and frequency available in the Library.';
  }
}

function prototypePaymentMethods(productKey: string) {
  const library = getPrototypeLibrary();
  if (!library) return paymentMethodOptions;
  return resolveCoverageJourneyPolicy(library.site, productKey)?.payment.methods.map(option => ({ value: option.method, label: ({ 'bank-account': 'Bank account', 'credit-card': 'Credit card', 'bill-me': 'Bill me' })[option.method] })) ?? [];
}
function prototypePaymentFrequencies(productKey: string, method: unknown) {
  const library = getPrototypeLibrary();
  if (!library) return paymentFrequencyOptions;
  const policy = resolveCoverageJourneyPolicy(library.site, productKey)?.payment;
  const selected = policy?.methods.find(option => option.method === method) ?? policy?.methods.find(option => option.method === policy.defaultMethod);
  return (selected?.frequencies ?? []).map(frequency => ({ value: frequency === 'annual' ? 'annually' : frequency === 'semiannual' ? 'semiannually' : frequency, label: frequency === 'annual' ? 'Annually' : frequency === 'semiannual' ? 'Semiannually' : frequency[0].toUpperCase() + frequency.slice(1) }));
}

function PrototypePaymentCosts({ product, values }: { product: AppliedProduct; values: Record<string, unknown> }) {
  const rates = usePrototypeRates(product.applicants.map(a => ({ productKey: product.coverageId, applicant: a.applicant as CoverageApplicantId, amount: a.amount })), values, "monthly", "coverage");
  const library = getPrototypeLibrary();
  const table = library ? resolveRatePresentation(library.site, product.coverageId).referenceTable : null;
  const prices = product.applicants.map(a => ({ label: getApplicantLabel(a.applicant), amount: rates.premium(`${product.coverageId}:${a.applicant}`), display: rates.display(`${product.coverageId}:${a.applicant}`) }));
  const total = prices.reduce((sum, p) => sum + p.amount, 0);
  const frequency = getFrequencyLabel(String(values[`payment-frequency:${product.coverageId}`] ?? "monthly"));
  if (table) return <ReferenceRateTableLink table={table} />;
  return <TotalCostSummary title={`Estimated ${frequency.toLowerCase().replace('annually', 'annual')} cost`} items={prices.map((price, index) => ({ id: `${product.coverageId}:${product.applicants[index].applicant}`, name: price.label, amount: price.amount, display: price.display }))} total={total} totalSuffix="" />;
}

function getSharedPaymentState(values: Record<string, unknown>) {
  const settings = getActiveClient().applicantExperience?.payment;
  const library = getPrototypeLibrary();
  const products = getAppliedProducts(values).filter(product => !library || resolveCoverageJourneyPolicy(library.site, product.coverageId)?.payment.collection !== 'none').map(product => {
    const productMethods = paymentControlField("payment-method", `payment-method:${product.coverageId}`, prototypePaymentMethods(product.coverageId))?.options ?? [];
    const methods = settings?.allowSharedMethod ? paymentControlField('payment-shared-method', SHARED_METHOD_FIELD, productMethods)?.options ?? [] : productMethods;
    return { productKey: product.coverageId, methods, frequenciesByMethod: Object.fromEntries(methods.map(method => {
      const productFrequencies = paymentControlField("payment-frequency", `payment-frequency:${product.coverageId}`, prototypePaymentFrequencies(product.coverageId, method.value))?.options ?? [];
      return [method.value, settings?.allowSharedFrequency ? paymentControlField('payment-shared-frequency', SHARED_FREQUENCY_FIELD, productFrequencies)?.options ?? [] : productFrequencies];
    })) };
  });
  return sharedPaymentState(products, values, settings);
}
