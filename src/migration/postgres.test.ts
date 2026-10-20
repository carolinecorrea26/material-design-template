import { resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { loadPersistedSiteAdapter } from "../repositories/persistedSiteAdapter";
import { createSiteRepository } from "../repositories/siteRepository";
import { staticSiteAdapter } from "../repositories/staticSiteAdapter";
import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdapter } from "../persistence/supabaseAdapter";
import { createMigrationDatabase, createReviewedMigrationDatabase, migrationSiteKeys } from "./fixtures";
import { resolveDatabaseSite } from "./resolve";
import type { DatabaseSchema } from "../persistence/types";
import { tableNames } from "../persistence/supabaseAdapter";
import { validateMigrationDatabase } from "./integrity";
import { canonicalTableSpecs } from "./canonicalSchema";

it.skipIf(!process.env.MIGRATION_POSTGRES_READBACK)("PostgreSQL row readback through Supabase column mapping preserves all ten sites", async () => {
  const raw = JSON.parse(readFileSync(process.env.MIGRATION_POSTGRES_READBACK!, "utf8")) as Record<string, unknown[]>;
  // Real PostgreSQL rows, with a transport stub only; exercises the existing adapter's wire mapping.
  const client = { from: (name: string) => ({ select: () => { const chain = { order: () => chain, range: async (start: number, end: number) => ({ data: (raw[name] ?? []).slice(start, end + 1), count: (raw[name] ?? []).length, error: null }) }; return chain; } }) } as unknown as SupabaseClient;
  const adapter = new SupabaseAdapter(client);
  const repository = createSiteRepository(await loadPersistedSiteAdapter(adapter));
  const compatibility = createSiteRepository(staticSiteAdapter);
  if (!process.env.MIGRATION_POSTGRES_REVIEWED) for (const key of migrationSiteKeys) expect(JSON.parse(JSON.stringify(repository.getEffectiveSiteConfig(key)))).toEqual(JSON.parse(JSON.stringify(compatibility.getEffectiveSiteConfig(key))));
  const source = process.env.MIGRATION_POSTGRES_REVIEWED ? createReviewedMigrationDatabase() : createMigrationDatabase();
  const loaded = { ...source };
  for (const table of Object.keys(source) as (keyof DatabaseSchema)[]) {
    if (tableNames[table] in raw) Object.assign(loaded, { [table]: await adapter.list(table) });
  }
  expect(validateMigrationDatabase(loaded)).toEqual([]);
  for (const sqlName of Object.keys(canonicalTableSpecs)) {
    const table = Object.entries(tableNames).find(([, name]) => name === sqlName)![0] as keyof DatabaseSchema;
    const sorted = (database: DatabaseSchema) => [...database[table]].sort((a, b) => a.id.localeCompare(b.id));
    expect(sorted(loaded), `${sqlName} persisted rows`).toEqual(sorted(source));
  }
  expect([...loaded.siteEnvironmentLinks].sort((a, b) => a.key.localeCompare(b.key))).toEqual([...source.siteEnvironmentLinks].sort((a, b) => a.key.localeCompare(b.key)));
  for (const key of migrationSiteKeys) {
    const behavior = (db: DatabaseSchema) => Object.fromEntries(Object.entries(resolveDatabaseSite(db, key)).filter(([name]) => name !== "site" && name !== "client"));
    const expected = behavior(source);
    const actual = behavior(loaded);
    expect(actual, key).toEqual(expected);
    expect(resolvePrototypeLibrary(loaded, key, "postgres-test").fieldSurfaces).toEqual(resolvePrototypeLibrary(source, key, "source-test").fieldSurfaces);
    expect(resolvePrototypeLibrary(loaded, key, "postgres-test").fieldCollections).toEqual(resolvePrototypeLibrary(source, key, "source-test").fieldCollections);
  }
}, 120000);


