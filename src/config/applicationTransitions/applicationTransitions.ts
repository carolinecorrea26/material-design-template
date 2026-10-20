import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
} from "../coverages/types";
import { getCategoryQuestionFieldIds } from "../coverageQuestionRequirements";
import type { FieldId } from "../fields/types";
import type { ApplicationTransitionDefinition } from "./types";
import { executeApplicationTransition } from "./executeApplicationTransition";

export type QuoteApplySource = {
  birthday: string;
  zipCode: string;
  state: string;
  gender: string;
  smoker: string;
  averageMonthlyIncome: string;
  hoursWorkedPerWeek: string;
  monthlyBusinessExpenses: string;
  businessExpenseResponsibility: string;
  selectedCategories: CoverageCategoryId[];
  selectedProductIds: string[];
  productApplicants: Record<string, CoverageApplicantId[]>;
  coverageAmounts: Record<string, number>;
  hideSmokerQuestion?: boolean;
  /** The actual saved quote-field participation, including Site additions. */
  collectedFieldIds?: string[];
};

function quoteRequires(fieldId: string) {
  return (source: QuoteApplySource) => source.collectedFieldIds
    ? source.collectedFieldIds.includes(fieldId)
    : getCategoryQuestionFieldIds(source.selectedCategories, "self", {
      hideSmokerQuestion: source.hideSmokerQuestion,
    }).some(id => id === fieldId);
}

export const quoteApplyTransition: ApplicationTransitionDefinition<QuoteApplySource> = {
  id: "quote-apply",
  trigger: "quote.apply",
  fieldMappings: [
    { source: "birthday", targetFieldId: "birth-date" },
    { source: "zipCode", targetFieldId: "zip-postal-code" },
    { source: "state", targetFieldId: "state-province" },
    { source: "gender", targetFieldId: "gender", include: quoteRequires("gender") },
    { source: "smoker", targetFieldId: "smoker", include: quoteRequires("smoker") },
    {
      source: "averageMonthlyIncome",
      targetFieldId: "average-monthly-income",
      include: quoteRequires("average-monthly-income"),
    },
    {
      source: "hoursWorkedPerWeek",
      targetFieldId: "hours-worked-per-week",
      include: quoteRequires("hours-worked-per-week"),
    },
    {
      source: "monthlyBusinessExpenses",
      targetFieldId: "monthly-business-expenses",
      include: quoteRequires("monthly-business-expenses"),
    },
    {
      source: "businessExpenseResponsibility",
      targetFieldId: "business-expense-responsibility",
      include: quoteRequires("business-expense-responsibility"),
    },
  ],
  structuredMappings: [
    { target: "coverageSelections", resolve: (source) => source.selectedProductIds },
    { target: "selectedCategoryChips", resolve: (source) => source.selectedCategories },
    {
      target: "productApplicants",
      resolve: (source) =>
        Object.fromEntries(
          source.selectedProductIds.map((id) => [id, source.productApplicants[id] ?? []]),
        ),
    },
    {
      target: "coverageAmounts",
      resolve: (source) =>
        Object.fromEntries(
          source.selectedProductIds.flatMap((id) =>
            (source.productApplicants[id] ?? []).map((applicant) => {
              const key = `${id}:${applicant}`;
              return [key, source.coverageAmounts[key] ?? 0];
            }),
          ),
        ),
    },
  ],
};

/** Only collected contextual fields participate. Empty inputs cannot erase an
 * existing answer; canonical quote answers and selected coverage take precedence. */
export function executeQuoteApplyTransition(source: QuoteApplySource, currentValues: ApplicationFormValues = {}, contextualFields: Array<{ fieldId: FieldId; value: string | boolean | string[] }> = []) {
  const contextual = executeApplicationTransition({ id: "quote-contextual-fields", trigger: "quote.apply",
    fieldMappings: contextualFields.map(({ fieldId }) => ({ source: fieldId, targetFieldId: fieldId })),
  }, Object.fromEntries(contextualFields.map(({ fieldId, value }) => [fieldId, value])), currentValues);
  return executeApplicationTransition(quoteApplyTransition, source, contextual);
}

type ContactCarryForwardSource = ApplicationFormValues;

export const contactCarryForwardTransition: ApplicationTransitionDefinition<ContactCarryForwardSource> = {
  id: "contact-carry-forward",
  trigger: "contact.enter",
  fieldMappings: [
    { source: "state-province", targetFieldId: "state", overwrite: "if-empty" },
    { source: "zip-postal-code", targetFieldId: "zip-code", overwrite: "if-empty" },
  ],
};

export function describeApplicationTransition<Source extends Record<string, unknown>>(
  definition: ApplicationTransitionDefinition<Source>,
): string {
  const fieldTargets = definition.fieldMappings.map(({ targetFieldId }) => targetFieldId);
  const structuredTargets = (definition.structuredMappings ?? []).map(({ target }) => target);
  return [...fieldTargets, ...structuredTargets].join(", ");
}
