import dayjs from "dayjs";
import { afterEach, describe, expect, it } from "vitest";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { applyWaepaLifeAmountAdoption } from "./waepaLifeAmountAdoption";
import { mcrSource } from "./mcr";
import { validateMigrationDatabase } from "./integrity";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { resolveNormalizedAmountCap } from "../domain/amountCapPolicy";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveApplicationCoverage, validateApplicationCoverages } from "../domain/coverageRuntime";
import { validateNormalizedCoverageAmount } from "../domain/normalizedCoverageAmounts";
import { getCoverageAmountChoices } from "../utils/coverageAmounts";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { evaluateCoverageJourney } from "../domain/coverageJourney";
import { createCoverageJourneyFixture } from "./coverageJourneyExceptionAcceptance";
import { changeCoverageAmount } from "../domain/coverageRiderOnly";
import { createLibraryDraft } from "../domain/libraryDraft";
import { createSiteBuild } from "../domain/siteBuild";
import { createPortalDataRepository } from "../repositories/portalDataRepository";
import { LocalStorageAdapter } from "../persistence/localAdapter";

const db = createReviewedMigrationDatabase();
const library = resolvePrototypeLibrary(db, "waepa", "test:waepa-amounts");
const product = library.products.find(row => row.id === "li-group-term")!;
const valuesFor = (age: number, amount = 25000, applicant: "member" | "spouse" = "member") => ({
  "birth-date": dayjs().subtract(age, "year").format("YYYY-MM-DD"), "spouse-birth-date": dayjs().subtract(age, "year").format("YYYY-MM-DD"),
  "active-military": "no", "state-province": "VA", coverageSelections: [product.id], productApplicants: { [product.id]: applicant === "member" ? ["member"] : ["member", "spouse"] },
  coverageAmounts: { [`${product.id}:member`]: applicant === "member" ? amount : 2000000, ...(applicant === "spouse" ? { [`${product.id}:spouse`]: amount } : {}) },
});
afterEach(() => installPrototypeLibrary(null));