it.skipIf(!process.env.MIGRATION_POSTGRES_SNAPSHOT)("real PostgreSQL snapshot resolves all active Sites through the shared repository", async () => {
  const response = JSON.parse(readFileSync(process.env.MIGRATION_POSTGRES_SNAPSHOT!, "utf8"));
  const { createPortalDataRepository } = await import("../repositories/portalDataRepository");
  const { resolveEffectiveSite, resolveEffectiveEligibility } = await import("../domain/effectiveSite");
  const { validateNormalizedCoverageAmount } = await import("../domain/normalizedCoverageAmounts");
  const client = { rpc: async () => ({ data: response, error: null }) } as unknown as SupabaseClient;
  const revision = await createPortalDataRepository(new SupabaseAdapter(client)).open();
  const source = process.env.MIGRATION_POSTGRES_REVIEWED ? createReviewedMigrationDatabase() : createMigrationDatabase();
  if (process.env.MIGRATION_POSTGRES_REVIEWED) {
    const { resolveNormalizedBenefit, reconcileBenefitSelection } = await import("../domain/benefitPolicy");
    const { reconcileDependentAmount } = await import("../domain/dependentPolicy");
    const { validateNormalizedLifeAggregate } = await import("../domain/normalizedCoverageAmounts");
    const { resolveNormalizedResidency } = await import("../domain/residencyPolicy");
    const { resolveRatePresentation } = await import("../domain/ratePresentation");
    expect(resolveRatePresentation(revision.resolveSite("csea").site, "di-ltd")).toMatchObject({ praseConfigured: false, hideCalculatedRates: true, homePageVariant: "hero-image" });
    expect(resolveRatePresentation(revision.resolveSite("nso").site, "li-term")).toMatchObject({ praseConfigured: true, quoteToolEnabled: true });
    const { inspectSiteAggregates } = await import("../domain/aggregateInspection");
    expect(inspectSiteAggregates(revision.resolveSite("nso").site).find(row => row.category === "LI")?.maximum).toBe("$800,000");
    expect(resolveNormalizedResidency(revision.resolveSite("csea").site, "di-ltd", "member", { jurisdiction: "US-NY" }).allowed).toBe(true);
    expect(resolveNormalizedResidency(revision.resolveSite("waepa").site, "li-group-term", "member", { jurisdiction: "US-NY", activeMilitary: false }).allowed).toBe(false);
    expect(resolveNormalizedResidency(revision.resolveSite("waepa-gi").site, "li-group-term", "member", { jurisdiction: "US-NY", activeMilitary: false }).allowed).toBe(true);
    const ama = revision.resolveSite("ama").site;
    expect(validateNormalizedCoverageAmount(ama, "li-15yr", "member", 4000000).allowed).toBe(true);
    expect(validateNormalizedCoverageAmount(ama, "li-15yr", "member", 4000001).allowed).toBe(false);
    expect(validateNormalizedCoverageAmount(ama, "li-15yr", "child", 25000).allowed).toBe(true);
    expect(reconcileDependentAmount(ama, "li-premier-accident", "spouse", { baseAmounts: { member: 750000 }, selectedApplicants: ["member", "spouse", "child"], amount: 375000 })).toMatchObject({ amount: 300000, locked: true });
    expect(validateNormalizedLifeAggregate(ama, "member", [{ productKey: "li-10yr", amount: 4000000 }, { productKey: "li-premier-accident", amount: 1000000 }], 0)).toMatchObject({ allowed: true, total: 4000000 });
    expect(resolveNormalizedBenefit(revision.resolveSite("nso").site, "di-ltd", "member", { ageYears: 40, monthlyIncome: 1000, amount: 700 })).toMatchObject({ allowed: false, maximum: 600 });
    expect(reconcileBenefitSelection(revision.resolveSite("asce").site, "di-ltd", "member", { ageYears: 40, monthlyIncome: 10000, selfEmployed: true, selfEmployedYears: .5, amount: 2100, waitingPeriod: "30-days", benefitPeriod: "career" })).toMatchObject({ amount: null, waitingPeriod: "90-days", benefitPeriod: "5-years" });
    const gi = revision.resolveSite("waepa-gi").site;
    expect(resolveEffectiveEligibility(gi, "li-group-term", "member", { ageYears: 39, activeMilitary: false })).toMatchObject({ status: "resolved", eligible: true });
    expect(resolveEffectiveEligibility(gi, "li-group-term", "member", { ageYears: 39, activeMilitary: true })).toMatchObject({ status: "resolved", eligible: false });
    expect(resolveEffectiveEligibility(gi, "li-group-term", "member", 39)).toMatchObject({ status: "needs-information" });
  }
  if (process.env.MIGRATION_POSTGRES_REVIEWED) {
    const { runCoverageJourneyAcceptance } = await import("./coverageJourneyAcceptance");
    const actual = await runCoverageJourneyAcceptance(key => revision.resolveSite(key).site);
    expect(actual.tested).toBeGreaterThan(50);
    expect(actual.failures).toEqual([]);
  }
  for (const key of migrationSiteKeys) {
    expect(revision.resolveSite(key).site).toEqual(resolveEffectiveSite(source, key));
    expect(revision.query("sites", { filters: { key } }).revision).toBe(revision.resolveSite(key).revision);
  }
}, 120000);

