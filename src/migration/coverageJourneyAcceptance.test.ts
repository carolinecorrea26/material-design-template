import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createReviewedMigrationDatabase, createMigrationDatabase } from "./fixtures";
import { applyCoverageJourneyAdoption } from "./coverageJourneyAdoption";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { resolveEffectiveSite, type EffectiveSite } from "../domain/effectiveSite";
import { isSelectionPolicy, reconcileCoverageSelection, type SelectionPolicy } from "../domain/coverageSelectionPolicy";
import { isCoverageJourneyPolicy, resolveCoverageJourneyPolicy, resolveSubmissionMapping, reconcileDependentElections, resolveBilling } from "../domain/coverageJourneyPolicy";
import { applicantAge, evaluateCoverageJourney, resolveQuestionParticipation, resolveScheduledChildren, resolveJourneyUnderwriting, type CoverageJourneyInput } from "../domain/coverageJourney";
import { createMockPolicyVerificationService, type VerifiedPolicy } from "../domain/policyVerification";
import { validateMigrationDatabase } from "./integrity";
import { resolveRatePresentation } from "../domain/ratePresentation";
import { resolveNormalizedResidency } from "../domain/residencyPolicy";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import { completeSourceHealthFixture } from "./sourceQuestionnaireFixture";

const db = createReviewedMigrationDatabase();
const now = () => Date.parse("2026-10-02T12:00:00Z");
const site = (key: string) => resolveEffectiveSite(JSON.parse(JSON.stringify(db)), key);
const policyFixture = (s: EffectiveSite, productKey: string, applicantKey = "member"): VerifiedPolicy => ({ policyId: "mock-existing-1", ownerReference: "mock-owner", siteKey: s.siteKey, productKey, applicantKey, status: "active", amount: 100000, riders: [], permittedChanges: ["increase", "rider-only"], billing: { method: "bank-account", frequency: "monthly" }, effectiveDate: "2026-10-02", expiresAt: now() + 300000 });
function answers(s: EffectiveSite, input: CoverageJourneyInput): CoverageJourneyInput {
  const p = resolveCoverageJourneyPolicy(s, input.productKey)!;
  const q = p.questions.find(q => q.applicantKey === input.applicantKey && q.modes.includes(input.mode))!;
  const healthPage = input.election.riders.some(key => s.configuration.products.find(p => p.productKey === input.productKey)!.riders.find(r => r.key === key)?.definition?.value.id === "cir") ? "health-li" : q.healthPage;
  const fields = s.configuration.pages.flatMap(p => p.fields).filter(f => q.financialFields.includes(f.key) || q.tobaccoFields.includes(f.key) || healthPage && f.key.startsWith(`${healthPage}-q`) && f.key.endsWith("-spouse") === (input.applicantKey === "spouse"));
  const result: CoverageJourneyInput = { ...input, answers: Object.fromEntries(fields.map(f => [f.key, f.definition.options?.find(o => o.value === "no")?.value ?? f.definition.options?.[0]?.value ?? (f.definition.inputType === "number" ? 100000 : "mock-answer")])), attestations: [q.attestationKey] };
  result.answers = completeSourceHealthFixture(s, result);
  return result;
}
const inputForRider = (s: EffectiveSite, productKey: string, key: string, applicantKey = "member") => answers(s, { productKey, applicantKey, mode: "rider-only", amount: 0, membershipConfirmed: true, eligibility: { ageYears: 40, workHoursPerWeek: 40, activeMilitary: false, selectedPlans: [{ productKey, categoryKey: "LI", applicantKey: "member" }] }, jurisdiction: "US-PA", election: { riders: [key], riderAmounts: { [key]: 50000 } }, existingPolicy: { policyId: "mock-existing-1", ownerReference: "mock-owner" } });

