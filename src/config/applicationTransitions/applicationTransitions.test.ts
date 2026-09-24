import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  contactCarryForwardTransition,
  executeApplicationTransition,
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
    const quote = readFileSync("src/components/forms/QuoteCalculator.tsx", "utf8");
    const contact = readFileSync("src/pages/Contact.tsx", "utf8");
    const questions = readFileSync("src/components/forms/CoverageQuestions.tsx", "utf8");
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