it.skipIf(!process.env.MIGRATION_POSTGRES_SNAPSHOT || !process.env.MIGRATION_POSTGRES_REVIEWED)("executes all applicant/class/association/period/mode journeys from the real PostgreSQL snapshot", async () => {
  const response = JSON.parse(readFileSync(process.env.MIGRATION_POSTGRES_SNAPSHOT!, "utf8"));
  const { createPortalDataRepository } = await import("../repositories/portalDataRepository");
  const { runCoverageJourneyExceptionAcceptance } = await import("./coverageJourneyExceptionAcceptance");
  const client = { rpc: async () => ({ data: response, error: null }) } as unknown as SupabaseClient;
  const revision = await createPortalDataRepository(new SupabaseAdapter(client)).open();
  const result = await runCoverageJourneyExceptionAcceptance(key => revision.resolveSite(key).site);
  expect(result.tested).toBe(1834);
  expect(result.failures).toEqual([]);
}, 120000);


it.skipIf(!process.env.MIGRATION_POSTGRES_SNAPSHOT || !process.env.MIGRATION_POSTGRES_REVIEWED)("retains Review and mock rating policies in the real PostgreSQL snapshot", async () => {
  const response = JSON.parse(readFileSync(process.env.MIGRATION_POSTGRES_SNAPSHOT!, "utf8"));
  const { createPortalDataRepository } = await import("../repositories/portalDataRepository");
  const { isReviewPolicy, validateCapturedReview } = await import("../domain/reviewPolicy");
  const { isRateInputPolicy } = await import("../domain/rateInputPolicy");
  const { isRateModifierPolicy } = await import("../domain/rateModifiers");
  const client = { rpc: async () => ({ data: response, error: null }) } as unknown as SupabaseClient;
  const revision = await createPortalDataRepository(new SupabaseAdapter(client)).open();
  for (const key of migrationSiteKeys) {
    const site = revision.resolveSite(key).site;
    expect(isReviewPolicy(site.configuration.reviewPolicies[0]?.value)).toBe(true);
    for (const product of site.configuration.products) {
      expect(isRateInputPolicy(product.rateInputPolicies[0]?.value)).toBe(true);
      expect(isRateModifierPolicy(product.rateModifierPolicies[0]?.value)).toBe(true);
    }
  }
  expect(validateCapturedReview(revision.resolveSite("abe").site, "IL", [{ productKey: "li-term", category: "LI", applicants: ["member"] }], { "dividend-acknowledgement": true, "dividend-opt-out": false, "dividend-first-name": "Mock", "dividend-last-name": "Applicant", "dividend-birth-date": "1990-01-01" }).allowed).toBe(true);
}, 120000);
