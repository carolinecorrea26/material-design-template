import { describe, expect, it } from "vitest";
import { getPageSections } from "../pageSections";
import { resolveCoverageQuestionSections } from "./resolveCoverageQuestionSections";

function fieldsFor(categories: Parameters<typeof resolveCoverageQuestionSections>[0]["selectedCategories"]) {
  return resolveCoverageQuestionSections({
    sections: getPageSections("coverage"),
    selectedCategories: categories,
  }).flatMap((section) => section.fieldIds);
}

describe("resolveCoverageQuestionSections", () => {
  it("projects canonical field requirements into the configured sections", () => {
    expect(fieldsFor(["LI"])).toEqual([
      "gender",
      "smoker",
      "tobacco-last-used",
      "tobacco-products",
      "spouse-gender",
      "spouse-smoker",
      "spouse-tobacco-last-used",
      "spouse-tobacco-products",
    ]);

    expect(fieldsFor(["OO"])).toEqual([
      "hours-worked-per-week",
      "monthly-business-expenses",
      "business-expense-responsibility",
    ]);
  });

  it("applies client additions and removals before returning render-ready sections", () => {
    const sections = resolveCoverageQuestionSections({
      sections: getPageSections("coverage"),
      selectedCategories: ["DI"],
      coverageQuestions: {
        always: ["selfCoverageBusinessExpenses"],
        removeDefaults: ["selfCoverageWorkIncome"],
      },
    });

    expect(sections.some((section) => section.id === "selfCoverageWorkIncome")).toBe(false);
    expect(
      sections.find((section) => section.id === "selfCoverageBusinessExpenses")
        ?.fieldIds,
    ).toEqual([
      "monthly-business-expenses",
      "business-expense-responsibility",
      "average-employees-6-months",
    ]);
  });

  it("returns no sections until a category is selected", () => {
    expect(fieldsFor([])).toEqual([]);
  });
});
