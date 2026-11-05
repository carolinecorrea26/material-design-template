import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyCseaPayrollAuthorizationAdoption } from "./cseaPayrollAuthorizationAdoption";
import { currentMcrSource } from "./currentMcr";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { activeReviewBlocks, isReviewPolicy, resolveFraudNotice } from "../domain/reviewPolicy";
import { validateMigrationDatabase } from "./integrity";
import { recordImportantNoticeDeferral, importantNoticeDeferralKey } from "./importantNoticeDeferral";
import { recordPaymentReviewDecisions } from "./paymentReviewDecisions";
import { resolveCoverageJourneyPolicy, resolveBilling } from "../domain/coverageJourneyPolicy";
import { paymentSelectionAllowed } from "../domain/paymentPolicy";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
const text = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Read & Sign" && row.cell === cell)!.value).trim();
const normalized = (text: string) => text.replace(/\s+/g, " ").trim();
it("shows CSEA's source payroll authorization only for the source-linked California DI application", () => {
  const library = resolvePrototypeLibrary(db, "csea", "payroll-source"), policy = library.client.reviewPolicy!;
  for (const [state, product, expected] of [["CA", "di-ltd", true], ["US-CA", "di-ltd", true], ["PA", "di-ltd", false], ["CA", "li-add", false]] as const) for (const healthQuestionParticipation of [false, true]) {
    const block = activeReviewBlocks(policy, [{ productKey: product, category: product === "di-ltd" ? "DI" : "AD", applicants: ["member"] }], { jurisdiction: state, healthQuestionParticipation }).find(block => block.key === "california-payroll-authorization");
    expect(!!block).toBe(expected);
    if (block) expect(block).toMatchObject({ placement: "before-member-signature", paragraphs: [text("C120")], fields: [] });
  }
  const copy = structuredClone(db); applyCseaPayrollAuthorizationAdoption(copy); expect(copy).toEqual(db);
  const row = copy.configurationValues.find(row => row.key === "csea.review-policy")!;
  if (!isReviewPolicy(row.value)) throw new Error("Invalid fixture");
  row.value.blocks.find(block => block.key === "california-payroll-authorization")!.paragraphs = ["Edited payroll wording"];
  expect(resolvePrototypeLibrary(copy, "csea", "after").client.reviewPolicy!.blocks.find(block => block.key === "california-payroll-authorization")!.paragraphs).toEqual(["Edited payroll wording"]);
  expect(library.client.reviewPolicy!.blocks.find(block => block.key === "california-payroll-authorization")!.paragraphs).toEqual([text("C120")]);
  expect(resolvePrototypeLibrary(copy, "abe", "unchanged").site).toEqual(resolvePrototypeLibrary(db, "abe", "unchanged").site);
  expect(validateMigrationDatabase(db)).toEqual([]);
});
it("matches the current source fraud-notice matrix, NY Life suppression and CSEA override", () => {
  const jurisdictions = { CO: 56, CA: 57, AL: 58, AR: 59, LA: 60, PA: 61, RI: 62, MD: 63, DC: 64, FL: 65, KS: 66, ME: 67, NJ: 68, NY: 69, OK: 70, PR: 71, TN: 72, WA: 73, VA: 74, VT: 76 };
  for (const siteKey of ["abe", "ama", "asce", "avma", "csea", "nso", "isitrust", "waepa", "waepa-gi"]) {
    const policy = resolvePrototypeLibrary(db, siteKey, "fraud-source").client.reviewPolicy!;
    expect(normalized(policy.fraud.defaultText)).toBe(normalized(text("C55")));
    expect(Object.keys(policy.fraud.byJurisdiction).sort()).toEqual(Object.keys(jurisdictions).sort());
    for (const [state, row] of Object.entries(jurisdictions)) {
      expect(normalized(policy.fraud.byJurisdiction[state])).toBe(normalized(text(`C${row}`)));
      const actual = resolveFraudNotice(policy, `US-${state}`, [{ productKey: "accident", category: "AD", applicants: ["member"] }]);
      expect(normalized(actual!)).toBe(normalized(text(`C${siteKey === "csea" ? 69 : row}`)));
    }
    expect(resolveFraudNotice(policy, undefined, [{ productKey: "term", category: "LI", applicants: ["member"] }])).toBeNull();
    expect(resolveFraudNotice(policy, "NY", [{ productKey: "ordinary-life", category: "LI", applicants: ["member"] }])).toBe(siteKey === "csea" ? policy.fraud.overrideText : null);
    for (const productKey of policy.fraud.nyAccidentLifeProducts ?? []) expect(normalized(resolveFraudNotice(policy, "NY", [{ productKey, category: "LI", applicants: ["member"] }])!)).toBe(normalized(text("C69")));
  }
});
it("records the IMPORTANT NOTICE viewer as an explicit nonblocking deferral", () => {
  const copy = structuredClone(db); recordImportantNoticeDeferral(copy); expect(copy).toEqual(db);
  expect(db.semanticRequirements.find(row => row.key === importantNoticeDeferralKey)!.value).toMatchObject({ sourceReconciliation: "deferred-by-user", completionBlocking: false, sourceReferences: expect.arrayContaining(["Read & Sign!B40", "Read & Sign!B156", "Read & Sign!B187"]) });
});
it("retains WAEPA monthly methods and NSO zero fees at their native owners", () => {
  const copy = structuredClone(db); recordPaymentReviewDecisions(copy); expect(copy).toEqual(db);
  for (const site of ["waepa", "waepa-gi"]) {
    const library = resolvePrototypeLibrary(db, site, "monthly-payment");
    for (const product of library.products) {
      const policy = resolveCoverageJourneyPolicy(library.site, product.id)!;
      expect(paymentSelectionAllowed(policy.payment, "bank-account", "monthly")).toBe(true);
      expect(paymentSelectionAllowed(policy.payment, "credit-card", "monthly")).toBe(true);
      expect(paymentSelectionAllowed(policy.payment, "credit-card", "annual")).toBe(false);
      expect(paymentSelectionAllowed(policy.payment, "bill-me", "monthly")).toBe(false);
    }
  }
  const library = resolvePrototypeLibrary(db, "nso", "zero-fee");
  for (const product of library.products) expect(resolveBilling(resolveCoverageJourneyPolicy(library.site, product.id)!, "bill-me", "annual", 100)).toMatchObject({ status: "resolved", amount: 100 });
});
