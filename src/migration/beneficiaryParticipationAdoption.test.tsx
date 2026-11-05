import { createCoverageJourneyFixture } from "./coverageJourneyExceptionAcceptance";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { evaluateCoverageJourney } from "../domain/coverageJourney";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyBeneficiaryParticipationAdoption } from "./beneficiaryParticipationAdoption";
import { collectsBeneficiaries, isBeneficiaryParticipationPolicy } from "../domain/beneficiaryParticipation";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { applicantParticipatesInPage, resolveFlowGate } from "../config/flowGates";
import { validateMigrationDatabase } from "./integrity";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import type { DatabaseSchema } from "../persistence/types";
import Beneficiary from "../pages/Beneficiary";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { currentMcrSource } from "./currentMcr";

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock("../app/SinglePageFlowContext", () => ({ useSinglePageFlow: () => null }));
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it("uses source-specific applicant and Association scope in actual page routing", () => {
  for (const [siteKey, association, product, category, applicant, expected] of [
    ["ama", undefined, "li-premier-accident", "AD", "spouse", false],
    ["ama", undefined, "li-premier-accident", "AD", "member", true],
    ["ama", undefined, "li-term", "LI", "spouse", true],
    ["isitrust", "akron-bar-association", "li-group-term", "LI", "spouse", false],
    ["isitrust", atpeAssociationKey, "li-group-term", "LI", "spouse", true],
    ["isitrust", atpeAssociationKey, "li-add", "AD", "member", false],
    ["isitrust", "akron-bar-association", "li-add", "AD", "member", false],
    ["isitrust", atpeAssociationKey, "li-50plus", "LI", "member", false],
    ["isitrust", atpeAssociationKey, "sh-critical-illness", "SH", "member", true],
    ["isitrust", atpeAssociationKey, "sh-critical-illness", "SH", "spouse", true],
    ["isitrust", "akron-bar-association", "sh-critical-illness", "SH", "member", false],
  ] as const) {
    const library = resolvePrototypeLibrary(db, siteKey, "beneficiary-scope"); installPrototypeLibrary(library);
    expect(collectsBeneficiaries(library.site, product, category, applicant, association)).toBe(expected);
    const values = { membership: association ?? "yes", dependents: ["spouse"], coverageSelections: [product], productApplicants: { [product]: [applicant] }, coverageAmounts: { [`${product}:${applicant}`]: 100000 } };
    expect(resolveFlowGate("beneficiary", values, library.products), `${siteKey}/${association}/${product}/${applicant}`).toBe(expected);
    expect(applicantParticipatesInPage("beneficiary", applicant, values, library.products)).toBe(expected);
    expect(collectsBeneficiaries(library.site, product, category, "child", association)).toBe(false);
  }
  const copy = structuredClone(db); applyBeneficiaryParticipationAdoption(copy); expect(copy).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});
