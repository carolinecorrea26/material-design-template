import autofillExample from '../../../requirements/global/prototype-fixtures/autofill.json';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { resolveCoverageJourneyPolicy } from '../../domain/coverageJourneyPolicy';
import { getFieldSurface, getSurfaceField } from '../../config/fields/storedSurfaces';
import { paymentFrequencyFieldValue } from '../../domain/paymentPolicy';
import type { FieldDefinition } from '../../config/fields/types';
import receiptExample from '../../../requirements/global/prototype-fixtures/receipt-email.json';
import type { PageId } from "../../types";
import { getResolvedFormFlow, shouldSkipPage } from "../../config/formFlow";
import { getClientPageFields } from "../../config/clientFields/getClientPageFields";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { getCoverageAmountRange } from "../../utils/coverageAmounts";
import type { CoverageApplicantId } from "../../config/coverages/types";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import { getFlowGateDefinition } from "../../config/flowGates";

/**
 * Picks a sample amount within a coverage's min/max range, snapped to its step.
 * Uses the fictional fixture amount when the coverage has no configured range.
 */
function pickSampleAmount(
  coverage: ReturnType<typeof getActiveClientCoverages>[number],
  applicantId: CoverageApplicantId,
): number {
  const { minAmount, maxAmount, step } = getCoverageAmountRange(
    coverage,
    applicantId,
  );
  if (minAmount == null || maxAmount == null) return autofillExample.coverage.defaultAmount;

  const mid = minAmount + (maxAmount - minAmount) / 2;
  const snapped = step && step > 0 ? Math.round(mid / step) * step : mid;
  return Math.min(maxAmount, Math.max(minAmount, Math.round(snapped)));
}

/** Evaluate complete sample portfolios: routing can depend on amounts,
 * applicants and combinations of products rather than a single product. */
function previewCoverageValues(
  targetPageId: PageId,
  values: ApplicationFormValues,
  coverages: ReturnType<typeof getActiveClientCoverages>,
): ApplicationFormValues {
  const defaults = coverages.slice(0, autofillExample.coverage.defaultSelectionCount);
  const selections = [
    defaults,
    ...coverages.map(coverage => [coverage]),
    ...coverages.flatMap((coverage, index) => coverages.slice(index + 1).map(other => [coverage, other])),
  ];
  const sample = (selection: typeof coverages, minimum = false): ApplicationFormValues => ({
    coverageSelections: selection.map(coverage => coverage.id),
    productApplicants: Object.fromEntries(selection.map(coverage => [coverage.id, ["member"]])),
    coverageAmounts: Object.fromEntries(selection.map(coverage => [
      `${coverage.id}:member`,
      minimum ? getCoverageAmountRange(coverage, "member").minAmount ?? pickSampleAmount(coverage, "member") : pickSampleAmount(coverage, "member"),
    ])),
  });
  for (const selection of selections) {
    for (const minimum of [false, true]) {
      const candidate = sample(selection, minimum);
      if (!shouldSkipPage(targetPageId, { ...values, ...candidate })) return candidate;
    }
  }
  return sample(defaults);
}

/**
 * Generate default/sample values for all fields up to and including a specific page
 */
