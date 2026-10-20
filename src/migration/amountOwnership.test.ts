import { afterEach, describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { consolidateAmountOwnership } from "./amountOwnership";
import { validateMigrationDatabase } from "./integrity";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { isBenefitPolicy, resolveNormalizedBenefit } from "../domain/benefitPolicy";
import { buildPrototypeAmounts } from "../domain/prototypeProductProjection";
import { buildPrototypeClient } from "../domain/prototypeConfigurationProjection";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveApplicationCoverage } from "../domain/coverageRuntime";
import { validateNormalizedCoverageAmount } from "../domain/normalizedCoverageAmounts";
import { createLibraryDraft, editDraftBenefitPolicy } from "../domain/libraryDraft";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository } from "../repositories/portalDataRepository";

const db = createReviewedMigrationDatabase();
const business = new Set(["abe", "ama", "asce", "avma", "csea", "nso", "isitrust", "waepa", "waepa-gi"]);
afterEach(() => installPrototypeLibrary(null));

describe("single structured amount owner", () => {
  it("links all 18 benefit policies without base-choice copies and retains previous evidence", () => {
    const policies = db.configurationValues.filter(row => db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.target?.kind === "product-benefit-policy");
    expect(policies).toHaveLength(18);
    for (const row of policies) {
      expect(row.value).toMatchObject({ version: 2, amountSource: "product-amount-rules" });
      if (!row.value || typeof row.value !== "object" || Array.isArray(row.value) || !Array.isArray(row.value.applicants)) throw new Error("Invalid fixture");
      for (const applicant of row.value.applicants) {
        expect(applicant).toHaveProperty("amountRuleKey");
        for (const key of ["minimum", "maximum", "increment", "amountChoices"]) expect(applicant).not.toHaveProperty(key);
      }
      expect(db.semanticRequirements.find(evidence => evidence.key === `ownership-evidence.${row.key}`)?.value).toHaveProperty("previousPolicy");
    }
    const copy = structuredClone(db);
    consolidateAmountOwnership(copy);
    expect(copy).toEqual(db);
    expect(validateMigrationDatabase(db)).toEqual([]);
  });

  it("derives every business compatibility amount view from the effective structured owner", () => {
    for (const key of business) {
      const site = resolveEffectiveSite(db, key);
      const { client } = buildPrototypeClient(db, site);
      expect(site.configuration.configurations.filter(row => row.key.startsWith("coverages.coverageAmounts."))).toEqual([]);
      for (const product of site.configuration.products) expect(client.coverages.coverageAmounts?.[product.productKey]).toEqual(buildPrototypeAmounts({ ...product, benefitPolicies: [] }));
    }
    expect(db.semanticRequirements.some(row => row.predicate === "superseded-amount-copy")).toBe(true);
  });

  it("keeps AMA class maxima and the exact CSEA clerical schedule in both normalized and applicant reads", () => {
    const ama = resolveEffectiveSite(db, "ama");
    for (const product of ["di-level-rated", "di-step-rated"]) {
      expect(validateNormalizedCoverageAmount(ama, product, "member", 10000, "practicing").allowed).toBe(true);
      expect(validateNormalizedCoverageAmount(ama, product, "member", 10000, "resident").allowed).toBe(false);
      expect(validateNormalizedCoverageAmount(ama, product, "member", 5000).status).toBe("needs-information");
    }
    const csea = resolveEffectiveSite(db, "csea");
    expect(validateNormalizedCoverageAmount(csea, "di-ltd", "member", 1100, "clerical").allowed).toBe(false);
    expect(validateNormalizedCoverageAmount(csea, "di-ltd", "member", 1100, "non-clerical").allowed).toBe(true);
    const product = csea.configuration.products.find(product => product.productKey === "di-ltd")!;
    expect(buildPrototypeAmounts(product)[0]).toMatchObject({ scope: { applicantClassId: "clerical" }, selections: [{ type: "amountList", values: [1000, 1200, 1300, 1400, 1600, 1700, 1800, 1900, 2000] }] });
  });

  it("propagates a stored WAEPA STD increment edit through compatibility, benefit and applicant decisions", () => {
    const copy = structuredClone(db);
    const rule = copy.productAmountRules.find(row => row.siteKey === "waepa" && row.productKey === "di-short-term")!;
    copy.amountBands.find(row => row.amountPatternKey === rule.amountPatternKey)!.increment = 50;
    const library = resolvePrototypeLibrary(copy, "waepa", "test:amount-owner");
    installPrototypeLibrary(library);
    const product = library.products.find(product => product.id === "di-short-term")!;
    expect(library.client.coverages.coverageAmounts?.[product.id]).toEqual(product.coverageAmounts);
    const benefit = resolveNormalizedBenefit(library.site, product.id, "member", { ageYears: 40, monthlyIncome: 100000, amount: 150 });
    expect(benefit).toMatchObject({ allowed: true, minimum: 100, maximum: 6500, increment: 50 });
    expect(benefit.provenance).toEqual(expect.arrayContaining([expect.objectContaining({ table: "amountBands" }), expect.objectContaining({ table: "productAmountRules", key: rule.key })]));
    const decision = resolveApplicationCoverage(product, "member", { "birth-date": "1990-01-01", "average-monthly-income": 100000, "active-military": "no", "state-province": "VA" }, library.products);
    expect(decision.amounts).toContain(150);
    expect(decision.amounts.at(-1)).toBe(6500);
    const original = resolveEffectiveSite(db, "waepa");
    expect(resolveNormalizedBenefit(original, product.id, "member", { ageYears: 40, monthlyIncome: 100000, amount: 150 }).allowed).toBe(false);
  });

  it.each(["missing", "wrong-class", "wrong-product", "duplicate-scope", "malformed-copy"])("fails closed on a %s amount reference", scenario => {
    const copy = structuredClone(db);
    const rule = copy.productAmountRules.find(row => row.siteKey === "nso" && row.productKey === "di-ltd")!;
    if (scenario === "missing") copy.productAmountRules = copy.productAmountRules.filter(row => row !== rule);
    if (scenario === "wrong-class") rule.applicantClass = "other";
    if (scenario === "wrong-product") rule.productKey = "li-term";
    if (scenario === "duplicate-scope") copy.productAmountRules.push({ ...rule, id: "extra-scope", key: "extra-scope", displayId: 999999999 });
    if (scenario === "malformed-copy") {
      const row = copy.configurationValues.find(row => row.key === "nso.di-ltd.reviewed-benefit-policy")!;
      if (!row.value || typeof row.value !== "object" || Array.isArray(row.value) || !Array.isArray(row.value.applicants)) throw new Error("Missing fixture");
      const applicant = row.value.applicants[0];
      if (!applicant || typeof applicant !== "object" || Array.isArray(applicant)) throw new Error("Missing applicant fixture");
      applicant.minimum = 1;
    }
    expect(resolveNormalizedBenefit(resolveEffectiveSite(copy, "nso"), "di-ltd", "member", { ageYears: 40, monthlyIncome: 10000 })).toMatchObject({ status: "unresolved", allowed: false });
    expect(validateMigrationDatabase(copy)).toContain("Invalid executable benefit policy nso.di-ltd.reviewed-benefit-policy");
  });

  it("preserves captured version 1 behavior and never rewrites its payload during reads", () => {
    const copy = structuredClone(db);
    const row = copy.configurationValues.find(row => row.key === "nso.di-ltd.reviewed-benefit-policy")!;
    const evidence = copy.semanticRequirements.find(row => row.key === "ownership-evidence.nso.di-ltd.reviewed-benefit-policy")!.value;
    if (!evidence || typeof evidence !== "object" || Array.isArray(evidence) || !isBenefitPolicy(evidence.previousPolicy)) throw new Error("Missing old policy");
    const legacy = structuredClone(evidence.previousPolicy);
    legacy.applicants[0].increment = 250;
    row.value = JSON.parse(JSON.stringify(legacy));
    const before = JSON.stringify(copy);
    const site = resolveEffectiveSite(copy, "nso");
    expect(resolveNormalizedBenefit(site, "di-ltd", "member", { ageYears: 40, monthlyIncome: 10000, amount: 750 })).toMatchObject({ allowed: true, increment: 250 });
    expect(buildPrototypeAmounts(site.configuration.products.find(product => product.productKey === "di-ltd")!)[0].selections).toEqual([{ type: "range", min: 500, max: 5000, increment: 250 }]);
    expect(JSON.stringify(copy)).toBe(before);
  });

  it("writes draft amount edits into structured rows while preserving linked policy modifiers", async () => {
    const draft = createLibraryDraft(await createPortalDataRepository(new LocalStorageAdapter(db)).open(), "waepa");
    const before = JSON.stringify(draft);
    const policy = resolveEffectiveSite(draft.data, draft.siteKey).configuration.products.find(product => product.productKey === "di-short-term")!.benefitPolicies[0].value;
    if (!isBenefitPolicy(policy)) throw new Error("Missing policy fixture");
    const edited = editDraftBenefitPolicy(draft, "di-short-term", { ...policy, applicants: policy.applicants.map(row => ({ ...row, increment: 50 })) });
    const row = edited.data.configurationValues.find(row => row.key === "waepa.di-short-term.reviewed-benefit-policy")!;
    expect(row.value).toMatchObject({ version: 2, amountSource: "product-amount-rules" });
    expect(resolveNormalizedBenefit(resolveEffectiveSite(edited.data, edited.siteKey), "di-short-term", "member", { ageYears: 40, monthlyIncome: 100000, amount: 150 })).toMatchObject({ allowed: true, increment: 50 });
    expect(edited.editVersion).toBe(1);
    expect(JSON.stringify(draft)).toBe(before);
  }, 15000);
});
