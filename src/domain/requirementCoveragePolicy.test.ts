import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "./prototypeLibrary";
import { buildGlobalTemplate } from "../dev/storybook/globalTemplate";
import { resolveApplicationCoverage } from "./coverageRuntime";
import { coverageRelationshipErrors, evaluateEligibility } from "./coverageRequirements";
import { coverageFactFieldIds } from "../config/fields/coverageFactFields";
import { coverageConfigurationDefinitions, coverageRequirementAssignments, applyRequirementCoveragePolicy, requirementCoverageAmounts, requirementCoverageSubmitAlert } from "./requirementCoveragePolicy";
import { parseCoverageAssignments } from "./requirementCoverageValidation.mjs";
import { configurationRows } from "../pages/admin/library/configurationRows";
import { libraryRequirementRows } from "../pages/admin/library/libraryRequirementRows";
import { fieldSurfaceRows } from "../pages/admin/library/fieldSurfaceRows";
import { storedLibraryRows } from "../pages/admin/library/storedLibraryModel";
import { requirementText } from "./requirementContent";

const catalog = { ...validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8"))), revision: "test:coverage-json" };
const library = resolvePrototypeLibrary(catalog.data, "asce", catalog.revision);
const base = {
  membership: "yes", "birth-date": "1990-01-01", "spouse-birth-date": "1990-01-01", "state-province": "NY", dependents: ["spouse"],
  "hours-worked-per-week": "30", "spouse-hours-worked-per-week": "30", "average-monthly-income": "20000", "spouse-average-monthly-income": "1000",
  "self-employed-under-one-year": "no", coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member", "spouse"] },
  coverageAmounts: { "di-ltd:member": 1500, "di-ltd:spouse": 500 },
};
beforeEach(() => { vi.setSystemTime(new Date("2026-11-08T17:00:00Z")); installPrototypeLibrary(library); });
afterEach(() => { installPrototypeLibrary(null); vi.useRealTimers(); });

describe("reviewed Coverage JSON policies", () => {
  it.each(["prototype", "storybook"] as const)("uses the single question, policy assignments and spouse note in %s", surface => {
    const current = surface === "prototype" ? library : buildGlobalTemplate(catalog, "multipleTerms");
    installPrototypeLibrary(current);
    const fields = current.site.configuration.pages.find(page => page.key === "coverage")!.fields.filter(row => row.included).map(row => row.definition);
    expect(fields.find(field => field.id === "self-employed-under-one-year")).toMatchObject({ label: "Are you self-employed for less than 1 year?", inputType: "radio", required: true, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] });
    expect(fields.some(field => ["is-self-employed", "years-self-employed"].includes(field.id))).toBe(false);
    const product = current.products.find(product => product.id === "di-ltd")!;
    expect(coverageFactFieldIds([product], base)).toContain("self-employed-under-one-year");
    expect(coverageFactFieldIds([product], base)).not.toContain("years-self-employed");
    const note = requirementText("coverage.note.spouse-member-maximum");
    expect(current.content.pages.coverage?.sectionNotes?.spouseSection).toBe(note);
    const result = resolveApplicationCoverage(product, "member", base, current.products);
    expect(result.selectable).toBe(true);
    expect(product.requirementPolicy?.map(({ source: _source, ...row }) => row)).toEqual(library.products.find(candidate => candidate.id === product.id)!.requirementPolicy?.map(({ source: _source, ...row }) => row));
  });

  it("uses the reviewed single answer and ignores obsolete saved answers", () => {
    const product = library.products.find(product => product.id === "di-ltd")!;
    const yes = resolveApplicationCoverage(product, "member", { ...base, "self-employed-under-one-year": "yes", "is-self-employed": "no", "years-self-employed": 10 }, library.products);
    expect(yes.amounts.at(-1)).toBe(1050);
    expect(yes.waitingPeriod.requiredValue).toBe("90-days");
    expect(yes.benefitPeriod.requiredValue).toBe("5-years");
    const no = resolveApplicationCoverage(product, "member", { ...base, "is-self-employed": "yes", "years-self-employed": 0.5 }, library.products);
    expect(no.amounts.at(-1)).toBe(8550);
    const missing = resolveApplicationCoverage(product, "member", { ...base, "self-employed-under-one-year": undefined, "is-self-employed": "no" }, library.products);
    expect(missing.selectable).toBe(false);
  });

  it.each(["member", "spouse"] as const)("requires 30 work hours for %s", person => {
    const product = library.products.find(product => product.id === "di-ltd")!;
    const key = `${person === "member" ? "" : "spouse-"}hours-worked-per-week`;
    expect(resolveApplicationCoverage(product, person, { ...base, [key]: 29 }, library.products).selectable).toBe(false);
    expect(resolveApplicationCoverage(product, person, base, library.products).selectable).toBe(true);
  });

  it("keeps the approved spouse Disability age range 17 through 59", () => {
    const product = library.products.find(product => product.id === "di-ltd")!;
    for (const [age, expected] of [[16, "ineligible"], [17, "eligible"], [59, "eligible"], [60, "ineligible"]] as const) expect(evaluateEligibility(product.requirements, "spouse", { ageYears: age, workHoursPerWeek: 30 })).toBe(expected);
  });

  it("requires annual member income of 20,000 for Disability only", () => {
    const product = library.products.find(product => product.id === "di-ltd")!;
    expect(resolveApplicationCoverage(product, "member", { ...base, "average-monthly-income": 1666.66 }, library.products).eligibility).toBe("ineligible");
    expect(resolveApplicationCoverage(product, "member", { ...base, "average-monthly-income": 1666.67 }, library.products).eligibility).toBe("eligible");
    expect(resolveApplicationCoverage(product, "member", { ...base, "average-monthly-income": "" }, library.products).eligibility).toBe("needs-information");
    expect(resolveApplicationCoverage(product, "spouse", { ...base, "spouse-average-monthly-income": 0 }, library.products).selectable).toBe(true);
    expect(resolveApplicationCoverage(library.products.find(product => product.id === "li-term")!, "member", { ...base, "average-monthly-income": 0 }, library.products).selectable).toBe(true);
  });

  it.each(["member", "spouse"] as const)("adds NC only to Disability exclusions for %s and preserves existing exclusions", person => {
    const di = library.products.find(product => product.id === "di-ltd")!;
    for (const state of ["NC", "US-NC", "VT", "WA"]) expect(resolveApplicationCoverage(di, person, { ...base, "state-province": state }, library.products).selectable).toBe(false);
    if (person === "spouse") expect(resolveApplicationCoverage(di, person, { ...base, "state-province": "NH" }, library.products).selectable).toBe(false);
    expect(resolveApplicationCoverage(library.products.find(product => product.id === "li-term")!, person, { ...base, "state-province": "NC" }, library.products).selectable).toBe(true);
  });

  it("keeps spouse DI selectable below 600 and alerts on joint submission only", () => {
    const product = library.products.find(product => product.id === "di-ltd")!;
    const below = { ...base, coverageAmounts: { "di-ltd:member": 450, "di-ltd:spouse": 500 } };
    expect(resolveApplicationCoverage(product, "spouse", below, library.products).selectable).toBe(true);
    expect(requirementCoverageSubmitAlert(library.products, below)).toContain("$600");
    expect(requirementCoverageSubmitAlert(library.products, { ...below, coverageAmounts: { "di-ltd:member": 600, "di-ltd:spouse": 500 } })).toBeUndefined();
    for (const patch of [{ productApplicants: { "di-ltd": ["member"] } }, { productApplicants: { "di-ltd": ["spouse"] } }, { coverageSelections: [] }, { coverageAmounts: { "di-ltd:member": 0, "di-ltd:spouse": 500 } }]) expect(requirementCoverageSubmitAlert(library.products, { ...below, ...patch })).toBeUndefined();
  });

  it.each([69, 70, 72, 73, 75])("applies new Term Life minimum and age cap at age %s to both adults", age => {
    const product = library.products.find(product => product.id === "li-term")!;
    for (const person of ["member", "spouse"] as const) {
      const prefix = person === "member" ? "" : "spouse-";
      const result = resolveApplicationCoverage(product, person, { ...base, [`${prefix}birth-date`]: `${2026 - age}-01-01` }, library.products);
      expect(result.amounts[0]).toBe(20000);
      expect(result.amounts.at(-1)).toBe(age >= 73 ? 350000 : age >= 70 ? 500000 : 1000000);
    }
    expect(requirementCoverageAmounts(product, "member", age, [10000, 20000], "increase")).toEqual([10000, 20000]);
  });

  it.each([[14, 0, false], [15, 0, true], [9000, 24, true], [9500, 25, false]] as const)("applies AD&D child bounds at %s days / %s years", (days, years, expected) => {
    expect(evaluateEligibility(library.products.find(product => product.id === "li-add")!.requirements, "child", { ageDays: days, ageYears: years }) === "eligible").toBe(expected);
  });

  it("requires member Life for child benefits and adds no spouse Life amount gate", () => {
    expect(coverageRelationshipErrors(library.products, { "li-term": ["spouse", "child"] })).not.toEqual([]);
    expect(coverageRelationshipErrors(library.products, { "li-term": ["member", "child"] })).toEqual([]);
    const life = library.products.find(product => product.id === "li-term")!;
    const spouse = resolveApplicationCoverage(life, "spouse", { ...base, coverageSelections: [life.id], productApplicants: { [life.id]: ["member", "spouse"] }, coverageAmounts: { [`${life.id}:member`]: 50000, [`${life.id}:spouse`]: 100000 } }, library.products);
    expect(spouse.selectable).toBe(true);
    expect(spouse.amounts).toContain(100000);
  });

  it("exposes shared values, rules, fields and notes in the Library", () => {
    const config = configurationRows(catalog, "asce");
    const rules = libraryRequirementRows(catalog, "asce");
    for (const assignment of coverageRequirementAssignments("asce")) {
      expect(config.some(row => row.referenceKey === assignment.configuration && row.scope === "asce")).toBe(true);
      expect(rules.some(row => row.key === assignment.configuration && row.product === assignment.product && row.requirementsJson)).toBe(true);
    }
    expect(rules.find(row => row.key === "coverage-joint-spouse-submit-alert")?.behavior).toContain("On Next");
    const fields = fieldSurfaceRows(catalog, "asce").filter(row => row.pages.includes("coverage"));
    expect(fields.some(row => row.field.id === "self-employed-under-one-year")).toBe(true);
    expect(fields.some(row => ["is-self-employed", "years-self-employed"].includes(row.field.id))).toBe(false);
    expect(storedLibraryRows(catalog, "contentValues", "asce").find(row => row.contentKey === "pages.coverage.sectionNotes.spouseSection")?.value).toBe(requirementText("coverage.note.spouse-member-maximum"));
  });

  it("uses modified JSON values through the shared adapter and leaves unconfigured sites unchanged", () => {
    const product = library.products.find(product => product.id === "di-ltd")!;
    const rows = structuredClone(coverageRequirementAssignments("asce"));
    rows.find(row => row.configuration === "coverage-minimum-work-hours")!.value = 35;
    const changed = applyRequirementCoveragePolicy(product, rows);
    expect(evaluateEligibility(changed.requirements, "spouse", { ageYears: 30, workHoursPerWeek: 30 })).toBe("ineligible");
    expect(coverageRequirementAssignments("unconfigured-site")).toEqual([]);
    expect(applyRequirementCoveragePolicy(product, [])).toBe(product);
  });

  it("rejects invalid scopes, values and overlapping age bands at the shared boundary", () => {
    const rows = coverageRequirementAssignments("asce");
    const parse = (assignments: unknown[]) => parseCoverageAssignments({ site: "asce", assignments }, coverageConfigurationDefinitions, "asce");
    expect(() => parse([{ ...rows[0], applicants: [] }])).toThrow("invalid applicants");
    expect(() => parse([{ ...rows[0], value: "30" }])).toThrow("invalid value");
    expect(() => parse([{ ...rows[0], configuration: "missing-rule" }])).toThrow("unknown configuration");
    const band = rows.find(row => row.configuration === "coverage-age-maximum-amount")!;
    expect(() => parse([band, { ...band, minimumAgeYears: 72, maximumAgeYears: 74 }])).toThrow("overlapping");
  });
});