export function generateFormDataUpToPage(
  targetPageId: PageId,
  initialValues: ApplicationFormValues = {},
): ApplicationFormValues {
  const values: ApplicationFormValues = { ...initialValues };

  // Use the resolved form flow to find the target page
  const resolvedFlow = getResolvedFormFlow();
  const targetIndex = resolvedFlow.indexOf(targetPageId as PageId);
  if (targetIndex === -1) return values;

  // Iterate through all pages up to and including the target page
  for (let i = 0; i <= targetIndex; i++) {
    const pageId = resolvedFlow[i] as PageId;
    // Answers can reveal more fields on the same page (for example Membership Yes).
    // Re-read until every currently visible field has an answer, preserving prior choices.
    let pending;
    do {
      pending = getClientPageFields(pageId, values).filter(field => values[field.id] === undefined);
      for (const field of pending) values[field.id] = getDefaultValueForField(field);
    } while (pending.length);
  }

  const coverageIndex = resolvedFlow.indexOf("coverage");
  const paymentIndex = resolvedFlow.indexOf("payment");
  const shouldSeedCoverageData = coverageIndex >= 0 && targetIndex >= coverageIndex;
  const shouldSeedPaymentData = paymentIndex >= 0 && targetIndex >= paymentIndex;

  // Add special handling for coverage-dependent fields
  if (shouldSeedCoverageData) {
    const coverages = getActiveClientCoverages();

    // Seed applicants and amounts before checking the target page's routing.
    // Some questionnaires require a combined Life and Disability portfolio.
    if (!values.coverageSelections) {
      Object.assign(values, previewCoverageValues(targetPageId, values, coverages));
    }

    // Generate coverage amounts and payment methods/frequencies
    const coverageSelections = Array.isArray(values.coverageSelections)
      ? values.coverageSelections.filter((value): value is string => typeof value === "string")
      : [];

    // Ensure productApplicants are set for each selected coverage
    if (!values.productApplicants) {
      const productApplicants: Record<string, string[]> = {};
      for (const coverageId of coverageSelections) {
        productApplicants[coverageId] = ["member"];
      }
      values.productApplicants = productApplicants;
    }

    if (!values.coverageAmounts) {
      values.coverageAmounts = {};
    }

    const coverageAmounts =
      typeof values.coverageAmounts === "object" &&
      !Array.isArray(values.coverageAmounts)
        ? values.coverageAmounts
        : {};

    // Set amounts and payment info for each coverage
    for (let i = 0; i < coverageSelections.length; i++) {
      const coverageId = coverageSelections[i];
      const coverage = coverages.find((c) => c.id === coverageId);
      const memberKey = `${coverageId}:member`;

      if (!(memberKey in coverageAmounts) && coverage) {
        (coverageAmounts as Record<string, number>)[memberKey] =
          pickSampleAmount(coverage, "member");
      }

      // Only set spouse amounts if spouse is selected for this coverage
      const productApplicants = values.productApplicants as
        | Record<string, string[]>
        | undefined;
      const applicants = productApplicants?.[coverageId];
      if (applicants && applicants.includes("spouse") && coverage) {
        const spouseKey = `${coverageId}:spouse`;
        if (!(spouseKey in coverageAmounts)) {
          (coverageAmounts as Record<string, number>)[spouseKey] =
            pickSampleAmount(coverage, "spouse");
        }
      }

      if (shouldSeedPaymentData) {
        const methodKey = `payment-method:${coverageId}`;
        const frequencyKey = `payment-frequency:${coverageId}`;
        const library = getPrototypeLibrary();
        const policy = library ? resolveCoverageJourneyPolicy(library.site, coverageId)?.payment : undefined;
        const methods = getSurfaceField('paymentControls', 'payment-method')?.options?.filter(option => !policy || policy.methods.some(method => method.method === option.value)) ?? [];
        const preferredMethod = policy?.defaultMethod ?? autofillExample.payment.methods[i % autofillExample.payment.methods.length];
        const method = methods.find(option => option.value === preferredMethod)?.value ?? methods[0]?.value;
        const frequencies = getSurfaceField('paymentControls', 'payment-frequency')?.options?.filter(option => !policy || policy.methods.find(choice => choice.method === method)?.frequencies.some(frequency => paymentFrequencyFieldValue(frequency) === option.value)) ?? [];
        const preferredFrequency = policy?.defaultFrequency ? paymentFrequencyFieldValue(policy.defaultFrequency) : autofillExample.payment.frequency;
        if (!(methodKey in values) && method) values[methodKey] = method;
        if (!(frequencyKey in values) && frequencies.length) values[frequencyKey] = frequencies.find(option => option.value === preferredFrequency)?.value ?? frequencies[0].value;
      }
    }

    if (shouldSeedPaymentData) {
      const bank = getFieldSurface('paymentBank');
      for (const field of bank.mapping.fields) {
        const key = bank.mapping.fieldToKey[field.id];
        if (values[key] === undefined || values[key] === '') values[key] = getDefaultValueForField(field);
      }
    }

    // Rider-gated pages need a selected rider in addition to a coverage.
    const targetGate = getFlowGateDefinition(targetPageId)?.gate;
    if (targetGate?.kind === "selected-rider" && !values.coverageRiders) {
      const coverageWithTargetRider = coverages.find((c) =>
        c.riders?.some((r) => r.id === targetGate.riderId),
      );

      if (coverageWithTargetRider) {
        if (!coverageSelections.includes(coverageWithTargetRider.id)) {
          coverageSelections.push(coverageWithTargetRider.id);
          values.coverageSelections = coverageSelections;
        }

        const productApplicants = values.productApplicants as
          | Record<string, string[]>
          | undefined;
        if (!productApplicants?.[coverageWithTargetRider.id]) {
          values.productApplicants = {
            ...productApplicants,
            [coverageWithTargetRider.id]: ["member"],
          };
        }

        const riderMemberKey = `${coverageWithTargetRider.id}:member`;
        if (!(riderMemberKey in coverageAmounts)) {
          (coverageAmounts as Record<string, number>)[riderMemberKey] =
            pickSampleAmount(coverageWithTargetRider, "member");
        }

        values.coverageRiders = {
          [`${coverageWithTargetRider.id}:${targetGate.riderId}:member`]: true,
        };
      }
    }

    values.coverageAmounts = coverageAmounts;
  }

  // A terminal-page inspection is an explicit fictional example, not a QD run.
  // Use the same JSON-owned application/outcomes as receipt email and component examples.
  if (targetPageId === 'receipt' && Object.keys(initialValues).length === 0) Object.assign(values, structuredClone(receiptExample.application));
  return values;
}

