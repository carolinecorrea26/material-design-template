import { describe, expect, it } from "vitest";
import type { DatabaseSchema } from "../persistence/types";
import { isSupportedAmountPattern, validateEligibilityConstraint, validateUnderwritingBand, validateUnderwritingOverlap } from "./coveragePolicyValidation";

const metadata = { id: "test", key: "test", displayId: 1, providedBy: null, sourceReference: null };
const pattern: DatabaseSchema["coverageAmountPatterns"][number] = {
  ...metadata, patternKey: "amount", amountType: "range", minimum: null, maximum: null, increment: null,
  formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null,
};
const amountBand: DatabaseSchema["amountBands"][number] = {
  ...metadata, amountPatternKey: "test", minimum: 100, maximum: 1000, increment: 100, conditionKey: null, position: 0,
};
const option = (value: string): DatabaseSchema["amountOptions"][number] => ({ ...metadata, amountPatternKey: "test", value, label: value, position: 0 });
const constraint: DatabaseSchema["eligibilityConstraints"][number] = {
  ...metadata, productKey: "life", siteKey: "test", applicantTypeKey: "member",
  minimumAgeDays: null, minimumAgeYears: 18, maximumAgeYears: 65, studentMaximumAgeYears: null, minimumWorkHours: 20,
};
const underwriting: DatabaseSchema["underwritingBands"][number] = {
  ...metadata, productKey: "life", siteKey: "test", applicantTypeKey: "member", pathway: "QD", status: "documented",
  minimumAge: 18, maximumAge: 65, minimumAmount: 100, maximumAmount: 1000, minimumAmountExclusive: false,
  applicantClass: null, mortalityMorbidity: null, conditionKey: null,
};

describe("supported amount contracts", () => {
  it.each(["range", "tiered-range", "range-plus-fixed", "set", "named-option", "fixed", "multiplier"])("accepts a supported %s pattern", amountType => {
    const value = { ...pattern, amountType, minimum: 100, maximum: 100, multiplier: 0.5, baseProductKey: "life", baseApplicantKey: "member" };
    expect(isSupportedAmountPattern(value, [amountBand], [option("100")])).toBe(true);
  });

  it.each([
    { increment: 0 }, { increment: -1 }, { increment: Infinity }, { minimum: null },
    { minimum: -1 }, { maximum: 99 }, { conditionKey: "unsupported" },
  ])("rejects an unsupported band %j", patch => {
    expect(isSupportedAmountPattern(pattern, [{ ...amountBand, ...patch }], [])).toBe(false);
  });

  it("requires each pattern's execution inputs and rejects unsupported formulas", () => {
    expect(isSupportedAmountPattern(pattern, [], [])).toBe(false);
    expect(isSupportedAmountPattern({ ...pattern, formula: "salary * 2" }, [amountBand], [])).toBe(false);
    expect(isSupportedAmountPattern({ ...pattern, amountType: "unknown" }, [amountBand], [])).toBe(false);
    expect(isSupportedAmountPattern({ ...pattern, amountType: "range-plus-fixed" }, [amountBand], [])).toBe(false);
    expect(isSupportedAmountPattern({ ...pattern, amountType: "fixed", minimum: 100, maximum: 200 }, [], [])).toBe(false);
    expect(isSupportedAmountPattern({ ...pattern, amountType: "multiplier", multiplier: 0.5 }, [], [])).toBe(false);
  });

  it("keeps numeric sets distinct from named options", () => {
    const set = { ...pattern, amountType: "set" };
    for (const values of [[], ["100", "100"], [" "], ["NaN"], ["Infinity"], ["-1"]]) {
      expect(isSupportedAmountPattern(set, [], values.map(option))).toBe(false);
    }
    expect(isSupportedAmountPattern(set, [], [option("0"), option("100")])).toBe(true);
    expect(isSupportedAmountPattern({ ...pattern, amountType: "named-option" }, [], [option("salary")])).toBe(true);
  });
});

describe("eligibility constraints", () => {
  it("allows nullable constraints and fractional work hours", () => {
    expect(() => validateEligibilityConstraint({ ...constraint, minimumWorkHours: 20.5 })).not.toThrow();
    expect(() => validateEligibilityConstraint({ ...constraint, minimumAgeYears: null, maximumAgeYears: null })).not.toThrow();
  });

  it.each([
    { minimumAgeDays: -1 }, { minimumAgeYears: 18.5 }, { maximumAgeYears: Infinity },
    { minimumAgeYears: 66 }, { studentMaximumAgeYears: 64 }, { minimumWorkHours: NaN },
  ])("rejects invalid numeric constraints %j", patch => {
    expect(() => validateEligibilityConstraint({ ...constraint, ...patch })).toThrow("Invalid eligibility: test");
  });
});

describe("underwriting scope and boundaries", () => {
  it("supports GI only in its existing Site scope", () => {
    expect(() => validateUnderwritingBand(underwriting, "test", "member")).not.toThrow();
    expect(() => validateUnderwritingBand({ ...underwriting, pathway: "GI" }, "test", "member")).toThrow("Unsupported");
    expect(() => validateUnderwritingBand({ ...underwriting, siteKey: "waepa-gi", pathway: "GI" }, "waepa-gi", "member")).not.toThrow();
  });

  it.each([
    { siteKey: null }, { applicantTypeKey: null }, { status: "planned" }, { pathway: null },
    { conditionKey: "conditional" }, { applicantClass: "class" }, { mortalityMorbidity: "rating" },
    { minimumAge: null }, { maximumAmount: NaN }, { minimumAmount: -1 }, { minimumAge: 66 }, { minimumAmount: 1001 },
  ])("rejects unsupported underwriting %j", patch => {
    expect(() => validateUnderwritingBand({ ...underwriting, ...patch }, "test", "member")).toThrow("Unsupported underwriting rule: test");
  });

  it("preserves inclusive ages and exclusive amount boundaries", () => {
    const lower = { minimumAge: 18, maximumAge: 65, minimumAmount: 100, maximumAmount: 1000, minimumAmountExclusive: false };
    const upper = { ...lower, minimumAmount: 1000, maximumAmount: 2000 };
    expect(() => validateUnderwritingOverlap([lower, upper], "life", "member")).toThrow("Overlapping underwriting: life/member");
    expect(() => validateUnderwritingOverlap([lower, { ...upper, minimumAmountExclusive: true }], "life", "member")).not.toThrow();
    expect(() => validateUnderwritingOverlap([lower, { ...upper, minimumAge: 66 }], "life", "member")).not.toThrow();
    expect(() => validateUnderwritingOverlap([lower, { ...upper, minimumAge: 65 }], "life", "member")).toThrow("Overlapping");
    expect(() => validateUnderwritingOverlap([lower, { ...upper, minimumAmount: 999, minimumAmountExclusive: true }], "life", "member")).toThrow("Overlapping");
  });
});