describe("Step 3 candidate acceptance after persistence", () => {
  it("captures all enabled products/applicants/modes across ten Sites with provenance and complete mock submission roles", () => {
    const report = [];
    expect(validateMigrationDatabase(db)).toEqual([]);
    for (const scope of activeSiteMigrationScope.sites) {
      const s = site(scope.key);
      for (const product of s.configuration.products) {
        const p = resolveCoverageJourneyPolicy(s, product.productKey)!;
        expect(isCoverageJourneyPolicy(p), `${scope.key}/${product.productKey}`).toBe(true);
        expect(product.journeyPolicies).toHaveLength(1);
        expect(product.journeyPolicies[0].provenance.length).toBeGreaterThan(0);
        const selection = product.selectionPolicies[0].value as SelectionPolicy;
        expect(isSelectionPolicy(selection)).toBe(true);
        for (const applicant of s.products.find(x => x.productKey === product.productKey)!.applicants) {
          expect(applicant.constraints?.value.minimumAgeYears !== null || applicant.constraints?.value.minimumAgeDays !== null).toBe(true);
          expect(applicant.constraints?.value.maximumAgeYears).not.toBeNull();
          for (const mode of selection.modes.filter(m => m !== "rider-only" || selection.riderOnlyApplicants.includes(applicant.applicantKey))) {
            expect(p.mappings.some(m => m.when.applicantKey === applicant.applicantKey && m.when.mode === mode)).toBe(true);
            expect(p.questions.filter(q => q.applicantKey === applicant.applicantKey && q.modes.includes(mode))).toHaveLength(1);
          }
        }
        for (const mapping of p.mappings) {
          expect(resolveSubmissionMapping(p, mapping.when)).toMatchObject({ status: "resolved", mapping });
          for (const value of Object.values(mapping.identifiers)) for (const role of ["display", "rating", "issue", "xml", "pdf"] as const) expect(value[role]).toBeTruthy();
          expect(Object.keys(mapping.riderCodes).sort()).toEqual(selection.riders.map(r => r.key).sort());
        }
        expect(resolveBilling(p, p.payment.defaultMethod ?? "bank-account", p.payment.defaultFrequency ?? "monthly", null).displayPrice).toBe(false);
        expect(resolveNormalizedResidency(s, product.productKey, p.applicants[0], {}).status).toBe("needs-information");
        expect(resolveNormalizedResidency(s, product.productKey, p.applicants[0], { jurisdiction: "FR-Paris", activeMilitary: false }).allowed).toBe(false);
        report.push({ siteKey: s.siteKey, productKey: product.productKey, applicants: p.applicants, modes: selection.modes, mappings: p.mappings.length, executableContract: "passed", sourceApproval: scope.mcrRequired ? "provisional-revisit" : "synthetic", publicationReady: false });
      }
    }
    expect(new Set(report.map(r => r.siteKey)).size).toBe(10);
    if (process.env.STEP3_ACCEPTANCE_DIR) {
      mkdirSync(resolve(process.env.STEP3_ACCEPTANCE_DIR), { recursive: true });
      writeFileSync(resolve(process.env.STEP3_ACCEPTANCE_DIR, "step3-contract-acceptance.json"), JSON.stringify({ scope: "persisted contracts and conditional mappings; scenario tests are separate", products: report, sourceApproval: "deferred", fullProductAcceptance: "pending", runtimeActivation: "pending" }, null, 2) + "\n");
    }
  });
  it("asce offers CIR only as a normal rider, never on its own (CHG-007)", () => {
    const selection = site("asce").configuration.products.find(p => p.productKey === "li-term")!.selectionPolicies[0].value as { modes: string[]; riderOnlyApplicants: string[] };
    expect(selection.modes).not.toContain("rider-only");
    expect(selection.riderOnlyApplicants).toEqual([]);
  });
  for (const [siteKey, productKey] of [["avma", "li-group-term"], ["waepa", "li-group-term"]]) {
    it(`${siteKey} verifies and maps CIR-only without new base life or new billing`, async () => {
      const s = site(siteKey);
      const rider = s.configuration.products.find(p => p.productKey === productKey)!.riders.find(r => r.definition?.value.id === "cir")!.key;
      const input = inputForRider(s, productKey, rider);
      const policies = createMockPolicyVerificationService([policyFixture(s, productKey)], now);
      const result = await evaluateCoverageJourney(s, input, { policies, now });
      expect(result, JSON.stringify(result)).toMatchObject({ allowed: true, skipPayment: true, skipBeneficiary: true, submission: { amount: 0, existingAmount: 100000, existingPolicyId: "mock-existing-1", riders: [{ code: siteKey === "avma" ? "R44" : "R34" }] } });
      expect((await evaluateCoverageJourney(s, { ...input, existingPolicy: undefined }, { policies, now })).allowed).toBe(false);
      expect((await evaluateCoverageJourney(s, { ...input, amount: 100000 }, { policies, now })).allowed).toBe(false);
      expect((await evaluateCoverageJourney(s, { ...input, jurisdiction: "US-CT" }, { policies, now })).allowed).toBe(false);
      expect((await evaluateCoverageJourney(s, { ...input, existingPolicy: { ...input.existingPolicy!, ownerReference: "wrong" } }, { policies, now })).errors).toContain("Policy verification mismatch");
    });
  }
  it("rejects inactive, expired, wrong-scope, disallowed and failed policy verification", async () => {
    const s = site("avma"), key = s.configuration.products.find(p => p.productKey === "li-group-term")!.riders.find(r => r.definition?.value.id === "cir")!.key;
    const input = inputForRider(s, "li-group-term", key);
    for (const patch of [{ status: "lapsed" as const }, { expiresAt: now() }, { siteKey: "asce" }, { permittedChanges: [] }]) {
      const policies = createMockPolicyVerificationService([{ ...policyFixture(s, "li-group-term"), ...patch }], now);
      expect((await evaluateCoverageJourney(s, input, { policies, now })).allowed).toBe(false);
    }
    expect((await evaluateCoverageJourney(s, input, { policies: { verify: async () => { throw new Error("offline"); } }, now })).errors).toContain("Policy verification unavailable");
    const forged = { ...policyFixture(s, "li-group-term"), productKey: "li-add" };
    expect((await evaluateCoverageJourney(s, input, { policies: { verify: async () => ({ status: "verified", source: "mock", policy: forged }) }, now })).allowed).toBe(false);
  });
  it("requires existing-policy increase totals above verified amount, ignores a caller's old amount", async () => {
    const s = site("avma");
    const fixture = policyFixture(s, "li-group-term");
    const policies = createMockPolicyVerificationService([fixture], now);
    const input = answers(s, { ...inputForRider(s, "li-group-term", s.configuration.products.find(p => p.productKey === "li-group-term")!.riders.find(r => r.definition?.value.id === "cir")!.key), mode: "increase", amount: 150000, payment: { method: "bank-account", frequency: "monthly" } });
    expect((await evaluateCoverageJourney(s, input, { policies, now })).allowed).toBe(true);
    expect((await evaluateCoverageJourney(s, { ...input, amount: 100000 }, { policies, now })).allowed).toBe(false);
  });
  it("executes CSEA dependent elections, attestation, defaults, withdrawal cleanup and reference table", () => {
    const s = site("csea"), p = resolveCoverageJourneyPolicy(s, "di-ltd")!;
    const initial = reconcileDependentElections(p, {}, true);
    expect(initial.elections).toMatchObject({ "spouse-accident-disability": { selected: true, amount: 500, signatureRequired: false }, "child-outpatient-accident": { selected: true, amount: 50, signatureRequired: false } });
    expect(initial.allowed).toBe(false);
    expect(reconcileDependentElections(p, { "spouse-accident-disability": { selected: true, amount: 1000, attested: true }, "child-outpatient-accident": { selected: true, attested: true } }).allowed).toBe(true);
    expect(reconcileDependentElections(p, { "spouse-accident-disability": { selected: true, amount: 750, attested: true } }).allowed).toBe(false);
    expect(reconcileDependentElections(p, { "child-outpatient-accident": { selected: false, amount: 500, attested: true }, orphan: { selected: true, amount: 100 } }).elections).toMatchObject({ "child-outpatient-accident": { selected: false, amount: null, attested: false } });
    expect(resolveRatePresentation(s, "di-ltd")).toMatchObject({ rateArea: "reference-link", hideCalculatedRates: true, quoteToolEnabled: false, referenceTable: { kind: "html-table" } });
    expect(p.payment.collection).toBe("none");
  });
  it("evaluates WAEPA children individually on schedule/calendar boundaries and spouse-only primary coverage", () => {
    const s = site("waepa");
    const result = resolveScheduledChildren(s, "li-group-term", [{ key: "young", birthDate: "2026-04-03" }, { key: "older", birthDate: "2026-04-02" }], "2026-10-02", { member: 100000, spouse: 0 });
    expect(result).toMatchObject({ allowed: true, children: [{ key: "young", amount: 1000 }, { key: "older", amount: 10000 }] });
    expect(resolveScheduledChildren(s, "li-group-term", [{ key: "child", birthDate: "2020-10-02" }], "2026-10-02", { member: 0, spouse: 10000 })).toMatchObject({ allowed: true, children: [{ amount: 5000 }] });
    expect(resolveScheduledChildren(s, "li-group-term", [{ key: "child", birthDate: "2000-10-02" }], "2026-10-02", { member: 100000, spouse: 0 }).allowed).toBe(false);
    expect(resolveScheduledChildren(s, "li-group-term", [{ key: "child", birthDate: "2026-02-30" }], "2026-10-02", { member: 100000, spouse: 0 }).allowed).toBe(false);
    expect(resolveScheduledChildren(s, "li-group-term", [{ key: "a", birthDate: "2020-01-01" }, { key: "a", birthDate: "2021-01-01" }], "2026-10-02", { member: 100000, spouse: 0 }).allowed).toBe(false);
    expect(applicantAge("2000-02-29", "2025-02-28")?.ageYears).toBe(24);
    expect(applicantAge("2000-02-29", "2025-03-01")?.ageYears).toBe(25);
  });
  it("accepts a complete child-only WAEPA candidate with spouse-linked schedule and no child health/payment", async () => {
    const s = site("waepa"), p = resolveCoverageJourneyPolicy(s, "li-group-term")!;
    const q = p.questions.find(q => q.applicantKey === "child" && q.modes.includes("new"))!;
    const input: CoverageJourneyInput = { productKey: "li-group-term", applicantKey: "child", mode: "new", amount: 5000, memberAmount: 0, spouseAmount: 10000, onlyChild: true, membershipConfirmed: true, eligibility: { ageYears: 10, ageDays: 3652, activeMilitary: false, fullTimeStudent: true, selectedPlans: [{ productKey: "li-group-term", categoryKey: "LI", applicantKey: "spouse" }] }, jurisdiction: "US-PA", election: { riders: [], riderAmounts: {} }, attestations: [q.attestationKey] };
    const result = await evaluateCoverageJourney(s, input, { policies: createMockPolicyVerificationService([]) });
    expect(result).toMatchObject({ allowed: true, skipPayment: true, questions: { healthPage: null }, submission: { amount: 5000, payment: null } });
    expect((await evaluateCoverageJourney(s, { ...input, spouseAmount: undefined }, { policies: createMockPolicyVerificationService([]) })).allowed).toBe(false);
  });
  it("limits AVMA FPO by age, requested benefit, combined policy cap and new-applicant minimum", () => {
    const s = site("avma"), p = s.configuration.products.find(p => p.productKey === "di-ltd")!.selectionPolicies[0].value as SelectionPolicy;
    const key = p.riders[0].key, election = { riders: [key], riderAmounts: { [key]: 7000 } };
    const facts = { mode: "new" as const, applicantKey: "member", baseAmount: 10000, ageYears: 49 };
    expect(reconcileCoverageSelection(p, facts, election).election.riderAmounts[key]).toBe(500);
    expect(reconcileCoverageSelection(p, { ...facts, baseAmount: 12400 }, election).election.riders).toEqual([]);
    expect(reconcileCoverageSelection(p, { ...facts, ageYears: 50 }, election).election.riders).toEqual([]);
    expect(reconcileCoverageSelection(p, { ...facts, baseAmount: 2000 }, { riders: [key], riderAmounts: { [key]: 100 } }).election.riderAmounts[key]).toBe(500);
  });
  it("requires an enabled ISI association and maps every retained association explicitly", () => {
    const s = site("isitrust"), p = resolveCoverageJourneyPolicy(s, "li-group-term")!;
    expect(p.associationChoices).toHaveLength(26);
    expect(resolveSubmissionMapping(p, { applicantKey: "member", mode: "new" }).status).toBe("needs-information");
    expect(resolveSubmissionMapping(p, { applicantKey: "member", mode: "new", associationKey: "ATPE" }).status).toBe("unresolved");
    for (const choice of p.associationChoices) {
      const gNumber = choice.key === atpeAssociationKey ? "G-31139-0" : "G-31136-0";
      expect(resolveSubmissionMapping(p, { applicantKey: "member", mode: "new", associationKey: choice.key })).toMatchObject({ status: "resolved", mapping: { identifiers: { gNumber: { issue: gNumber, xml: gNumber }, planCode: { issue: "101" } } } });
    }
    const avma = resolveCoverageJourneyPolicy(site("avma"), "di-ltd")!;
    expect(avma.mappings[0].identifiers.gNumber).toMatchObject({ portalDummy: "G-14884-11", issue: "G-14884-0" });
    expect(resolveSubmissionMapping(resolveCoverageJourneyPolicy(site("csea"), "di-ltd")!, { applicantKey: "member", mode: "new", applicantClass: "unknown" }).status).toBe("unresolved");
  });
  it("retains approved ASCE underwriting bands and requests the corresponding health questions", () => {
    const s = site("asce");
    expect(resolveJourneyUnderwriting(s, "li-10yr", "member", 40, 500000)).toMatchObject({ status: "resolved", pathway: "QD" });
    expect(resolveJourneyUnderwriting(s, "li-10yr", "member", 61, 500001)).toMatchObject({ status: "resolved", pathway: "FUW" });
    expect(resolveJourneyUnderwriting(s, "li-10yr", "member", 65, 100000)).toMatchObject({ status: "resolved", pathway: "FUW" });
    expect(resolveJourneyUnderwriting(s, "li-10yr", "member", 70, 100000).status).toBe("unresolved");
    const q = resolveCoverageJourneyPolicy(s, "li-10yr")!.questions.find(q => q.applicantKey === "member" && q.modes.includes("new"))!;
    expect(resolveQuestionParticipation(s, "li-10yr", "member", "new", { smoker: "no" }, [q.attestationKey], [], "QD").healthPage).toBe("health-qd");
    expect(resolveQuestionParticipation(s, "li-10yr", "member", "new", { smoker: "no" }, [q.attestationKey], [], "FUW").missingFacts).toContain("health-li-q1");
  });
  it("persists ASCE spouse-only residency exceptions without excluding the member", () => {
    const s = site("asce");
    expect(resolveNormalizedResidency(s, "di-ltd", "member", { jurisdiction: "US-NH" }).allowed).toBe(true);
    expect(resolveNormalizedResidency(s, "di-ltd", "spouse", { jurisdiction: "US-NH" }).allowed).toBe(false);
    expect(resolveNormalizedResidency(s, "di-ltd", "member", { jurisdiction: "US-VT" }).allowed).toBe(false);
  });
  it("retains method-specific payment choices, handles unavailable rates and applies modal factors after annual credit", () => {
    const ama = resolveCoverageJourneyPolicy(site("ama"), "li-term")!;
    expect(resolveBilling(ama, "bank-account", "monthly", 1200)).toMatchObject({ status: "resolved", amount: 99.6 });
    expect(resolveBilling(ama, "bank-account", "annual", 1200).status).toBe("unresolved");
    expect(resolveBilling(ama, "bill-me", "semiannual", 1200).amount).toBe(624);
    const p = structuredClone(ama); p.billing.annualCredit = 100; p.billing.feePerCollection["bill-me"] = 5;
    expect(resolveBilling(p, "bill-me", "quarterly", 1100).amount).toBe(270);
    expect(resolveBilling(p, "bill-me", "quarterly", null)).toMatchObject({ status: "unavailable", amount: null, displayPrice: false });
    expect(resolveBilling(p, "bill-me", "quarterly", NaN).displayPrice).toBe(false);
  });
  it("requires scoped health answers and attestations, clears inactive tobacco and orphan answers, and requests yes details", async () => {
    const s = site("avma"), key = s.configuration.products.find(p => p.productKey === "li-group-term")!.riders.find(r => r.definition?.value.id === "cir")!.key;
    const input = inputForRider(s, "li-group-term", key);
    const answer = { ...input.answers, "health-li-q1": "yes", "health-li-q1-spouse": "yes", "unused": "discard", "tobacco-products": ["cigarettes"] };
    const q = resolveQuestionParticipation(s, "li-group-term", "member", "rider-only", answer, input.attestations, [key]);
    expect(q.allowed).toBe(false); expect(q.missingFacts).toContain("health-li-q1.details");
    expect(q.cleanedAnswers).not.toHaveProperty("health-li-q1-spouse");
    expect(q.cleanedAnswers).not.toHaveProperty("unused");
    expect(q.cleanedAnswers).not.toHaveProperty("tobacco-products");
    expect(resolveQuestionParticipation(s, "li-group-term", "member", "rider-only", { ...answer, "health-li-q1.details": "mock details" }, input.attestations, [key]).allowed).toBe(true);
    const policies = createMockPolicyVerificationService([policyFixture(s, "li-group-term")], now);
    expect((await evaluateCoverageJourney(s, { ...input, attestations: [] }, { policies, now })).allowed).toBe(false);
  });
  it("reapplies journey adoption without duplicate riders, shifted mappings or changed records", () => {
    const copy = structuredClone(db);
    applyCoverageJourneyAdoption(copy);
    for (const table of ["configurationDefinitions", "configurationValues", "semanticRequirements", "riders", "productRiders", "eligibilityConstraints"] as const) {
      const expected = [...db[table]].sort((a,b) => a.id.localeCompare(b.id));
      const actual = [...copy[table]].sort((a,b) => a.id.localeCompare(b.id));
      expect(actual.map(r => JSON.stringify(r)), table).toEqual(expected.map(r => JSON.stringify(r)));
    }
  }, 15000);
  it("fails closed on invalid persisted versions and retains compatibility/live fixture boundaries", () => {
    const copy = structuredClone(db);
    copy.configurationValues.find(r => r.key === "isitrust.li-group-term.journey-policy")!.value = { version: 9 };
    expect(validateMigrationDatabase(copy).some(error => error.includes("Invalid executable journey"))).toBe(true);
    expect(resolveCoverageJourneyPolicy(resolveEffectiveSite(copy, "isitrust"), "li-group-term")).toBeNull();
    expect(createMigrationDatabase().configurationDefinitions.some(r => r.definition.target?.kind === "product-journey-policy")).toBe(false);
    expect(site("avma").runtimeActivation).toBe("pending-phase-6");
  });
});
