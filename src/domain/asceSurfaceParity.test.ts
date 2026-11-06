import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
import { applicationUnderwriting, resolveApplicationCoverage } from "./coverageRuntime";
import { coverageRelationshipErrors, evaluateEligibility, resolveBenefitLimit, resolveUnderwritingBand } from "./coverageRequirements";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "./prototypeLibrary";
import { buildGlobalTemplate } from "../dev/storybook/globalTemplate";
import { fieldSurfaceRows } from "../pages/admin/library/fieldSurfaceRows";
import { pageCatalogRows } from "../pages/admin/library/pageCatalogRows";
import { libraryRequirementRows } from "../pages/admin/library/libraryRequirementRows";
import { storedApplicationPageRows } from "../pages/admin/library/storedLibraryModel";
import { getCoverageAmountChoices } from "../utils/coverageAmounts";
import { isSelectionPolicy } from "./coverageSelectionPolicy";
import { resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";
import { resolveQuestionParticipation } from "./coverageJourney";
import { applicationRiderOptions, reconcileApplicationRiders } from "./applicationRiders";
import { getActiveFormFlow } from "../config/formFlow";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";

const catalog = {
  ...validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8"))),
  revision: "test:asce-current-catalog",
};
const library = resolvePrototypeLibrary(catalog.data, "asce", catalog.revision);
const product = (id: string) => {
  const found = library.products.find(product => product.id === id);
  if (!found) throw new Error(`Missing ASCE product: ${id}`);
  return found;
};
afterEach(() => installPrototypeLibrary(null));

describe("ASCE current catalog, prototype, Library and Storybook parity", () => {
  it("stores only supported eligibility dimensions and child collection bindings for every site", () => {
    const constraintKeys = ["id", "key", "displayId", "providedBy", "sourceReference", "productKey", "siteKey", "applicantTypeKey", "minimumAgeDays", "minimumAgeYears", "maximumAgeYears", "studentMaximumAgeYears", "minimumWorkHours"].sort();
    for (const constraint of catalog.data.eligibilityConstraints) expect(Object.keys(constraint).sort()).toEqual(constraintKeys);
    const childFields = ["child-first-name", "child-last-name", "child-birth-date", "child-gender", "child-full-time-student", "child-honorably-discharged-service-member"];
    for (const site of catalog.data.sites) {
      const collection = resolvePrototypeLibrary(catalog.data, site.key, catalog.revision).fieldCollections.children;
      expect(collection.mapping.fields.every(field => childFields.includes(field.id)), site.key).toBe(true);
      expect(Object.keys(collection.mapping.fieldToKey).every(key => childFields.includes(key)), site.key).toBe(true);
    }
  });
  it("documents ASCE verification address fields as an Eligibility modal in Library", () => {
    const eligibility = pageCatalogRows(catalog, "asce").find(page => page.key === "eligibility")!;
    const address = eligibility.fieldGroups.find(group => group.label === "Verification address modal")!;
    expect(address.fields.map(field => field.key)).toEqual(expect.arrayContaining(["street-address", "apt-suite", "city", "state", "zip-code"]));
  });
  it.each(["prototype", "storybook"] as const)("uses only QD Life health pages from the saved ASCE configuration in %s", surface => {
    const current = surface === "prototype" ? library : buildGlobalTemplate(catalog, "multipleTerms");
    installPrototypeLibrary(current);
    expect(current.site.configuration.pages.filter(page => page.key.startsWith("health-") && page.requirement !== "none").map(page => page.key)).toEqual(["health-qd"]);
    expect(storedApplicationPageRows(catalog, "asce").filter(page => page.key.startsWith("health-")).map(page => page.key)).toEqual(["health-qd"]);
    const healthPages = (values: ApplicationFormValues) => getActiveFormFlow(values).filter(page => page.startsWith("health-"));
    const values: ApplicationFormValues = {
      membership: "yes", "birth-date": "1990-01-15", "state-province": "NY",
      "has-other-life-insurance": "no", "existing-life-insurance-amount": "0",
      coverageSelections: ["li-term"], productApplicants: { "li-term": ["member"] },
      coverageAmounts: { "li-term:member": 100000 },
    };
    expect(healthPages(values)).toEqual(["health-qd"]);
    expect(healthPages({ ...values, coverageRiders: { "li-term:cir:member": true }, coverageRiderAmounts: { "li-term:cir:member": 50000 } })).toEqual(["health-qd"]);
    const olderLife = { ...values, "birth-date": "1960-01-15", coverageSelections: ["li-10yr"], productApplicants: { "li-10yr": ["member"] }, coverageAmounts: { "li-10yr:member": 100000 } };
    expect(healthPages(olderLife)).toEqual(["health-qd"]);
    expect(applicationUnderwriting(current.products.find(product => product.id === "li-10yr")!, "member", olderLife)).toMatchObject({ underwritingType: "FUW", healthPage: "health-qd" });
    expect(healthPages({ ...values, coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member"] }, coverageAmounts: { "di-ltd:member": 1500 }, "hours-worked-per-week": "40", "average-monthly-income": "5000", "is-self-employed": "no" })).toEqual([]);
    expect(healthPages({ ...values, coverageSelections: ["li-add"], productApplicants: { "li-add": ["member"] }, coverageAmounts: { "li-add:member": 100000 } })).toEqual([]);
    expect(healthPages({ ...values, dependents: ["child"], productApplicants: { "li-term": ["child"] }, coverageAmounts: { "li-term:child": 10000 } })).toEqual([]);
    for (const applicant of ["member", "spouse"]) {
      expect(resolveQuestionParticipation(current.site, "li-term", applicant, "new", {}, [], ["cir"], "QD")).toMatchObject({ healthPage: "health-qd", cirQuestionnaireRequired: false });
      expect(resolveQuestionParticipation(current.site, "di-ltd", applicant, "new", {}, [], [], "FUW")).toMatchObject({ healthPage: null });
    }
    expect(current.client.tpaIntegration).toMatchObject({ requireAddressBeforeVerification: true, lookupFields: ["first-name", "last-name", "birth-date", "member-id", "state-province"] });
  });

  it("applies the saved CIR age, base and amount caps to offered and restored elections", () => {
    installPrototypeLibrary(library);
    const term = product("li-term");
    const cir = term.riders!.find(rider => rider.id === "cir")!;
    const values = {
      "birth-date": "1990-01-15", "spouse-birth-date": "1990-01-15",
      "state-province": "NY", dependents: ["spouse"],
      coverageAmounts: { "li-term:member": 100000, "li-term:spouse": 100000 },
      coverageRiders: { "li-term:cir:member": true, "li-term:cir:spouse": true },
      coverageRiderAmounts: { "li-term:cir:member": 200000, "li-term:cir:spouse": 200000 },
    };
    expect(applicationRiderOptions(term, cir, "member", values).choices).toEqual([50000, 100000]);
    expect(applicationRiderOptions(term, cir, "spouse", values).choices).toEqual([25000, 50000, 75000, 100000]);
    expect(reconcileApplicationRiders([term], values).coverageRiderAmounts).toEqual({ "li-term:cir:member": 50000, "li-term:cir:spouse": 25000 });
    const tooLittleBase = { ...values, coverageAmounts: { "li-term:member": 10000 } };
    expect(applicationRiderOptions(term, cir, "member", tooLittleBase).available).toBe(false);
    expect(reconcileApplicationRiders([term], tooLittleBase).coverageRiders).toEqual({});
    expect(applicationRiderOptions(term, cir, "member", { ...values, "birth-date": "1950-01-15" }).available).toBe(false);
    expect(applicationRiderOptions(term, cir, "member", { ...values, coverageAmounts: { "li-term:member": 1500000 } }).choices.at(-1)).toBe(1000000);
  });

  it("offers the reviewed five products and exact plan codes", () => {
    expect(library.products.map(product => product.id).sort()).toEqual(["di-ltd", "li-10yr", "li-20yr", "li-add", "li-term"]);
    for (const [id, code] of [["li-term", "101"], ["li-10yr", "102"], ["li-20yr", "121"], ["li-add", "999"], ["di-ltd", "601"]]) {
      expect(product(id).planCode.primary, id).toBe(code);
    }
    const assignments = libraryRequirementRows(catalog, "asce").filter(row => row.dataset === "siteProducts" && row.status === "Enabled assignment");
    expect(assignments.map(row => row.product).sort()).toEqual(library.products.map(product => product.id).sort());
  });

  it.each([
    ["li-10yr", 69, 65],
    ["li-20yr", 59, 55],
  ] as const)("retains approved %s age boundaries and older-age FUW for both adults", (id, maximumAge, fuwAge) => {
    for (const applicant of ["member", "spouse"] as const) {
      expect(evaluateEligibility(product(id).requirements, applicant, { ageYears: 17 })).toBe("ineligible");
      expect(evaluateEligibility(product(id).requirements, applicant, { ageYears: 18 })).toBe("eligible");
      expect(evaluateEligibility(product(id).requirements, applicant, { ageYears: maximumAge })).toBe("eligible");
      expect(evaluateEligibility(product(id).requirements, applicant, { ageYears: maximumAge + 1 })).toBe("ineligible");
      for (const age of [fuwAge, maximumAge]) expect(resolveUnderwritingBand(product(id), applicant, age, 100000)?.underwritingType).toBe("FUW");
      const displayed = libraryRequirementRows(catalog, "asce").filter(row => row.product === id && row.applicant === applicant);
      expect(displayed.some(row => row.dataset === "eligibilityConstraints")).toBe(true);
      expect(displayed.some(row => row.dataset === "underwritingBands" && row.behavior.includes("FUW"))).toBe(true);
    }
  });

  it("retains DI income caps, increments and the spouse package", () => {
    installPrototypeLibrary(library);
    const di = product("di-ltd");
    for (const [ageYears, selfEmployed, yearsSelfEmployed, maximum] of [[30, false, 0, 8550], [65, false, 0, 4200], [65, true, 0.5, 1050]] as const) {
      expect(resolveBenefitLimit(di.requirements, "member", { ageYears, selfEmployed, yearsSelfEmployed, averageMonthlyIncome: 20000 })?.maximum).toBe(maximum);
    }
    expect(resolveBenefitLimit(di.requirements, "member", { ageYears: 30, selfEmployed: false, averageMonthlyIncome: 1000 })?.maximum).toBe(600);
    const restricted = resolveApplicationCoverage(di, "member", {
      "birth-date": "1990-01-15", "state-province": "NY", "hours-worked-per-week": "30",
      "is-self-employed": "yes", "years-self-employed": "0.5", "average-monthly-income": "5000",
    }, library.products);
    expect(restricted.waitingPeriod.requiredValue).toBe("90-days");
    expect(restricted.benefitPeriod.requiredValue).toBe("5-years");
    const amounts = getCoverageAmountChoices(di, "member");
    expect(amounts[0]).toBe(150);
    expect(amounts.at(-1)).toBe(8550);
    expect(amounts.every(amount => amount % 150 === 0)).toBe(true);
    expect(getCoverageAmountChoices(di, "spouse")).toEqual([500]);
    const spouse = resolveApplicationCoverage(di, "spouse", {
      "spouse-birth-date": "1990-01-15", "state-province": "NY", dependents: ["spouse"],
    }, library.products);
    expect(spouse.waitingPeriod.requiredValue).toBe("30-days");
    expect(spouse.benefitPeriod.requiredValue).toBe("2-years");
  });

  it("retains child eligibility, fixed Life amount, one-plan dependency and no adult QD", () => {
    installPrototypeLibrary(library);
    for (const id of ["li-term", "li-10yr", "li-20yr"]) {
      const life = product(id);
      expect(getCoverageAmountChoices(life, "child")).toEqual([10000]);
      expect(evaluateEligibility(life.requirements, "child", { ageDays: 13, ageYears: 0, })).toBe("ineligible");
      expect(evaluateEligibility(life.requirements, "child", { ageDays: 14, ageYears: 0, })).toBe("eligible");
      expect(evaluateEligibility(life.requirements, "child", { ageDays: 8500, ageYears: 23, fullTimeStudent: true })).toBe("eligible");
      expect(evaluateEligibility(life.requirements, "child", { ageDays: 8500, ageYears: 23, fullTimeStudent: false })).toBe("ineligible");
      expect(applicationUnderwriting(life, "child", { children: [{ "child-birth-date": "2016-01-01", "child-full-time-student": "no" }], coverageAmounts: { [`${id}:child`]: 10000 } })).toMatchObject({ status: "resolved", underwritingType: "NA" });
    }
    expect(coverageRelationshipErrors(library.products, { "li-10yr": ["child"] })).not.toEqual([]);
    expect(coverageRelationshipErrors(library.products, { "li-term": ["member"], "li-10yr": ["child"] })).toEqual([]);
    expect(coverageRelationshipErrors(library.products, { "li-term": ["member"], "li-10yr": ["child"], "li-20yr": ["child"] })).not.toEqual([]);
  });

  it("offers CIR only with base Life and preserves reviewed CIR and AD&D increments", () => {
    const term = product("li-term");
    const rider = term.riders?.find(rider => rider.id === "cir");
    expect(rider).toBeDefined();
    for (const [applicant, increment] of [["member", 50000], ["spouse", 25000]] as const) {
      const amounts = getCoverageAmountChoices({ coverageAmounts: rider!.coverageAmounts }, applicant);
      expect(amounts[0]).toBe(increment);
      expect(amounts.at(-1)).toBe(1000000);
      expect(amounts.every((amount, index) => index === 0 || amount - amounts[index - 1] === increment)).toBe(true);
      const accident = getCoverageAmountChoices(product("li-add"), applicant);
      expect(accident.length).toBeGreaterThan(1);
      expect(accident.every((amount, index) => index === 0 || amount - accident[index - 1] === 50000)).toBe(true);
    }
    const policy = library.site.configuration.products.find(product => product.productKey === "li-term")!.selectionPolicies[0].value;
    expect(isSelectionPolicy(policy)).toBe(true);
    if (!isSelectionPolicy(policy)) throw new Error("Invalid ASCE selection policy");
    expect(policy.modes).not.toContain("rider-only");
    expect(policy.riderOnlyApplicants).toEqual([]);
    const journey = resolveCoverageJourneyPolicy(library.site, "li-term")!;
    expect(journey.questions.every(question => !question.modes.includes("rider-only"))).toBe(true);
    expect(journey.mappings.every(mapping => mapping.when.mode !== "rider-only")).toBe(true);
    const selectionRow = libraryRequirementRows(catalog, "asce").find(row => row.key === "asce.li-term.selection-policy")!;
    expect(selectionRow.behavior).toContain("Rider Only Applicants: None recorded");
    expect(selectionRow.behavior).not.toContain("rider-only");
    expect(selectionRow.behavior).not.toContain("Modes:");
  });

  it("documents current membership, child and quote fields on the Library surfaces", () => {
    const rows = fieldSurfaceRows(catalog, "asce");
    expect(rows.some(row => row.pages.includes("membership") && row.field.id === "member-id" && row.field.required)).toBe(true);
    expect(rows.some(row => row.pages.includes("membership") && row.field.id === "title")).toBe(false);
    expect(rows.some(row => row.pages.includes("eligibility") && row.field.id === "child-full-time-student" && row.field.required)).toBe(true);
    for (const id of ["tobacco-last-used", "tobacco-products"]) expect(rows.some(row => row.tool && row.field.id === id && row.pages.includes("home")), id).toBe(true);
    expect(rows.some(row => row.tool && /quote/i.test(row.surface) && row.pages.includes("membership"))).toBe(false);
    expect(storedApplicationPageRows(catalog, "asce").some(row => row.key === "health-ci")).toBe(false);
  });

  it("keeps the generic multiple-term Storybook example's ASCE requirements intact", () => {
    const story = buildGlobalTemplate(catalog, "multipleTerms");
    expect(story.products.map(product => product.id)).toEqual(library.products.map(product => product.id));
    for (const current of library.products) {
      const example = story.products.find(product => product.id === current.id)!;
      expect(example.requirements, current.id).toEqual(current.requirements);
      expect(example.underwritingBands, current.id).toEqual(current.underwritingBands);
      expect(example.coverageAmounts, current.id).toEqual(current.coverageAmounts);
    }
    expect(story.fieldCollections.children.mapping.fields).toEqual(library.fieldCollections.children.mapping.fields);
  });
});
