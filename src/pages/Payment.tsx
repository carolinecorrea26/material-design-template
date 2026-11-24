import { paymentProducts, type AppliedPaymentProduct } from '../domain/paymentProducts';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';
import { pageNotesFor, validatePageNotes } from '../domain/pageNotes.mjs';
import { hasDependentsSelected } from '../utils/applicantVisibility';
import { getResolvedApplicantLabels } from '../config/formSectionTitle';
import PageHelp from "../components/content/PageHelp";
import { pageHelpItems } from "../content/helpContent";
import { requirementValidationMessage } from "../domain/requirementValidations";
import { requirementText } from "../domain/requirementContent";
import { getSurfaceField, getSurfaceFields, paymentControlField } from "../config/fields/storedSurfaces";
import SharedPaymentControls from "../components/forms/SharedPaymentControls";
import { sharedPaymentState, SHARED_METHOD_FIELD, SHARED_FREQUENCY_FIELD } from "../domain/sharedPaymentChoices";
import TotalCostSummary from "../app/sections/ConfiguredTotalCostSummary";
import ReferenceRateTableLink from "../components/coverage/ReferenceRateTableLink";
import { resolveRatePresentation } from "../domain/ratePresentation";
import { usePrototypeRates } from "../app/usePrototypeRates";
import type { CoverageApplicantId } from "../domain/coverage";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { paymentFrequencyFieldValue, paymentSelectionAllowed } from "../domain/paymentPolicy";
import { PAYMENT_INFO_OPT_IN_FIELD_ID } from "../config/fields/paymentFields";
import PaymentSections from "../components/payment/PaymentSections";
import FormRoutePage from "../app/RoutePage";

import { getCoverageCategorySectionLabel } from "../config/coverageCategories";
import { groupCoveragesByCategory } from "../utils/groupCoveragesByCategory";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { getActiveClient } from "../config/client/getActiveClient";
import { getClientPageRequirement } from "../config/client/getClientPageRequirement";
import type { FieldDefinition } from "../config/fields/types";

function shouldShowPaymentQuestions(
  pageRequirement: "required" | "optional" | "none",
  values: Record<string, unknown>,
): boolean {
  return pageRequirement === "required" || pageRequirement === "optional" && values[PAYMENT_INFO_OPT_IN_FIELD_ID] === "yes";
}

function getPaymentPageError(
  pageRequirement: "required" | "optional" | "none",
  values: Record<string, unknown>,
): string | undefined {
  if (pageRequirement === "none") {
    return undefined;
  }

  const appliedProducts = getAppliedProducts(values);

  if (appliedProducts.length === 0) return requirementValidationMessage("payment-products-required");

  if (
    pageRequirement === "optional" &&
    !shouldShowPaymentQuestions(pageRequirement, values)
  ) {
    return undefined;
  }


  const sharing = getSharedPaymentState(values);
  if (sharing.shareMethod && (!sharing.method || appliedProducts.some(product => prototypePaymentMethods(product.coverageId).length > 0 && values[`payment-method:${product.coverageId}`] !== sharing.method))) return requirementValidationMessage("payment-shared-method");
  if (sharing.shareFrequency && (!sharing.frequency || appliedProducts.some(product => prototypePaymentMethods(product.coverageId).length > 0 && values[`payment-frequency:${product.coverageId}`] !== sharing.frequency))) return requirementValidationMessage("payment-shared-frequency");

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
    return requirementValidationMessage("payment-all-products");
  }

  return undefined;
}

function getApplicantLabel(applicant: string): string {
  return getResolvedApplicantLabels(getActiveClient().applicantLabels)[applicant as CoverageApplicantId];
}

function getFrequencyLabel(frequency: string): string {
  const options = getSurfaceField('paymentControls', 'payment-frequency')!.options!;
  return (options.find(option => option.value === frequency) ?? options.find(option => option.value === 'monthly'))!.label;
}

