import { beforeAll, describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { resolveEffectiveSite, type EffectiveSite, type EffectiveSiteData } from "./effectiveSite";
import { isBenefitPolicy } from "./benefitPolicy";
import { buildPrototypeAmounts, buildPrototypeProduct, buildPrototypeRiders } from "./prototypeProductProjection";
import { buildPrototypeClient } from "./prototypeConfigurationProjection";

type Product = EffectiveSite["configuration"]["products"][number];
let data: EffectiveSiteData;
let csea: EffectiveSite;
let asce: EffectiveSite;
beforeAll(() => {
  data = createReviewedMigrationDatabase();
  csea = resolveEffectiveSite(data, "csea");
  asce = resolveEffectiveSite(data, "asce");
});
const disability = () => structuredClone(csea.configuration.products.find(product => product.productKey === "di-ltd")!);

describe("prototype amount precedence", () => {
  it("retains complete-list precedence for historical version 1 benefit policies", () => {
    const product = disability();
    const benefit = product.benefitPolicies[0].value;
    if (!isBenefitPolicy(benefit)) throw new Error("Missing benefit fixture");
    delete benefit.amountSource;
    benefit.applicants[0].minimum = 777;
    const amounts = buildPrototypeAmounts(product);
    expect(amounts[0]).toMatchObject({
      scope: { applicantType: "member", applicantClassId: "clerical" },
      selections: [{ type: "range", min: 777, max: 2000, increment: 100 }],
    });
    expect(amounts).toHaveLength(2);
  });

  it("keeps normalized selections when benefit JSON is invalid or absent", () => {
    const product = disability();
    product.benefitPolicies = [];
    const normalized = buildPrototypeAmounts(product);
    expect(normalized.length).toBeGreaterThan(0);
    product.benefitPolicies = [{ key: "invalid", value: {}, provenance: [] }];
    expect(buildPrototypeAmounts(product)).toEqual(normalized);
  });

  it("does not let valid benefit JSON hide an unresolved normalized assignment", () => {
    const product = disability();
    product.amounts[0].status = "unresolved";
    expect(() => buildPrototypeAmounts(product)).toThrow(`Unresolved amount: ${product.amounts[0].key}`);
  });

  it("projects fixed and derived amounts without inventing selectable ranges", () => {
    const product = disability();
    product.benefitPolicies = [];
    product.amounts = [product.amounts[0]];
    const amount = product.amounts[0].amount!;
    amount.bands = [];
    amount.options = [];
    amount.pattern.value.amountType = "fixed";
    amount.pattern.value.minimum = 5000;
    expect(buildPrototypeAmounts(product)[0].selections).toEqual([{ type: "amountList", values: [5000] }]);
    amount.pattern.value.amountType = "multiplier";
    amount.pattern.value.multiplier = 0.5;
    amount.pattern.value.baseApplicantKey = "member";
    expect(buildPrototypeAmounts(product)[0]).toMatchObject({ derivedFrom: { applicantType: "member", calculation: { type: "percentage", value: 50 } } });
    expect(buildPrototypeAmounts(product)[0].selections).toBeUndefined();
  });
});

function withNormalizedRider(): Product {
  const product = disability();
  product.riderOwnership = "legacy";
  product.presentation = product.presentation.filter(value => value.key !== "riders");
  product.riders = [{ key: "rider", enabled: true, provenance: [], amounts: [], definition: {
    value: { id: "rider", name: "Normalized rider", description: "Coverage", premiumFactor: null }, provenance: [],
  } }];
  return product;
}

describe("prototype rider precedence", () => {
  it("lets an empty presentation override suppress normalized riders", () => {
    const product = withNormalizedRider();
    product.presentation.push({ key: "riders", value: [], provenance: [] });
    expect(buildPrototypeRiders(product)).toEqual([]);
  });

  it("retains the enabled normalized fallback and its existing premium factor default", () => {
    const product = withNormalizedRider();
    expect(buildPrototypeRiders(product)).toEqual([{ id: "rider", name: "Normalized rider", description: "Coverage", premiumFactor: 0 }]);
    product.presentation.push({ key: "riders", value: null, provenance: [] });
    expect(buildPrototypeRiders(product)).toHaveLength(1);
    product.riders[0].enabled = false;
    expect(buildPrototypeRiders(product)).toEqual([]);
  });
});

it("keeps global period fallback arrays independent for each applicant", () => {
  const product = structuredClone(asce.configuration.products.find(product => product.productKey === "li-10yr")!);
  product.benefitPeriods = [{ key: "global-waiting", provenance: [], value: {
    productKey: "li-10yr", siteKey: "asce", applicantTypeKey: null, kind: "waiting", value: "30-days", label: "30 days", days: 30, position: 0,
  } }];
  const { client } = buildPrototypeClient(data, asce);
  const coverage = buildPrototypeProduct(data, asce, client, product);
  const member = coverage.waitingPeriodOptionsByApplicant?.member;
  const spouse = coverage.waitingPeriodOptionsByApplicant?.spouse;
  expect(member).toEqual([{ label: "30 days", value: "30-days", days: 30 }]);
  expect(spouse).toEqual(member);
  expect(spouse).not.toBe(member);
  expect(member).not.toBe(coverage.waitingPeriodOptions);
});
