import { beforeAll, describe, expect, it } from "vitest";
import { createMigrationDatabase, migrationSiteKeys } from "../migration/fixtures";
import { resolveDatabaseSite } from "../migration/resolve";
import type { DatabaseSchema } from "../persistence/types";
import { resolveEffectiveEligibility, resolveEffectiveUnderwriting, resolveEffectiveSite } from "./effectiveSite";
import { effectiveConfigurationTables, resolveEffectiveAmount } from "./effectiveConfiguration";

let db: DatabaseSchema;
beforeAll(() => { db = createMigrationDatabase(); });
describe("Phase 6B normalized domain configuration", () => {
  for (const siteKey of migrationSiteKeys) it(`${siteKey}: configuration parity and provenance`, () => {
    const site = resolveEffectiveSite(db, siteKey), actual = site.configuration;
    const expected = resolveDatabaseSite(db, siteKey);
    expect(Object.fromEntries(actual.branding.map(r => [r.key, r.value]))).toEqual(expected.branding);
    expect(Object.fromEntries(actual.support.map(r => [r.key, r.value]))).toEqual(expected.support);
    expect(actual.pages.map(p => [p.key, p.requirement])).toEqual(expected.pages.map(p => [p.id, p.requirement]));
    for (const page of actual.pages) {
      expect(page.fields.map(f => ({ included: f.included, field: f.definition }))).toEqual(expected.fields.find(f => f.pageId === page.key)?.fields ?? []);
      expect(page.provenance[0].table).toBe("sitePages");
      for (const field of page.fields) expect(field.provenance.some(p => p.table === "fields")).toBe(true);
    }
    for (const flow of actual.flows) {
      const legacy = expected.flows.find(f => f.id === flow.key)!;
      expect(flow.steps.map(s => s.value.definition)).toEqual(legacy.nodes);
      expect(flow.transitions.map(e => e.value.definition)).toEqual(legacy.edges);
    }
    for (const entry of actual.content) {
      const path = db.contentEntries.find(r => r.key === entry.key)!.definition.path;
      if (path) expect(entry.value).toEqual(path.reduce<unknown>((value, key) => (value as Record<string, unknown>)?.[key], expected.content));
      expect(entry.provenance.length).toBeGreaterThan(0);
    }
    for (const product of actual.products) {
      const legacy = expected.coverage.find(p => p.id === product.productKey)!.effective;
      for (const property of product.presentation) expect(property.value).toEqual(legacy[property.key]);
      expect(product.amounts).toHaveLength(legacy.coverageAmounts?.length ?? 0);
      product.amounts.forEach((amount, i) => {
        const assignment = legacy.coverageAmounts![i];
        expect(amount.value.applicantTypeKey).toBe(assignment.scope?.applicantType ?? null);
        expect(amount.amount!.bands.map(b => [b.value.minimum, b.value.maximum, b.value.increment])).toEqual((assignment.selections ?? []).flatMap(s => s.type === "range" ? [[s.min, s.max, s.increment]] : []));
        expect(amount.amount!.options.map(o => [o.value.value, o.value.label])).toEqual((assignment.selections ?? []).flatMap(s => s.type === "amountList" ? s.values.map(v => [String(v), String(v)]) : s.type === "optionList" ? s.options.map(o => [o.value, o.label]) : []));
        expect(amount.amount!.pattern.value.baseApplicantKey).toBe(assignment.derivedFrom?.applicantType ?? null);
        expect(amount.provenance[0].table).toBe("productAmountRules");
      });
      expect(product.riders.map(r => r.definition!.value.id)).toEqual((legacy.riders ?? []).map(r => r.id));
      if (legacy.requirements?.benefitLimit) {
        const limit = product.limits.find(l => l.value.productKey === product.productKey)!;
        expect(limit.value.maximum).toBe(legacy.requirements.benefitLimit.defaultMaximum);
        expect(limit.caps.map(c => c.value.maximum)).toEqual(legacy.requirements.benefitLimit.caps.map(c => c.maximum));
      }
    }
    expect(site.resolution.completeness).toBe("partial");
    expect(site.resolution.implementedScopes.filter(s => s.decisions.includes("underwriting")).length).toBe(siteKey === "asce" ? 4 : 0);
  });
  it("executes every advertised capability with its required facts across all Sites", () => {
    for (const siteKey of migrationSiteKeys) {
      const site = resolveEffectiveSite(db, siteKey);
      for (const scope of site.resolution.implementedScopes) {
        const applicant = site.products.find(p => p.productKey === scope.productKey)!.applicants.find(a => a.applicantKey === scope.applicantKey)!;
        const c = applicant.constraints!.value;
        const product = site.configuration.products.find(p => p.productKey === scope.productKey)!;
        const facts = { ageYears: c.minimumAgeYears ?? 1, ageDays: c.minimumAgeDays ?? 365, fullTimeStudent: false, workHoursPerWeek: c.minimumWorkHours ?? 0,
          selectedPlans: product.dependencies.filter(r => r.value.applicantTypeKey === scope.applicantKey).map(({ value: r }) => ({ productKey: scope.productKey, categoryKey: r.categoryKey, applicantKey: r.requiresApplicantKey })) };
        expect(resolveEffectiveEligibility(site, scope.productKey, scope.applicantKey, facts).status, `${siteKey}/${scope.productKey}/${scope.applicantKey}`).toBe("resolved");
        if (scope.decisions.includes("underwriting")) {
          const band = applicant.underwriting[0].value;
          expect(resolveEffectiveUnderwriting(site, scope.productKey, scope.applicantKey, band.minimumAge, band.minimumAmount + (band.minimumAmountExclusive ? 1 : 0)).status).toBe("resolved");
        }
      }
    }
  });
  it("withdraws capabilities for missing, conditional, duplicate applicant assignments and invalid plan limits", () => {
    for (const mutation of ["missing", "conditional", "duplicate", "maximum"] as const) {
      const changed = structuredClone(db);
      const row = changed.productApplicantEligibility.find(r => r.siteKey === "asce" && r.productKey === "li-10yr" && r.applicantTypeKey === "member")!;
      if (mutation === "missing") changed.productApplicantEligibility = changed.productApplicantEligibility.filter(r => r !== row);
      if (mutation === "conditional") row.conditionKey = "unsupported";
      if (mutation === "duplicate") changed.productApplicantEligibility.push({ ...row, key: "duplicate-assignment", id: "duplicate-assignment" });
      if (mutation === "maximum") changed.maximumPlanRules.push({ ...row, id: "invalid-limit", key: "invalid-limit", siteKey: "asce", productKey: "li-10yr", applicantTypeKey: "member", categoryKey: "LI", count: -1 });
      const site = resolveEffectiveSite(changed, "asce");
      expect(site.resolution.implementedScopes.some(s => s.productKey === "li-10yr" && s.applicantKey === "member")).toBe(false);
      expect(resolveEffectiveEligibility(site, "li-10yr", "member", 30).status).toBe("unresolved");
    }
  });
  it("resolves semantic targets independently of legacy paths and definition keys", () => {
    const changed = structuredClone(db);
    changed.configurationDefinitions.forEach((row, index) => {
      const previous = row.key;
      row.key = `semantic-${index}`;
      row.definition.path = ["irrelevant", "legacy", "path"];
      changed.configurationValues.filter(v => v.configurationKey === previous).forEach(v => { v.configurationKey = row.key; });
    });
    for (const key of migrationSiteKeys) {
      const actual = resolveEffectiveSite(changed, key).configuration.products;
      const expected = resolveEffectiveSite(db, key).configuration.products;
      expect(actual.map(p => ({ presentation: p.presentation, riders: p.riders }))).toEqual(expected.map(p => ({ presentation: p.presentation, riders: p.riders })));
    }
  });
  it("is deterministic across every persisted table and detached from input", () => {
    const changed = structuredClone(db);
    for (const table of Object.keys(changed) as (keyof DatabaseSchema)[]) changed[table].reverse();
    expect(resolveEffectiveSite(changed, "asce")).toEqual(resolveEffectiveSite(db, "asce"));
    const site = resolveEffectiveSite(changed, "asce");
    site.configuration.pages[0].fields[0].definition.label = "changed";
    expect(resolveEffectiveSite(changed, "asce").configuration.pages[0].fields[0].definition.label).not.toBe("changed");
  });
  it("exposes unsupported rates and conditional flow behavior explicitly", () => {
    const site = resolveEffectiveSite(db, "asce");
    expect(site.configuration.issues.some(i => i.domain === "rates")).toBe(true);
    expect(site.configuration.issues.some(i => i.domain === "flows" && i.reason.includes("predicate"))).toBe(true);
    expect(site.runtimeActivation).toBe("pending-phase-6");
  });
  it("marks missing references unresolved and rejects ambiguous configuration values", () => {
    const changed = structuredClone(db);
    const rule = changed.productAmountRules.find(r => r.siteKey === "asce")!;
    rule.amountPatternKey = "missing-pattern";
    expect(resolveEffectiveSite(changed, "asce").configuration.issues).toContainEqual(expect.objectContaining({ key: "missing-pattern" }));
    const value = changed.configurationValues.find(r => r.scope === "global")!;
    changed.configurationValues.push({ ...value, id: "duplicate", key: "duplicate" });
    expect(() => resolveEffectiveSite(changed, "asce")).toThrow("Ambiguous configurationValues");
  });
  it("executes child age/day, student, and dependent coverage constraints", () => {
    const site = resolveEffectiveSite(db, "asce");
    const product = site.products.find(p => p.applicants.some(a => a.applicantKey === "child" && a.constraints))!;
    const child = product.applicants.find(a => a.applicantKey === "child")!;
    const c = child.constraints!.value;
    const facts = { ageDays: Math.max(c.minimumAgeDays ?? 0, 365), ageYears: c.minimumAgeYears ?? 1, fullTimeStudent: false, selectedPlans: [{ productKey: product.productKey, categoryKey: "LI", applicantKey: "member" }] };
    expect(resolveEffectiveEligibility(site, product.productKey, "child", facts)).toMatchObject({ status: "resolved", eligible: true });
    expect(resolveEffectiveEligibility(site, product.productKey, "child")).toMatchObject({ status: "needs-information" });
    if (c.minimumAgeDays !== null) expect(resolveEffectiveEligibility(site, product.productKey, "child", { ...facts, ageDays: c.minimumAgeDays - 1 })).toMatchObject({ status: "resolved", eligible: false });
    if (c.maximumAgeYears !== null && c.studentMaximumAgeYears !== null) {
      expect(resolveEffectiveEligibility(site, product.productKey, "child", { ...facts, ageYears: c.maximumAgeYears + 1, fullTimeStudent: false })).toMatchObject({ status: "resolved", eligible: false });
      expect(resolveEffectiveEligibility(site, product.productKey, "child", { ...facts, ageYears: c.studentMaximumAgeYears, fullTimeStudent: true })).toMatchObject({ status: "resolved", eligible: true });
    }
  });
  it("evaluates explicit amount boundaries, rejects malformed patterns and never selects ambiguous scopes", () => {
    const configuration = resolveEffectiveSite(db, "asce").configuration;
    for (const [amount, allowed] of [[99999, false], [100000, true], [100001, false], [2000000, true], [2000001, false]] as const) {
      expect(resolveEffectiveAmount(configuration, "li-10yr", { applicantKey: "member", amount })).toMatchObject({ status: "resolved", allowed });
    }
    expect(resolveEffectiveAmount(configuration, "li-10yr", { applicantKey: "member" }).status).toBe("needs-information");
    expect(resolveEffectiveAmount(configuration, "li-10yr", { applicantKey: "unknown", amount: 100000 }).status).toBe("unresolved");
    const changed = structuredClone(db);
    const rule = changed.productAmountRules.find(r => r.siteKey === "asce" && r.productKey === "li-10yr" && r.applicantTypeKey === "member")!;
    const band = changed.amountBands.find(r => r.amountPatternKey === rule.amountPatternKey)!;
    band.increment = 0;
    expect(resolveEffectiveAmount(resolveEffectiveSite(changed, "asce").configuration, "li-10yr", { applicantKey: "member", amount: 100000 }).status).toBe("unresolved");
    band.increment = 10000;
    changed.productAmountRules.push({ ...rule, key: "ambiguous", id: "ambiguous" });
    expect(resolveEffectiveAmount(resolveEffectiveSite(changed, "asce").configuration, "li-10yr", { applicantKey: "member", amount: 100000 }).status).toBe("unresolved");
  });
  it("resolves linked plan, question-set and page-section records with provenance", () => {
    const changed = structuredClone(db);
    const plan = changed.coveragePlanDefinitions[0];
    const questionSet = changed.questionSets[0];
    changed.productCoveragePlans.push({ ...plan, id: "test-plan-link", key: "test-plan-link", productKey: "li-10yr", planKey: plan.key, applicantTypeKey: "member" });
    changed.productQuestionSets.push({ ...questionSet, id: "test-question-link", key: "test-question-link", productKey: "li-10yr", questionSetKey: questionSet.key, applicantTypeKey: "member" });
    const configuration = resolveEffectiveSite(changed, "asce").configuration;
    const product = configuration.products.find(p => p.productKey === "li-10yr")!;
    expect(product.plans.find(p => p.key === "test-plan-link")!.definition!.key).toBe(plan.key);
    expect(product.questionSets.find(p => p.key === "test-question-link")!.definition!.key).toBe(questionSet.key);
    expect(configuration.pages.some(p => p.sections.some(s => s.fields.length > 0))).toBe(true);
    changed.productQuestionSets.find(r => r.key === "test-question-link")!.questionSetKey = "missing";
    expect(resolveEffectiveSite(changed, "asce").configuration.issues).toContainEqual(expect.objectContaining({ domain: "questionSets", key: "missing" }));
  });
  it("does not treat embedded catalog amount blobs as normalized policy", () => {
    const changed = structuredClone(db);
    const before = resolveEffectiveSite(changed, "asce").configuration.products.find(p => p.productKey === "li-10yr")!.amounts;
    changed.products.find(p => p.key === "li-10yr")!.definition.coverageAmounts = [{ selections: [{ type: "range", min: 1, max: 2, increment: 1 }] }];
    expect(resolveEffectiveSite(changed, "asce").configuration.products.find(p => p.productKey === "li-10yr")!.amounts).toEqual(before);
  });
  it("reads no compatibility or extraction table", () => {
    for (const table of effectiveConfigurationTables) expect(table).not.toMatch(/sourceRequirements|siteConfigurations|sourceWorkbook/);
  });
});