function paymentLibrary() {
  const library = getPrototypeLibrary();
  if (!library) throw new Error('Missing fresh-start Payment projection');
  return library;
}

const getAppliedProducts = (values: Record<string, unknown>) => paymentProducts(values as ApplicationFormValues, getActiveClientCoverages());

function getPaymentRuntimeFields(
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
    return (values[fieldId] ?? resolveCoverageJourneyPolicy(paymentLibrary().site, product.coverageId)?.payment.defaultMethod) === "bank-account" && prototypePaymentMethods(product.coverageId).some(method => method.value === 'bank-account');
  });

  const sharing = getSharedPaymentState(values);
  const add = (field: FieldDefinition | undefined) => { if (field) fields.push(field); };
  if (sharing.shareMethod) { const field = paymentControlField("payment-shared-method", SHARED_METHOD_FIELD, sharing.methodOptions); if (field) add({ ...field, defaultValue: sharing.method }); }
  if (sharing.shareFrequency) { const field = paymentControlField("payment-shared-frequency", SHARED_FREQUENCY_FIELD, sharing.frequencyOptions); if (field) add({ ...field, defaultValue: sharing.frequency }); }
  for (const product of appliedProducts) {
    if (!prototypePaymentMethods(product.coverageId).length) continue;
    if (!sharing.shareMethod) add(productPaymentField(product.coverageId, "method", values));
    if (!sharing.shareFrequency) add(productPaymentField(product.coverageId, "frequency", values));
  }
  if (hasAnyBankAccountSelected) fields.push(...getSurfaceFields("paymentBank"));

  return fields;
}

