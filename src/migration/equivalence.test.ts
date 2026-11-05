import { coverageCategories } from "../config/coverageCategories";
import { getMaxAggregateNotes, categoryMaxAggregate } from "../config/coverageConstants";
import { getCategoryQuestionFieldIds } from "../config/coverageQuestionRequirements";
import { describe, expect, it } from "vitest";
import { migrationSiteKeys } from "./fixtures";
import { resolveDatabaseSite, evaluateDatabaseCondition, resolveDatabaseBranding, databaseCoverageUnlocksPage, resolveDatabaseAssociation, databaseQuestionFields } from "./resolve";
import { jsonValue } from "./values";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { getEffectiveSiteConfig, getAssociationsForSite, getClientForSite, siteEntities, getSite } from "../data/registry";
import { resolveEffectiveBranding, resolveSiteSupport, resolveSitePages, resolveSiteCoverage, resolveSiteFlows } from "../data/resolvers";
import { getResolvedFieldResolutionsForSite } from "../config/fields/resolvedFieldRegistry";
import { pageSections } from "../config/pageSections/pageSections";
import { flowGateDefinitions, coverageSatisfiesFlowGate } from "../config/flowGates";
import { resolveActiveAssociation } from "../data/associationSelection";
import { readMockEmailPreviews } from "../utils/mockEmail";
import { pages } from "../config/pages";
import { buildContent } from "../content";
import { getApplicableSiteRules } from "../content/docs/siteRules";
import { conditionDefinitions } from "../config/conditions/conditions";
import { evaluateCondition } from "../config/conditions/evaluateConditions";
import type { DatabaseSchema } from "../persistence/types";
import { createLegacyCompatibilityFixture } from "./legacyCompatibilityFixture";

const db = createLegacyCompatibilityFixture();
const clean = (value: unknown) => value === undefined ? null : jsonValue(value);

