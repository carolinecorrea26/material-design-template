import { describe, expect, it } from "vitest";
import {
  getCategoryQuestionFieldIds,
  getCategoryRequirements,
} from "./coverageQuestionRequirements";

describe("canonical coverage question requirements", () => {
  it.each([
    ["LI", ["gender", "smoker", "tobacco-last-used", "tobacco-products"]],
    ["DI", ["gender", "average-monthly-income", "hours-worked-per-week"]],
    [
      "OO",
      [
        "hours-worked-per-week",
        "monthly-business-expenses",
        "business-expense-responsibility",
      ],
    ],
    ["SH", ["smoker", "tobacco-last-used", "tobacco-products"]],
  ] as const)("resolves %s member questions", (category, expected) => {
    expect(getCategoryQuestionFieldIds([category], "self")).toEqual(expected);
  });

  it("resolves spouse equivalents only where applicable", () => {
    expect(getCategoryQuestionFieldIds(["LI"], "spouse")).toEqual([
      "spouse-gender",
      "spouse-smoker",
      "spouse-tobacco-last-used",
      "spouse-tobacco-products",
    ]);
    expect(getCategoryQuestionFieldIds(["DI"], "spouse")).toEqual([
      "spouse-gender",
      "spouse-average-monthly-income",
      "spouse-hours-worked-per-week",
    ]);
    expect(getCategoryQuestionFieldIds(["OO"], "spouse")).toEqual([]);
  });

  it("derives convenience flags and filters smoker fields as an override", () => {
    expect(getCategoryRequirements(["OO"]).needsHours).toBe(true);
    expect(
      getCategoryQuestionFieldIds(["LI", "SH"], "self", {
        hideSmokerQuestion: true,
      }),
    ).toEqual(["gender"]);
  });
});