export default function Payment() {
  const library = paymentLibrary();
  // A locked frequency is policy-owned, including when a restored draft used
  // an option that has since been removed. Do not leave an invalid disabled field.
  const lockedDefaults = Object.fromEntries(library.products.flatMap(product => {
    const policy = resolveCoverageJourneyPolicy(library.site, product.id)?.payment;
    const field = policy?.frequencyLocked ? productPaymentField(product.id, 'frequency', {}) : undefined;
    return typeof field?.defaultValue === 'string' ? [[field.id, field.defaultValue]] : [];
  }));
  const pageRequirement = getClientPageRequirement("payment");
  return (
    <FormRoutePage
      pageId="payment"
      defaultValueOverrides={lockedDefaults}
      runtimeFields={(values) => getPaymentRuntimeFields(values, pageRequirement)}
      devFillFields={(values) => getPaymentRuntimeFields(values, pageRequirement)}
      validate={(values) =>
        getPaymentPageError(pageRequirement, values as Record<string, unknown>) ?? prototypePaymentError(values)
      }
      help={<PageHelp items={pageHelpItems("payment")} />}
    >
      {({ control, errors, watchedValues, setValue, pageSections }) => {
        const values = watchedValues as Record<string, unknown>;
        const categorySectionLabelOverrides =
          getActiveClient().coverages.categorySectionLabels;
        const showPaymentQuestions = shouldShowPaymentQuestions(
          pageRequirement,
          values,
        );
        const appliedProducts = getAppliedProducts(values);
        const sharing = getSharedPaymentState(values);

        const groupedCategories = groupCoveragesByCategory(appliedProducts).sort((a, b) =>
          appliedProducts.findIndex(product => product.categoryId === a.category.id) - appliedProducts.findIndex(product => product.categoryId === b.category.id));

        const hasAnyBankAccountSelected = appliedProducts.some((product) => {
          const fieldId = `payment-method:${product.coverageId}`;
          return watchedValues[fieldId] === "bank-account" && prototypePaymentMethods(product.coverageId).some(method => method.value === 'bank-account');
        });

        const notes = validatePageNotes(paymentLibrary().site.configuration.content.find(value => value.key === "payment.notes")?.value);
        return <PaymentSections control={control} errors={errors} pageSections={pageSections}
          notes={appliedProducts.length ? pageNotesFor(notes) : []}
          showPaymentQuestions={showPaymentQuestions}
          optInField={pageRequirement === "optional" ? getSurfaceField("paymentControls", PAYMENT_INFO_OPT_IN_FIELD_ID) : undefined}
          sharedControls={appliedProducts.length > 0 && (sharing.shareMethod || sharing.shareFrequency) ? <SharedPaymentControls state={sharing} control={control} errors={errors} setValue={setValue}
            methodField={paymentControlField("payment-shared-method", SHARED_METHOD_FIELD, sharing.methodOptions)}
            frequencyField={paymentControlField("payment-shared-frequency", SHARED_FREQUENCY_FIELD, sharing.frequencyOptions)} /> : null}
          categories={groupedCategories.map(({ category, products }) => ({
            id: category.id, label: getCoverageCategorySectionLabel(category.id, categorySectionLabelOverrides), icon: category.icon,
            products: products.map(product => {
              const collectsPayment = prototypePaymentMethods(product.coverageId).length > 0;
              const paymentMethodFieldId = `payment-method:${product.coverageId}`;
              const paymentFrequencyFieldId = `payment-frequency:${product.coverageId}`;
              const selectedPaymentMethod = values[paymentMethodFieldId];
              const frequencyField = productPaymentField(product.coverageId, "frequency", values);
              return { notes: pageNotesFor(notes, product.coverageId), id: product.coverageId, name: product.coverageName, quickDecision: product.quickDecision,
                methodField: collectsPayment && !sharing.shareMethod ? productPaymentField(product.coverageId, "method", values) : undefined,
                onMethodChange: (method: string | undefined) => {
                  const allowed = prototypePaymentFrequencies(product.coverageId, method);
                  const current = values[paymentFrequencyFieldId];
                  if (!allowed.some(option => option.value === current)) setValue(paymentFrequencyFieldId, productPaymentField(product.coverageId, "frequency", { ...values, [paymentMethodFieldId]: method })?.defaultValue ?? "", { shouldDirty: true, shouldValidate: true });
                },
                frequencyField: collectsPayment && !sharing.shareFrequency && sharing.updates[paymentFrequencyFieldId] === undefined && frequencyField ? { ...frequencyField, disabled: frequencyField.disabled || !selectedPaymentMethod } : undefined,
                costs: <PrototypePaymentCosts product={product} values={values} />,
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
    if (!methodField?.options?.some(option => option.value === method) || !frequencyField?.options?.some(option => option.value === raw)) return requirementValidationMessage('payment-available-choices');
    if (!paymentSelectionAllowed(policy, method as 'bank-account', frequency as 'monthly')) return requirementValidationMessage('payment-policy-choices');
  }
}

function prototypePaymentMethods(productKey: string) {
  const library = paymentLibrary();
  const allowed = resolveCoverageJourneyPolicy(library.site, productKey)?.payment.methods.map(option => option.method) ?? [];
  return (getSurfaceField('paymentControls', 'payment-method')?.options ?? []).filter(option => allowed.some(method => method === option.value));
}
function prototypePaymentFrequencies(productKey: string, method: unknown) {
  const library = paymentLibrary();
  const policy = resolveCoverageJourneyPolicy(library.site, productKey)?.payment;
  const selected = policy?.methods.find(option => option.method === method) ?? policy?.methods.find(option => option.method === policy.defaultMethod);
  const allowed = (selected?.frequencies ?? []).map(paymentFrequencyFieldValue);
  return (getSurfaceField('paymentControls', 'payment-frequency')?.options ?? []).filter(option => allowed.some(frequency => frequency === option.value));
}

function PrototypePaymentCosts({ product, values }: { product: AppliedPaymentProduct; values: Record<string, unknown> }) {
  const rates = usePrototypeRates(product.applicants.map(a => ({ productKey: product.coverageId, applicant: a.applicant as CoverageApplicantId, amount: a.amount })), values, "monthly", "coverage");
  const library = getPrototypeLibrary();
  const table = library ? resolveRatePresentation(library.site, product.coverageId).referenceTable : null;
  const prices = product.applicants.map(a => ({ label: getApplicantLabel(a.applicant), amount: rates.premium(`${product.coverageId}:${a.applicant}`), display: rates.display(`${product.coverageId}:${a.applicant}`) }));
  const total = prices.reduce((sum, p) => sum + p.amount, 0);
  const frequency = getFrequencyLabel(String(values[`payment-frequency:${product.coverageId}`] ?? "monthly"));
  if (table) return <ReferenceRateTableLink table={table} />;
  return <TotalCostSummary showItems={hasDependentsSelected(values)} title={requirementText('payment.estimated-cost', { frequency: frequency.toLowerCase().replace('annually', 'annual') })} items={prices.map((price, index) => ({ id: `${product.coverageId}:${product.applicants[index].applicant}`, name: price.label, amount: price.amount, display: price.display }))} total={total} totalSuffix="" />;
}

function getSharedPaymentState(values: Record<string, unknown>) {
  const configured = getActiveClient().applicantExperience?.payment;
  const forced = getAppliedProducts(values).some(product => { const policy = resolveCoverageJourneyPolicy(paymentLibrary().site, product.coverageId)?.payment; return policy?.collection !== 'none' && policy?.synchronizeAcrossProducts; });
  const settings = { allowSharedMethod: forced || configured?.allowSharedMethod, allowSharedFrequency: forced || configured?.allowSharedFrequency };
  const library = getPrototypeLibrary();
  const products = getAppliedProducts(values).filter(product => !library || resolveCoverageJourneyPolicy(library.site, product.coverageId)?.payment.collection !== 'none').map(product => {
    const productMethods = paymentControlField("payment-method", `payment-method:${product.coverageId}`, prototypePaymentMethods(product.coverageId))?.options ?? [];
    const methods = settings?.allowSharedMethod ? paymentControlField('payment-shared-method', SHARED_METHOD_FIELD, productMethods)?.options ?? [] : productMethods;
    return { productKey: product.coverageId, methods, frequenciesByMethod: Object.fromEntries(methods.map(method => {
      const productFrequencies = paymentControlField("payment-frequency", `payment-frequency:${product.coverageId}`, prototypePaymentFrequencies(product.coverageId, method.value))?.options ?? [];
      return [method.value, settings?.allowSharedFrequency ? paymentControlField('payment-shared-frequency', SHARED_FREQUENCY_FIELD, productFrequencies)?.options ?? [] : productFrequencies];
    })) };
  });
  const defaults: Record<string, string> = {};
  for (const product of products) for (const kind of ['method', 'frequency'] as const) {
    const field = productPaymentField(product.productKey, kind, values);
    if (typeof field?.defaultValue === 'string') defaults[field.id] = field.defaultValue;
  }
  return sharedPaymentState(products, values, settings, defaults);
}

/** Policy defaults seed missing fields; RHF restoration preserves explicit saved answers. */
function productPaymentField(productKey: string, kind: 'method' | 'frequency', values: Record<string, unknown>) {
  const policy = resolveCoverageJourneyPolicy(paymentLibrary().site, productKey)?.payment;
  if (!policy || policy.collection === 'none') return;
  const method = values[`payment-method:${productKey}`] ?? policy.defaultMethod;
  const options = kind === 'method' ? prototypePaymentMethods(productKey) : prototypePaymentFrequencies(productKey, method);
  const preferred = kind === 'method' ? policy.defaultMethod : policy.defaultFrequency === 'annual' ? 'annually' : policy.defaultFrequency === 'semiannual' ? 'semiannually' : policy.defaultFrequency;
  const field = paymentControlField(`payment-${kind}`, `payment-${kind}:${productKey}`, options);
  return field ? { ...field, ...(preferred && options.some(option => option.value === preferred) ? { defaultValue: preferred } : {}), ...(kind === 'frequency' ? { disabled: policy.frequencyLocked } : {}) } : undefined;
}