describe("source-backed WAEPA Life amount ownership", () => {
  it("stores positive adult ranges once, retains the child schedule and preserves GI isolation", () => {
    expect(getCoverageAmountChoices(product, "member")).toEqual(Array.from({ length: 80 }, (_, index) => (index + 1) * 25000));
    expect(getCoverageAmountChoices(product, "spouse")).toEqual(Array.from({ length: 80 }, (_, index) => (index + 1) * 10000));
    expect(library.client.coverages.coverageAmounts?.[product.id]).toEqual(product.coverageAmounts);
    expect(validateNormalizedCoverageAmount(library.site, product.id, "member", 0).allowed).toBe(false);
    expect(validateNormalizedCoverageAmount(library.site, product.id, "member", 35000).allowed).toBe(false);
    const gi = resolvePrototypeLibrary(db, "waepa-gi", "test:gi");
    expect(getCoverageAmountChoices(gi.products[0], "member")).toEqual([100000]);
    expect(gi.site.configuration.products[0].amountCapPolicies).toEqual([]);
    const schedule = library.site.configuration.products.find(row => row.productKey === product.id)!.selectionPolicies[0].value;
    expect(schedule).toHaveProperty("childSchedule.bands", [{ minimumAgeDays: 0, maximumAgeDays: 182, amount: 1000 }, { minimumAgeDays: 183, maximumAgeDays: 9496, amount: 10000 }]);
    expect(validateMigrationDatabase(db)).toEqual([]);
  });

  it.each([[59, 2000000], [60, 1200000], [64, 1200000], [65, 550000], [69, 550000]])("uses the same member age-%s maximum %s for Coverage and journey validation", async (age, maximum) => {
    installPrototypeLibrary(library);
    const choices = resolveApplicationCoverage(product, "member", valuesFor(age, maximum), library.products).amounts;
    expect(choices[0]).toBe(25000);
    expect(choices.at(-1)).toBe(maximum);
    expect(choices).not.toContain(0);
    const mapping = resolveCoverageJourneyPolicy(library.site, product.id)!.mappings.find(row => row.when.applicantKey === "member" && row.when.mode === "new")!;
    const fixture = createCoverageJourneyFixture(library.site, product.id, mapping.when);
    const input = { ...fixture.input, amount: maximum, eligibility: { ...fixture.input.eligibility, ageYears: age } };
    expect(await evaluateCoverageJourney(library.site, input, fixture)).toMatchObject({ allowed: true, submission: { amount: maximum } });
    const rejected = await evaluateCoverageJourney(library.site, { ...input, amount: maximum + 25000 }, fixture);
    expect(rejected).toMatchObject({ allowed: false, submission: null });
    if (age >= 60) expect(rejected.errors).toContain("Coverage amount exceeds the applicant age cap");
    expect(validateApplicationCoverages(library.products, valuesFor(age, maximum + 25000))).toBeDefined();
  });

  it.each([[59, 800000], [60, 500000], [64, 500000], [65, 270000], [69, 270000]])("combines spouse age-%s caps with exact increments and the existing member cap", async (age, maximum) => {
    installPrototypeLibrary(library);
    const result = resolveApplicationCoverage(product, "spouse", valuesFor(age, maximum, "spouse"), library.products);
    expect(result.amounts[0]).toBe(10000);
    expect(result.amounts.at(-1)).toBe(maximum);
    expect(result.amounts).not.toContain(275000);
    const limited = valuesFor(age, maximum, "spouse");
    limited.coverageAmounts[`${product.id}:member`] = 100000;
    expect(resolveApplicationCoverage(product, "spouse", limited, library.products).amounts.at(-1)).toBe(50000);
    const mapping = resolveCoverageJourneyPolicy(library.site, product.id)!.mappings.find(row => row.when.applicantKey === "spouse" && row.when.mode === "new")!;
    const fixture = createCoverageJourneyFixture(library.site, product.id, mapping.when);
    const input = { ...fixture.input, amount: maximum, memberAmount: 2000000,
      dependent: { ...fixture.input.dependent, baseAmounts: { member: 2000000 } }, eligibility: { ...fixture.input.eligibility, ageYears: age } };
    expect(await evaluateCoverageJourney(library.site, input, fixture)).toMatchObject({ allowed: true, submission: { amount: maximum } });
    expect(await evaluateCoverageJourney(library.site, { ...input, amount: maximum + 10000 }, fixture)).toMatchObject({ allowed: false, submission: null });
  });

  it("requires age before exposing ordinary base choices and preserves explicit rider-only verification", async () => {
    installPrototypeLibrary(library);
    expect(resolveApplicationCoverage(product, "member", { ...valuesFor(40), "birth-date": "" }, library.products).amounts).toEqual([]);
    expect(resolveNormalizedAmountCap(library.site, product.id, "member")).toMatchObject({ status: "needs-information" });
    const standalone = changeCoverageAmount(product, "member", valuesFor(40), 0, "cir");
    expect(standalone.coverageRiderOnly[`${product.id}:member`]).toBe("cir");
    const mapping = resolveCoverageJourneyPolicy(library.site, product.id)!.mappings.find(row => row.when.applicantKey === "member" && row.when.mode === "rider-only")!;
    const fixture = createCoverageJourneyFixture(library.site, product.id, mapping.when);
    expect(await evaluateCoverageJourney(library.site, fixture.input, fixture)).toMatchObject({ allowed: true, submission: { amount: 0, mode: "rider-only" } });
    expect(await evaluateCoverageJourney(library.site, { ...fixture.input, existingPolicy: undefined }, fixture)).toMatchObject({ allowed: false, submission: null });
  });

  it("uses edited persisted cap values in both consumers with amount-cap provenance", async () => {
    const changed = structuredClone(db);
    changed.benefitCaps.find(row => row.aggregateLimitKey.endsWith("member.age-cap") && row.minimumAgeYears === 65)!.maximum = 600000;
    const edited = resolvePrototypeLibrary(changed, "waepa", "test:edited-cap");
    installPrototypeLibrary(edited);
    const cap = resolveNormalizedAmountCap(edited.site, product.id, "member", 65);
    expect(cap).toMatchObject({ status: "resolved", maximum: 600000 });
    expect(cap.provenance).toEqual(expect.arrayContaining([expect.objectContaining({ table: "benefitCaps", sourceReference: "Main!H379" })]));
    expect(resolveApplicationCoverage(edited.products.find(row => row.id === product.id)!, "member", valuesFor(65, 600000), edited.products).amounts.at(-1)).toBe(600000);
    const mapping = resolveCoverageJourneyPolicy(edited.site, product.id)!.mappings.find(row => row.when.applicantKey === "member" && row.when.mode === "new")!;
    const fixture = createCoverageJourneyFixture(edited.site, product.id, mapping.when);
    expect(await evaluateCoverageJourney(edited.site, { ...fixture.input, amount: 600000, eligibility: { ...fixture.input.eligibility, ageYears: 65 } }, fixture)).toMatchObject({ allowed: true });
    expect(resolveNormalizedAmountCap(library.site, product.id, "member", 65).maximum).toBe(550000);
  });

  it.each(["missing-limit", "missing-caps", "wrong-site", "wrong-product", "wrong-category", "ambiguous-scope", "formula", "overlap", "negative-cap", "employment", "duplicate-reference", "bad-version"])("rejects %s without falling back to base choices", scenario => {
    const changed = structuredClone(db);
    const key = "waepa.li-group-term.mcr-amount.member.age-cap";
    const limit = changed.aggregateLimits.find(row => row.key === key)!;
    const cap = changed.benefitCaps.find(row => row.aggregateLimitKey === key && row.minimumAgeYears === 65)!;
    const assignment = changed.configurationValues.find(row => row.key === "waepa.li-group-term.amount-cap-policy")!;
    if (scenario === "missing-limit") changed.aggregateLimits = changed.aggregateLimits.filter(row => row !== limit);
    if (scenario === "missing-caps") changed.benefitCaps = changed.benefitCaps.filter(row => row.aggregateLimitKey !== key);
    if (scenario === "wrong-site") limit.siteKey = "waepa-gi";
    if (scenario === "wrong-product") limit.productKey = "li-term";
    if (scenario === "wrong-category") limit.categoryKey = "DI";
    if (scenario === "ambiguous-scope") changed.aggregateLimits.find(row => row.key.endsWith("spouse.age-cap"))!.applicantTypeKey = null;
    if (scenario === "formula") limit.formula = "unsupported";
    if (scenario === "overlap") cap.minimumAgeYears = 64;
    if (scenario === "negative-cap") cap.maximum = -1;
    if (scenario === "employment") cap.selfEmployedLessThanYears = 1;
    if (scenario === "duplicate-reference") assignment.value = { version: 1, limitKeys: [key, key] };
    if (scenario === "bad-version") assignment.value = { version: 9, limitKeys: [key] };
    const edited = resolvePrototypeLibrary(changed, "waepa", "test:invalid-cap");
    installPrototypeLibrary(edited);
    expect(resolveNormalizedAmountCap(edited.site, product.id, "member", 65).status).toBe("unresolved");
    expect(resolveApplicationCoverage(edited.products.find(row => row.id === product.id)!, "member", valuesFor(65), edited.products).amounts).toEqual([]);
  });

  it("validates cap references at export and rejects source drift before any mutation", () => {
    const changed = structuredClone(db);
    changed.benefitCaps.find(row => row.aggregateLimitKey.endsWith("member.age-cap"))!.maximum = -1;
    expect(validateMigrationDatabase(changed)).toContain("Invalid executable amount-cap policy waepa.li-group-term.amount-cap-policy");
    const before = JSON.stringify(db);
    expect(() => applyWaepaLifeAmountAdoption(db, mcrSource.cells.map(row => row.sheet === "Main" && row.cell === "I379" ? { ...row, value: "changed" } : row))).toThrow("source changed");
    expect(JSON.stringify(db)).toBe(before);
    const repeated = structuredClone(db);
    applyWaepaLifeAmountAdoption(repeated, mcrSource.cells);
    const sorted = (data: typeof db) => Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, [...rows].sort((a, b) => a.id.localeCompare(b.id))]));
    expect(sorted(repeated)).toEqual(sorted(db));
  });

  it("preserves older captured ranges and isolates copied Site caps", async () => {
    const source = createMigrationDatabase();
    const old = structuredClone(db);
    const adult = (row: typeof db.productAmountRules[number]) => row.siteKey === "waepa" && row.productKey === product.id && ["member", "spouse"].includes(row.applicantTypeKey ?? "");
    old.productAmountRules = [...old.productAmountRules.filter(row => !adult(row)), ...source.productAmountRules.filter(adult)];
    old.configurationValues = old.configurationValues.filter(row => row.key !== "waepa.li-group-term.amount-cap-policy");
    old.configurationDefinitions = old.configurationDefinitions.filter(row => row.key !== "waepa.li-group-term.amount-cap-policy");
    old.aggregateLimits = old.aggregateLimits.filter(row => !row.key.startsWith("waepa.li-group-term.mcr-amount."));
    old.benefitCaps = old.benefitCaps.filter(row => !row.aggregateLimitKey.startsWith("waepa.li-group-term.mcr-amount."));
    const before = JSON.stringify(old);
    const legacy = resolvePrototypeLibrary(old, "waepa", "test:legacy");
    expect(resolveNormalizedAmountCap(legacy.site, product.id, "member", 65)).toMatchObject({ status: "resolved" });
    expect(getCoverageAmountChoices(legacy.products.find(row => row.id === product.id)!, "member").at(-1)).toBe(500000);
    expect(JSON.stringify(old)).toBe(before);
    const draft = createLibraryDraft(await createPortalDataRepository(new LocalStorageAdapter(db)).open(), "waepa");
    const host = draft.data.clients.find(row => row.key === "waepa")!;
    const tpa = draft.data.organizations!.find(row => row.id === host.organizationId)!;
    const copy = createSiteBuild(draft, { siteKey: "waepa-cap-copy", siteName: "WAEPA cap copy", template: "multi", organizationKey: tpa.key, organizationName: tpa.name,
      newOrganization: false, clientKey: host.key, clientName: host.name, newClient: false });
    const copySite = resolveEffectiveSite(copy.data, copy.siteKey);
    expect(resolveNormalizedAmountCap(copySite, product.id, "member", 65)).toMatchObject({ status: "resolved", maximum: 550000 });
    copy.data.benefitCaps.find(row => row.aggregateLimitKey.startsWith("build.waepa-cap-copy.") && row.aggregateLimitKey.includes("member.age-cap") && row.minimumAgeYears === 65)!.maximum = 600000;
    expect(resolveNormalizedAmountCap(resolveEffectiveSite(copy.data, copy.siteKey), product.id, "member", 65).maximum).toBe(600000);
    expect(resolveNormalizedAmountCap(resolveEffectiveSite(copy.data, "waepa"), product.id, "member", 65).maximum).toBe(550000);
  }, 15000);
});