it("captures edits, preserves older revisions and rejects ambiguous/orphan scope", () => {
  const before = resolvePrototypeLibrary(db, "isitrust", "before"), edited = structuredClone(db);
  const row = edited.configurationValues.find(row => row.key === "isitrust.beneficiary-participation")!;
  if (!isBeneficiaryParticipationPolicy(row.value)) throw new Error("Invalid fixture");
  row.value.rules.find(rule => rule.productKey === "sh-critical-illness" && rule.applicantKey === "member")!.collect = false;
  expect(collectsBeneficiaries(resolvePrototypeLibrary(edited, "isitrust", "after").site, "sh-critical-illness", "SH", "member", atpeAssociationKey)).toBe(false);
  expect(collectsBeneficiaries(before.site, "sh-critical-illness", "SH", "member", atpeAssociationKey)).toBe(true);
  expect(resolvePrototypeLibrary(edited, "abe", "other").site).toEqual(resolvePrototypeLibrary(db, "abe", "other").site);
  expect(isBeneficiaryParticipationPolicy({ ...row.value, rules: [...row.value.rules, row.value.rules[0]] })).toBe(false);
  row.value.rules[0].associationKeys = ["unknown-association"];
  expect(validateMigrationDatabase(edited)).toContain("Orphan beneficiary participation scope isitrust.beneficiary-participation");
  expect(() => resolvePrototypeLibrary(edited, "isitrust", "invalid")).toThrow("Invalid beneficiary participation policy");
});
it("reconciles every current Main beneficiary flag and skips CIR-only selections", () => {
  for (const [siteKey, products] of Object.entries(activeSiteMainRows)) {
    const library = resolvePrototypeLibrary(db, siteKey, "Main-beneficiary-review"); installPrototypeLibrary(library);
    for (const [productKey, row] of Object.entries(products)) {
      const source = String(currentMcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === `AB${row}`)?.value ?? "").trim();
      if (!source) continue;
      const product = library.products.find(product => product.id === productKey)!;
      for (const applicant of ["member", "spouse"] as const) {
        const expected = /^yes/i.test(source) && !(row === 278 && applicant === "spouse") && !(row === 126 && applicant === "spouse");
        expect(collectsBeneficiaries(library.site, productKey, product.categoryId, applicant, siteKey === "isitrust" ? "akron-bar-association" : undefined), `Main!AB${row}/${applicant}`).toBe(expected);
      }
      if ([167, 187, 379].includes(row)) expect(resolveFlowGate("beneficiary", { membership: "yes", coverageSelections: [productKey], productApplicants: { [productKey]: ["member"] }, coverageAmounts: { [`${productKey}:member`]: 0 }, coverageRiders: { [`${productKey}:member:cir`]: true } }, library.products)).toBe(false);
    }
  }
});
it("renders ATPE CI beneficiary cards and omits its excluded products on the real page", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/?site=isitrust");
  const library = resolvePrototypeLibrary(db, "isitrust", "rendered-beneficiary-scope"); installPrototypeLibrary(library);
  form.values = { membership: atpeAssociationKey, coverageSelections: ["li-add", "li-50plus", "sh-critical-illness"], productApplicants: { "li-add": ["member"], "li-50plus": ["member"], "sh-critical-illness": ["member"] }, coverageAmounts: { "li-add:member": 100000, "li-50plus:member": 10000, "sh-critical-illness:member": 10000 } };
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><Beneficiary /></MemoryRouter>));
    expect(container.textContent).toContain(library.products.find(product => product.id === "sh-critical-illness")!.name);
    expect([...container.querySelectorAll("button")].filter(button => button.textContent === "Add Beneficiary")).toHaveLength(1);
    expect(container.textContent).not.toContain("Graded Benefit Life");
  } finally { await act(async () => root.unmount()); container.remove(); }
});


it("retains known inactive product and Association policies without enabling their choices", async () => {
  const copy = structuredClone(db);
  copy.siteAssociations.find(row => row.siteKey === "isitrust" && row.associationKey === atpeAssociationKey)!.enabled = false;
  copy.siteProducts.find(row => row.siteId === "isitrust" && row.productKey === "li-20yr")!.enabled = false;
  const library = resolvePrototypeLibrary(copy, "isitrust", "inactive-owners");
  expect(library.products.some(row => row.id === "li-20yr")).toBe(false);
  expect(validateMigrationDatabase(copy), JSON.stringify(validateMigrationDatabase(copy))).toEqual([]);
  const original = resolvePrototypeLibrary(db, "isitrust", "before-disable");
  const mapping = resolveCoverageJourneyPolicy(original.site, "li-group-term")!.mappings.find(row => row.when.associationKey === atpeAssociationKey && row.when.applicantKey === "member" && row.when.mode === "new")!;
  const fixture = createCoverageJourneyFixture(original.site, "li-group-term", mapping.when);
  expect((await evaluateCoverageJourney(original.site, fixture.input, { policies: fixture.policies })).allowed).toBe(true);
  expect((await evaluateCoverageJourney(library.site, fixture.input, { policies: fixture.policies })).errors).toContain("Association is unavailable in this Site");
  expect(resolveEffectiveEligibility(library.site, "li-group-term", "member", { ageYears: 35, associationKey: atpeAssociationKey }).eligible).toBe(false);
  const invalid = structuredClone(copy);
  const policy = invalid.configurationValues.find(row => row.key === "isitrust.beneficiary-participation")!;
  if (!isBeneficiaryParticipationPolicy(policy.value)) throw new Error("Invalid fixture");
  invalid.products.push({ ...invalid.products[0], id: "unassigned-product", key: "unassigned-product" });
  policy.value.rules[0].productKey = "unassigned-product";
  expect(() => resolvePrototypeLibrary(invalid, "isitrust", "foreign-scope")).toThrow("product scope");
  expect(validateMigrationDatabase(invalid).some(error => error.includes("Orphan beneficiary participation"))).toBe(true);
});