/** Effective defaults/options own the choice; fixture answers are suggestions only. */
export function getDefaultValueForField(field: Pick<FieldDefinition, 'id' | 'inputType' | 'options' | 'format' | 'minLength' | 'maxLength' | 'defaultValue'>): string | string[] | boolean | number {
  const fixtureValue = (autofillExample.fieldValues as Record<string, string | boolean>)[field.id];
  const preferred = field.defaultValue ?? fixtureValue;
  if (field.options) {
    const allowed = new Set(field.options.map(option => option.value));
    if (field.inputType === 'multi-select' || field.inputType === 'checkbox-group') {
      if (Array.isArray(preferred)) return preferred.filter(value => allowed.has(value));
      return field.inputType === 'multi-select' && field.options.length ? [field.options[0].value] : [];
    }
    return preferred !== undefined && allowed.has(String(preferred)) ? preferred as string | boolean : field.options[0]?.value ?? '';
  }
  if (field.inputType === 'checkbox-group' || field.inputType === 'multi-select') return [];
  if (field.inputType === 'date') {
    if (field.defaultValue !== undefined) return field.defaultValue;
    const rule = (autofillExample.dates as Record<string, { yearsAgo: number; month: number; day: number }>)[field.id];
    const now = new Date();
    return rule ? `${now.getFullYear() - rule.yearsAgo}-${String(rule.month).padStart(2, '0')}-${String(rule.day).padStart(2, '0')}` : now.toISOString().split('T')[0];
  }
  if (preferred !== undefined) return structuredClone(preferred);
  if (field.format === 'digits') return autofillExample.digits.character.repeat(field.minLength ?? autofillExample.digits.length).slice(0, field.maxLength);
  return field.inputType === 'checkbox' ? false : '';
}