describe("phase 1–4 migration gate — independently resolved database behavior", () => {
  it("covers the exact ten sites, with deterministic JSON-safe seeds", () => {
    expect(siteEntities.map((s) => s.id).sort()).toEqual([...migrationSiteKeys].sort());
    expect(createLegacyCompatibilityFixture()).toEqual(db);
    expect(JSON.parse(JSON.stringify(db))).toEqual(db);
    for (const [table, rows] of Object.entries(db)) {
      expect(new Set(rows.map((r: { id: string }) => r.id)).size, `${table} IDs`).toBe(rows.length);
    }
  });
  for (const siteKey of migrationSiteKeys) describe(siteKey, () => {
    const migrated = resolveDatabaseSite(db, siteKey);
    const old = getEffectiveSiteConfig(siteKey);
    it("branding + support", () => {
      expect(migrated.branding).toEqual(resolveEffectiveBranding({ siteId: siteKey }));
      expect(migrated.support).toEqual(resolveSiteSupport(siteKey));
      for (const association of getAssociationsForSite(siteKey)) expect(resolveDatabaseBranding(db, siteKey, association.id)).toEqual(resolveEffectiveBranding({ siteId: siteKey, associationId: association.id }));
      expect(resolveDatabaseBranding(db, siteKey, "invalid")).toEqual(resolveEffectiveBranding({ siteId: siteKey, associationId: "invalid" }));
    });
    it("pages: inclusion and requirements", () => {
      expect(migrated.pages).toEqual(resolveSitePages(siteKey).map((p) => ({ id: p.id, path: p.global.path, included: p.effective.included, requirement: p.effective.requirement })));
    });
    it("fields: order, inclusion, required, options, validation and visibility", () => {
      const expected = pages.map((page) => ({ pageId: page.id, fields: getResolvedFieldResolutionsForSite(page.id, siteKey).map(({ included, field }) => ({ included, field })) })).filter((p) => p.fields.length);
      expect(clean(migrated.fields)).toEqual(clean(expected));
    });
    it("coverage: enabled products, amounts, scoped identifiers, applicants, riders and underwriting", () => {
      expect(clean(migrated.coverage)).toEqual(clean(resolveSiteCoverage(siteKey).map((p) => ({ id: p.id, enabled: p.status !== "disabled", effective: p.effective }))));
    });
    it("coverage aggregate notes and category-specific question requirements", () => {
      expect(migrated.coveragePolicy.categoryMaxAggregate).toEqual(categoryMaxAggregate);
      for (const category of coverageCategories) expect(migrated.coveragePolicy.aggregateNotes[category.id]).toEqual(getMaxAggregateNotes(category.id, siteKey));
      for (let mask = 0; mask < 32; mask++) {
        const categories = coverageCategories.filter((_, index) => mask & (1 << index)).map((r) => r.id);
        for (const applicant of ["self", "spouse"] as const) expect(databaseQuestionFields(migrated, categories, applicant)).toEqual(getCategoryQuestionFieldIds(categories, applicant, { hideSmokerQuestion: old.coverages.hideSmokerQuestion }));
      }
    });
    it("rules: applicable scope, predicates and preserved behavior", () => {
      const oldRules = getApplicableSiteRules({ siteId: siteKey, clientId: getClientForSite(siteKey)!.id });
      expect(migrated.rules.map((r) => ({ id: r.id, conditions: r.conditionIds, behavior: r.behavior }))).toEqual(oldRules.map((r) => ({ id: r.id, conditions: r.conditionIds ?? [], behavior: r.behavior })));
      for (const rule of migrated.rules) expect(rule.actions[0].description).toBe(rule.behavior);
    });
    it("flows: steps, targets and branch conditions", () => {
      expect(clean(migrated.flows)).toEqual(clean(resolveSiteFlows(siteKey).map((f) => f.effective)));
    });
    it("page sections: placement, field references and visibility predicates", () => {
      const sections = db.pageSections.map((row) => row.definition);
      expect(clean(sections)).toEqual(clean(Object.values(pageSections).flatMap((rows) => rows ?? [])));
    });
    it("routing: category, underwriting and rider gates", () => {
      for (const product of migrated.coverage) for (const { pageId, gate } of flowGateDefinitions) {
        expect(databaseCoverageUnlocksPage(db, siteKey, pageId, product.effective), `${product.id}/${pageId}`).toBe(coverageSatisfiesFlowGate(product.effective, gate));
      }
    });
    it("features", () => { expect(clean(migrated.features)).toEqual(clean(old.features)); });
    it("content: all effective text, assets, arrays and legal documents", () => { expect(migrated.content).toEqual(clean(buildContent(siteKey))); });
    it("configurations: all authored values survive scope resolution", () => {
      const expected = Object.fromEntries(Object.entries(old).filter(([key]) => !["id", "branding", "support", "flows"].includes(key)));
      const actual = Object.fromEntries(Object.entries(migrated.configurations).filter(([key]) => !["routingGates", "coveragePolicy", "fieldCollections", "fieldSurfaces"].includes(key)));
      expect(clean(actual)).toEqual(clean(expected));
    });
    it("associations: enabled relationships and selection policy", () => {
      expect(migrated.associations).toEqual(clean(getAssociationsForSite(siteKey)));
      const site = getSite(siteKey)!;
      for (const id of [undefined, "invalid", ...migrated.associations.map((r) => r.id)]) {
        const context = { selectedAssociationId: id, urlAssociationId: id };
        const old = resolveActiveAssociation(siteKey, context);
        expect(clean(resolveDatabaseAssociation(db, siteKey, context))).toEqual(clean({ status: old.status, associationId: old.association?.id }));
      }
      expect(migrated.policy).toEqual(clean({ associationSelection: site.associationSelection, associationBranding: site.associationBranding }));
    });
    it("email: contact visibility and fallback precedence", () => {
      expect(db.siteEmailTemplates.filter((r) => r.siteKey === siteKey && r.enabled).map((r) => r.emailTemplateKey).sort()).toEqual(readMockEmailPreviews(siteKey).map((r) => r.type).sort());
      const email = old.emailSupport, client = getClientForSite(siteKey)!;
      expect(migrated.emailConfiguration).toEqual({ hideContactBox: Boolean(email?.hideContactBox), name: email?.contactOverride?.name || client.name, acronym: email?.contactOverride?.acronym || client.acronym,
        phone: email?.supportOverride?.phone || old.support.phoneDisplay || old.support.phone || "", email: email?.supportOverride?.email || old.support.email || "", website: email?.supportOverride?.website || old.support.website || "" });
    });
  });
  it("condition truth tables survive persistence (all/any, equals/notEquals/includes)", () => {
    for (const definition of conditionDefinitions) {
      const candidates = definition.conditions.flatMap((clause) => [clause.value, "__different__", [clause.value], [], undefined]);
      const fields = [...new Set(definition.conditions.map((r) => r.fieldId))];
      let scenarios: Record<string, unknown>[] = [{}];
      for (const field of fields) scenarios = scenarios.flatMap((s) => candidates.map((v) => ({ ...s, [field]: v })));
      for (const values of scenarios) expect(evaluateDatabaseCondition(db, definition.id, values), `${definition.id}: ${JSON.stringify(values)}`).toBe(evaluateCondition(definition, values as Parameters<typeof evaluateCondition>[1]));
    }
  });
  it("WAEPA GI shares the active-duty rule without inheriting Standard qualification fields", () => {
    const gi = resolveDatabaseSite(db, "waepa-gi"), standard = resolveDatabaseSite(db, "waepa");
    expect(gi.rules.filter((r) => r.id.includes("waepa") && r.area === "Membership").map(rule => rule.id)).toEqual(["rule-membership-waepa-active-duty-prevents-application"]);
    expect(standard.rules.filter((r) => r.id.includes("waepa") && r.area === "Membership").length).toBeGreaterThan(0);
    expect(gi.fields.find((p) => p.pageId === "membership")!.fields.some((r) => r.field.id === "waepa-declaration")).toBe(false);
    expect(standard.fields.find((p) => p.pageId === "membership")!.fields.some((r) => r.field.id === "waepa-declaration")).toBe(true);
  });
  it("resolves serialized rows read back through the existing local adapter", async () => {
    const adapter = new LocalStorageAdapter(JSON.parse(JSON.stringify(db)));
    const restored = Object.fromEntries(await Promise.all(Object.keys(db).map(async (table) => [table, await adapter.list(table as keyof DatabaseSchema)]))) as unknown as DatabaseSchema;
    for (const site of migrationSiteKeys) expect(resolveDatabaseSite(restored, site)).toEqual(resolveDatabaseSite(db, site));
  });
  it("database edits change the new result without changing static runtime", () => {
    const changed = structuredClone(db);
    changed.siteFieldConfigurations.push({ id: "test-required", key: "test-required", scope: "site", siteKey: "ama", clientKey: null, pageKey: "membership", fieldKey: "membership", include: null, hidden: null, values: { required: false }, position: 99999 });
    const before = getResolvedFieldResolutionsForSite("membership", "ama").find((r) => r.fieldId === "membership")!;
    expect(before.field.required).toBe(true);
    expect(resolveDatabaseSite(changed, "ama").fields.find((p) => p.pageId === "membership")!.fields.find((r) => r.field.id === "membership")!.field.required).toBe(false);
    expect(getResolvedFieldResolutionsForSite("membership", "ama").find((r) => r.fieldId === "membership")!.field.required).toBe(true);
  });
});
