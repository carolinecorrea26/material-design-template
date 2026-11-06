import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  contactCarryForwardTransition,
  executeApplicationTransition,
  executeQuoteApplyTransition,
  quoteApplyTransition,
  type QuoteApplySource,
} from ".";
import { fieldCatalog } from "../fields";

const quoteSource: QuoteApplySource = {
  birthday: "1980-05-12",
  zipCode: "10001",
  state: "NY",
  gender: "female",
  smoker: "no",
  averageMonthlyIncome: "9000",
  hoursWorkedPerWeek: "45",
  monthlyBusinessExpenses: "4000",
  businessExpenseResponsibility: "75",
  selectedCategories: ["DI", "OO"],
  selectedProductIds: ["di-test", "oo-test"],
  productApplicants: { "di-test": ["member"], "oo-test": ["member"] },
  coverageAmounts: { "di-test:member": 5000, "oo-test:member": 3000 },
};

describe("application transitions", () => {
  it("applies quote fields, structured coverage state, and preserves unrelated values", () => {
    const result = executeApplicationTransition(quoteApplyTransition, quoteSource, {
      "first-name": "Taylor",
    });

    expect(result).toMatchObject({
      "first-name": "Taylor",
      "birth-date": "1980-05-12",
      "zip-postal-code": "10001",
      "state-province": "NY",
      gender: "female",
      "average-monthly-income": "9000",
      "hours-worked-per-week": "45",
      "monthly-business-expenses": "4000",
      "business-expense-responsibility": "75",
      coverageSelections: ["di-test", "oo-test"],
      selectedCategoryChips: ["DI", "OO"],
      productApplicants: { "di-test": ["member"], "oo-test": ["member"] },
      coverageAmounts: { "di-test:member": 5000, "oo-test:member": 3000 },
    });
    expect(result.smoker).toBeUndefined();
  });

  it("transfers only applicable conditional quote fields", () => {
    const result = executeApplicationTransition(quoteApplyTransition, {
      ...quoteSource,
      selectedCategories: ["LI"],
    });
    expect(result).toMatchObject({ gender: "female", smoker: "no" });
    expect(result["average-monthly-income"]).toBeUndefined();
    expect(result["hours-worked-per-week"]).toBeUndefined();
    expect(result["monthly-business-expenses"]).toBeUndefined();
  });

  it("carries selected riders for selected products and applicants only (CHG-002)", () => {
    const result = executeApplicationTransition(quoteApplyTransition, {
      ...quoteSource,
      selectedProductIds: ["di-test"],
      coverageRiders: { "di-test:cola:member": true, "di-test:off:member": false, "oo-test:cola:member": true },
      coverageRiderAmounts: { "di-test:cola:member": 1000, "di-test:off:member": 500, "oo-test:cola:member": 2000 },
    });
    expect(result.coverageRiders).toEqual({ "di-test:cola:member": true });
    expect(result.coverageRiderAmounts).toEqual({ "di-test:cola:member": 1000 });
  });

  it("honors the quote smoker-question override", () => {
    const result = executeApplicationTransition(quoteApplyTransition, {
      ...quoteSource,
      selectedCategories: ["LI"],
      hideSmokerQuestion: true,
    });
    expect(result.gender).toBe("female");
    expect(result.smoker).toBeUndefined();
  });

  it("carries Eligibility location into empty Contact fields only", () => {
    expect(
      executeApplicationTransition(
        contactCarryForwardTransition,
        { "state-province": "NY", "zip-postal-code": "10001" },
        {},
      ),
    ).toMatchObject({ state: "NY", "zip-code": "10001" });

    expect(
      executeApplicationTransition(
        contactCarryForwardTransition,
        { "state-province": "NY", "zip-postal-code": "10001" },
        { state: "NJ", "zip-code": "07030" },
      ),
    ).toMatchObject({ state: "NJ", "zip-code": "07030" });
  });

  it("keeps business mappings and storage access out of React components", () => {
    const quote = readFileSync("src/app/workflows/QuoteCalculator.tsx", "utf8");
    const contact = readFileSync("src/pages/Contact.tsx", "utf8");
    const questions = readFileSync("src/components/coverage/CoverageQuestions.tsx", "utf8");
    const renderer = readFileSync("src/components/forms/FieldRenderer.tsx", "utf8");
    expect(quote).not.toMatch(/sessionStorage|STORAGE_KEY|applicationFormValues/);
    expect(contact).not.toMatch(/state-province|zip-postal-code/);
    expect(questions).not.toContain("condition-spouse-selected");
    expect(renderer).not.toContain("CURRENCY_FIELD_IDS");
  });

  it("keeps currency presentation on canonical field definitions", () => {
    expect(fieldCatalog["average-monthly-income"].format).toBe("currency");
    expect(fieldCatalog["spouse-average-monthly-income"].format).toBe("currency");
    expect(fieldCatalog["monthly-business-expenses"].format).toBe("currency");
  });
});

it("pre-fills the fields actually collected by a Site quote, including category additions", () => {
  const result = executeQuoteApplyTransition({ ...quoteSource, selectedCategories: ["LI"], collectedFieldIds: ["gender", "hours-worked-per-week", "average-monthly-income", "monthly-business-expenses", "business-expense-responsibility"] }, { smoker: "yes", "first-name": "Retained" }, [
    { fieldId: "is-self-employed", value: "no" }, { fieldId: "years-self-employed", value: "" },
  ]);
  expect(result).toMatchObject({ gender: "female", "hours-worked-per-week": "45", "average-monthly-income": "9000", "monthly-business-expenses": "4000", "business-expense-responsibility": "75", smoker: "yes", "first-name": "Retained", "is-self-employed": "no" });
  expect(result["years-self-employed"]).toBeUndefined();
});
it("keeps prior answers when collected quote inputs are blank and lets current quote answers win", () => {
  const result = executeQuoteApplyTransition({ ...quoteSource, gender: "", collectedFieldIds: ["gender", "hours-worked-per-week"] }, { gender: "male", "years-self-employed": "3" }, [
    { fieldId: "years-self-employed", value: "" }, { fieldId: "hours-worked-per-week", value: "10" },
  ]);
  expect(result.gender).toBe("male");
  expect(result["years-self-employed"]).toBe("3");
  expect(result["hours-worked-per-week"]).toBe("45");
});
