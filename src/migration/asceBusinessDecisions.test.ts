import { describe, expect, it } from "vitest";
import { createMigrationDatabase } from "./fixtures";
import { applyAsceBusinessDecisions, asceBusinessDecisions, inspectAsceBusinessDecisions } from "./asceBusinessDecisions";
import { implementedSiteBlockers } from "./promotion";
import { mcrCoverageReport } from "./mcr";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createCanonicalMetadataRepository } from "../repositories/canonicalMetadataRepository";
import { evaluateEligibility } from "../domain/coverageRequirements";
import { libraryMetadata } from '../domain/provenance';
import { normalizeSiteReferences } from '../domain/siteIdentity.mjs';

const db = createMigrationDatabase();
describe("approved ASCE business decisions (inspection only)", () => {
  it('preserves exact earlier approval evidence through the main Site rename and rejects changed values', () => {
    const targetKeys = new Set(asceBusinessDecisions.flatMap(decision => decision.targets.map(target => target.key)));
    const previous = {
      semanticRequirements: structuredClone(db.semanticRequirements.filter(row => row.domain === 'approved-business-decision')),
      eligibilityConstraints: structuredClone(db.eligibilityConstraints.filter(row => targetKeys.has(row.key))),
      underwritingBands: structuredClone(db.underwritingBands.filter(row => targetKeys.has(row.key))),
    };
    const oldValue = (value: unknown): unknown => typeof value === 'string' ? value === 'asce' ? 'asce-default' : value.replace(/(^|[.:])asce(?=[.:]|--|$)/g, '$1asce-default') : Array.isArray(value) ? value.map(oldValue) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, oldValue(item)])) : value;
    const old = oldValue(previous) as typeof previous;
    for (const table of ['semanticRequirements', 'eligibilityConstraints', 'underwritingBands'] as const) for (const row of old[table]) Object.assign(row, libraryMetadata(table, row.key, row.sourceReference!.replace('#asce.', '#asce-default.')));
    const renamed = normalizeSiteReferences(old);
    expect(inspectAsceBusinessDecisions(renamed).every(row => row.approved)).toBe(true);
    renamed.eligibilityConstraints[0].minimumAgeYears = 17;
    expect(inspectAsceBusinessDecisions(renamed).some(row => !row.approved)).toBe(true);
  });
  it("persists all six approvals with exact Site/applicant scope and explicit authority", async () => {
    expect(inspectAsceBusinessDecisions(db)).toHaveLength(6);
    expect(inspectAsceBusinessDecisions(db).every(d => d.approved)).toBe(true);
    const adapter = new LocalStorageAdapter(db);
    const keys = new Set(asceBusinessDecisions.map(decision => `business-decision.${decision.key}`));
    const approvals = (await adapter.list("semanticRequirements")).filter(r => keys.has(r.key));
    expect(approvals).toHaveLength(6);
    for (const row of approvals) {
      expect(row).toMatchObject({ subjectTable: "sites", subjectKey: "asce", status: "documented" });
      expect(row.value).toMatchObject({ approvalStatus: "approved", runtimeActivation: "pending-phase-6" });
      expect(row.sourceReference).toContain("docs/asce-business-decisions.md#asce.");
    }
    const metadata = await createCanonicalMetadataRepository(adapter).forSite("asce");
    for (const [productKey, min, max] of [["li-10yr", 65, 69], ["li-20yr", 55, 59]] as const) {
      const bands = metadata.underwriting.filter(b => b.productKey === productKey && b.minimumAge === min);
      expect(bands).toHaveLength(2);
      expect(bands.map(b => b.applicantTypeKey).sort()).toEqual(["member", "spouse"]);
      for (const band of bands) expect(band).toMatchObject({ pathway: "FUW", status: "documented", minimumAge: min, maximumAge: max, minimumAmount: 100000, maximumAmount: 2000000, minimumAmountExclusive: false });
    }
  });
  it.each([["li-10yr", 69], ["li-20yr", 59]] as const)("records inclusive %s eligibility without changing child rules", (productKey, maximumAgeYears) => {
    const constraints = db.eligibilityConstraints.filter(r => r.siteKey === "asce" && r.productKey === productKey);
    expect(constraints.filter(r => r.applicantTypeKey === "child")).toHaveLength(1);
    for (const applicantType of ["member", "spouse"] as const) {
      const rows = constraints.filter(r => r.applicantTypeKey === applicantType);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ minimumAgeYears: 18, maximumAgeYears });
      // Exercise the existing pure eligibility evaluator only as a test oracle.
      // No normalized data is connected to an application resolver.
      const requirements = { eligibility: [{ applicantType, minimumAgeYears: rows[0].minimumAgeYears!, maximumAgeYears: rows[0].maximumAgeYears! }] };
      for (const [ageYears, expected] of [[17, "ineligible"], [18, "eligible"], [maximumAgeYears, "eligible"], [maximumAgeYears + 1, "ineligible"]] as const) {
        expect(evaluateEligibility(requirements, applicantType, { ageYears })).toBe(expected);
      }
      expect(evaluateEligibility(requirements, applicantType, {})).toBe("needs-information");
    }
  });
  it.each(asceBusinessDecisions.map(d => [d.key] as const))("reopens %s when approval evidence or canonical data is lost or changed", key => {
    const decision = asceBusinessDecisions.find(d => d.key === key)!;
    for (const alteration of ["missing-approval", "unapproved", "changed-answer", "missing-rule", "changed-rule", "missing-provenance"] as const) {
      const sample = structuredClone(db);
      const record = sample.semanticRequirements.find(r => r.key === `business-decision.${key}`)!;
      const target = decision.targets[0];
      const rows = sample[target.table] as unknown as Array<Record<string, unknown>>;
      const rule = rows.find(r => r.key === target.key)!;
      if (alteration === "missing-approval") sample.semanticRequirements = sample.semanticRequirements.filter(r => r !== record);
      if (alteration === "unapproved") record.value = { ...(record.value as object), approvalStatus: "proposed" };
      if (alteration === "changed-answer") record.value = { ...(record.value as object), answer: "Unapproved replacement" };
      if (alteration === "missing-rule") rows.splice(rows.indexOf(rule), 1);
      if (alteration === "changed-rule") rule[target.table === "underwritingBands" ? "pathway" : "minimumAgeYears"] = target.table === "underwritingBands" ? "QD" : 17;
      if (alteration === "missing-provenance") rule.sourceReference = null;
      expect(implementedSiteBlockers(sample).map(b => b.key), alteration).toContain(key);
    }
  });
  it("fails both readiness gates for a regressed approval even if compatibility unknowns are removed", () => {
    const sample = structuredClone(db);
    sample.semanticRequirements = sample.semanticRequirements.filter(r => r.domain !== "approved-business-decision");
    for (const value of sample.configurationValues) {
      const path = sample.configurationDefinitions.find(d => d.key === value.configurationKey)?.definition.path;
      if (path?.includes("unresolved")) value.value = [];
      if (path?.includes("underwritingBands") && Array.isArray(value.value)) value.value = [];
    }
    const report = mcrCoverageReport(sample);
    expect(report.phase5Ready).toBe(false);
    expect(report.phase6Ready).toBe(false);
    expect(report.blockers.map(b => b.key).sort()).toEqual(asceBusinessDecisions.map(d => d.key).sort());
  });
  it("keeps decisions deterministic and idempotent without rewriting extracted evidence", () => {
    const sample = structuredClone(db);
    applyAsceBusinessDecisions(sample);
    expect(sample).toEqual(db);
    const reordered = structuredClone(db);
    for (const row of reordered.semanticRequirements.filter(r => r.domain === "approved-business-decision")) {
      row.value = Object.fromEntries(Object.entries(row.value as object).reverse());
    }
    expect(inspectAsceBusinessDecisions(reordered).every(d => d.approved)).toBe(true);
  });
});
