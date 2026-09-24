import { describe, expect, it } from "vitest";
import {
  formatCoverageAmounts,
  getCoverageAmountAssignment,
  getCoverageAmountChoices,
} from "./coverageAmounts";
import type { CoverageAmountAssignment } from "../config/coverages/types";

const coverageAmounts: CoverageAmountAssignment[] = [
  {
    scope: { applicantType: "member" },
    selections: [
      { type: "range", min: 10000, max: 30000, increment: 10000 },
      { type: "range", min: 50000, max: 100000, increment: 50000 },
    ],
  },
  {
    scope: { applicantType: "spouse" },
    selections: [{ type: "amountList", values: [10000, 25000, 50000] }],
  },
  {
    scope: { applicantType: "member", applicantClassId: "associate-member" },
    selections: [
      {
        type: "optionList",
        options: [
          { value: "plan-a", label: "Plan A" },
          { value: "plan-b", label: "Plan B" },
        ],
      },
    ],
  },
];

describe("coverage amount selections", () => {
  it("generates values from multiple ranges with independent increments", () => {
    expect(getCoverageAmountChoices({ coverageAmounts }, "member")).toEqual([
      10000, 20000, 30000, 50000, 100000,
    ]);
  });

  it("preserves explicit numeric lists", () => {
    expect(getCoverageAmountChoices({ coverageAmounts }, "spouse")).toEqual([
      10000, 25000, 50000,
    ]);
  });

  it("selects an arbitrary applicant class more specifically than applicant type", () => {
    const assignment = getCoverageAmountAssignment(
      { coverageAmounts },
      "member",
      "associate-member",
    );
    expect(assignment?.selections?.[0].type).toBe("optionList");
    expect(
      formatCoverageAmounts(
        { coverageAmounts: [assignment!] },
        { "associate-member": "Associate Member" },
      ),
    ).toContain("Associate Member: Plan A, Plan B");
  });
});
