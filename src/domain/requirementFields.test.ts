import { describe, expect, it } from "vitest";
import fieldIds from "../../requirements/global/fields.json";
import fieldDetails from "../../requirements/parked/field-details.json";
import optionLists from "../../requirements/global/option-lists.json";
import quoteMapping from "../../requirements/mappings/components/quote-calculator.json";
import coverageMapping from "../../requirements/mappings/page-fields/coverage.json";
import membershipMapping from "../../requirements/mappings/components/membership.json";
import eligibilityMapping from "../../requirements/mappings/components/eligibility.json";
import asceFields from "../../requirements/parked/sites/asce/fields.json";
import catalog from "../../public/catalog/portal.json";
import type { FieldDefinition } from "./fields";
import { resolveEffectiveSite } from "./effectiveSite";
import { requirementAnswerKey, parseRequirementAnswerKey, requirementSectionNotes, resolveMappedFields, siteUsesRequirementFields, withRequirementFields, withRequirementPageFields, type RequirementFieldSource } from "./requirementFields";

const quote = { component: "quote-calculator" } as const;
const quoteInputIds = ["zip-postal-code", "state-province", "birth-date", "gender", "smoker", "tobacco-last-used", "tobacco-products", "average-monthly-income", "hours-worked-per-week", "actively-at-work", "monthly-business-expenses", "business-expense-responsibility"];
const source = () => structuredClone({ fieldIds, fieldDetails, optionLists, mappings: [quoteMapping, coverageMapping], sites: { asce: asceFields } }) as RequirementFieldSource & {
  fieldIds: { fields: Array<{ id: string }> }; fieldDetails: { fields: Detail[] }; optionLists: Record<string, Array<{ value: string; label: string }>>;
  mappings: Array<{ fields: Array<{ field: string; people: string[] }> }>; sites: Record<string, { fields: Record<string, unknown> }>;
};
type Detail = Record<string, unknown> & { id: string };
const detail = (data: ReturnType<typeof source>, id: string) => data.fieldDetails.fields.find(field => field.id === id)!;
const resolve = (data: ReturnType<typeof source>, mapping: Parameters<typeof resolveMappedFields>[0] = quote, options: { siteId?: string; person?: "self" | "spouse" | "child" } = {}) =>
  resolveMappedFields(mapping, { ...options, source: data });

describe("requirement field loader", () => {
  it("resolves any mapping in mapping order, for the requested person", () => {
    const data = source();
    detail(data, "tobacco-last-used").label = "Updated date";
    data.optionLists["tobacco-products"][0].label = "Updated product";
    const fields = resolve(data);
    expect(fields.map(field => field.id)).toEqual(quoteMapping.fields.map(row => row.field));
    expect(fields.find(field => field.id === "tobacco-last-used")).toMatchObject({ label: "Updated date", inputType: "date" });
    expect(fields.find(field => field.id === "tobacco-products")?.options?.[0].label).toBe("Updated product");
    expect(fields.find(field => field.id === "coverage-amount")).toMatchObject({ inputType: "dropdown", label: "Benefit amount" });
    expect(fields.find(field => field.id === "coverage-amount")?.options).toBeUndefined();
    const spouse = resolve(data, { page: "coverage" }, { person: "spouse" });
    expect(spouse.map(field => field.id)).toEqual(coverageMapping.fields.filter(row => row.people.includes("spouse")).map(row => row.field));
  });

  it("matches what applicants saw before the cutover; only the CHG-006 catalog names change", () => {
    const renamed: Record<string, [string, string]> = {
      smoker: ["Smoker", "Tobacco use"], "tobacco-products": ["Tobacco products", "Tobacco products used"],
      "zip-postal-code": ["Zip code", "ZIP / postal code"], "state-province": ["State", "State / province"], "birth-date": ["Birthdate", "Date of birth"],
    };
    const legacy = new Map(catalog.data.fields.map(field => [field.key, field.definition as FieldDefinition]));
    for (const { displayName, ...field } of resolveMappedFields(quote, { siteId: "asce" }).filter(field => quoteInputIds.includes(field.id))) {
      const { displayName: legacyName, ...before } = legacy.get(field.id)!;
      expect(field, field.id).toEqual(before);
      expect([legacyName, displayName], field.id).toEqual(renamed[field.id] ?? [legacyName, legacyName]);
    }
  });

  it("applies site overrides: configuration, per-person label, required and option subsets", () => {
    const data = source();
    data.mappings[0].fields.push({ field: "membership", people: ["self"] }, { field: "member-id", people: ["self"] });
    const asce = resolve(data, quote, { siteId: "asce" });
    expect(asce.find(field => field.id === "membership")).toMatchObject({ inputType: "radio", label: "Are you a member of the American Society of Civil Engineers?" });
    expect(asce.find(field => field.id === "member-id")?.required).toBe(true);
    expect(asce.find(field => field.id === "coverage-categories")?.options?.map(option => option.value)).toEqual(["LI", "AD", "DI"]);
    expect(resolve(data).find(field => field.id === "coverage-categories")!.options!.length).toBeGreaterThan(3);
    for (const bad of [{ configuration: "nope" }, { options: ["ZZ"] }, { color: "red" }]) {
      const broken = source();
      broken.sites.asce.fields["coverage-categories"] = bad;
      expect(() => resolve(broken, quote, { siteId: "asce" }), JSON.stringify(bad)).toThrow();
    }
  });

  it("ASCE names the association in the spouse membership question and gets every Eligibility section note", () => {
    expect(resolveMappedFields({ component: "eligibility" }, { siteId: "asce", person: "spouse" }).find(field => field.id === "membership")?.label)
      .toBe("Is your spouse also a member of the American Society of Civil Engineers?");
    expect(requirementSectionNotes("eligibility", "asce")).toEqual({
      selfEligibility: "Throughout this site you will be referred to as a Member of the Civil Engineering profession.",
      spouseSection: 'Domestic Partnership/Civil Union is determined by State Law and they will be referred to as "Spouse" throughout the application.',
      childSection: "Only unmarried children are eligible for coverage.",
    });
    expect(requirementSectionNotes("eligibility", "abe")).toBeUndefined();
    expect(() => requirementSectionNotes("eligibility", "asce", undefined, {})).toThrow(/not in the requirements content/);
  });

  it("only sites with a requirements folder load from JSON", () => {
    expect(siteUsesRequirementFields("asce")).toBe(true);
    expect(siteUsesRequirementFields("abe")).toBe(false);
  });

  it.each(["fieldIds", "fieldDetails"] as const)("rejects missing and duplicate entries in %s", key => {
    const missing = source();
    const entries = missing[key].fields as Array<{ id: string }>;
    entries.splice(entries.findIndex(entry => entry.id === "tobacco-last-used"), 1);
    expect(() => resolve(missing)).toThrow();
    const duplicate = source();
    const items = duplicate[key].fields as Array<{ id: string }>;
    items.push(items.find(entry => entry.id === "tobacco-last-used")!);
    expect(() => resolve(duplicate)).toThrow();
  });

  it("rejects unknown or duplicated mappings and duplicate mapping rows", () => {
    expect(() => resolveMappedFields({ component: "nope" }, { source: source() })).toThrow();
    const twice = source();
    twice.mappings.push(structuredClone(twice.mappings[0]));
    expect(() => resolve(twice)).toThrow();
    const row = source();
    row.mappings[0].fields.push(row.mappings[0].fields[0]);
    expect(() => resolve(row)).toThrow();
  });

  it("rejects inappropriate people, types, formats and unsupported properties", () => {
    const cases: Array<[string, string, unknown]> = [
      ["tobacco-products", "people", ["spouse"]],
      ["tobacco-products", "type", "tabs"],
      ["birth-date", "required", "yes"],
      ["average-monthly-income", "format", "bogus"],
      ["average-monthly-income", "inputMode", "bogus"],
      ["gender", "label", " "],
      ["actively-at-work", "configurations", {}],
      ["average-monthly-income", "options", [{ value: "a", label: "A" }]],
      ["gender", "colour", "red"],
    ];
    for (const [id, key, value] of cases) {
      const data = source();
      detail(data, id)[key] = value;
      expect(() => resolve(data), `${id}.${key}`).toThrow();
    }
  });

  it("rejects missing, invalid and duplicate options", () => {
    const missing = source();
    missing.optionLists["tobacco-products"] = [];
    expect(() => resolve(missing)).toThrow();
    const invalid = source();
    invalid.optionLists["tobacco-products"][0].label = " ";
    expect(() => resolve(invalid)).toThrow();
    const duplicate = source();
    duplicate.optionLists["tobacco-products"].push(duplicate.optionLists["tobacco-products"][0]);
    expect(() => resolve(duplicate)).toThrow();
    for (const id of ["gender", "state-province"]) {
      const absent = source();
      delete detail(absent, id).options;
      expect(() => resolve(absent), id).toThrow();
    }
  });

  it("keeps the surface's membership and order, places follow-ups and refuses type drift", () => {
    const surfaceField = (id: string, inputType: FieldDefinition["inputType"] = "text"): FieldDefinition => ({ id, label: `Legacy ${id}`, inputType });
    const surface = [surfaceField("zip-postal-code"), surfaceField("hours-worked-per-week", "number"), surfaceField("smoker", "radio"), surfaceField("quote-selection"), surfaceField("gender", "radio")];
    const followUps = { followUps: { smoker: ["tobacco-last-used", "tobacco-products"] } };
    expect(withRequirementFields(surface, quote, "abe", followUps)).toBe(surface);
    const resolved = withRequirementFields(surface, quote, "asce", followUps);
    expect(resolved.map(field => field.id)).toEqual(["zip-postal-code", "hours-worked-per-week", "smoker", "tobacco-last-used", "tobacco-products", "quote-selection", "gender"]);
    expect(resolved.find(field => field.id === "quote-selection")?.label).toBe("Legacy quote-selection");
    expect(resolved.filter(field => field.id !== "quote-selection").every(field => !field.label.startsWith("Legacy"))).toBe(true);
    expect(withRequirementFields([surfaceField("gender", "radio")], quote, "asce", followUps).map(field => field.id)).toEqual(["gender", "tobacco-last-used", "tobacco-products"]);
    expect(() => withRequirementFields([surfaceField("gender")], quote, "asce")).toThrow(/gender/);
    expect(() => withRequirementFields(surface, quote, "asce", { followUps: { smoker: ["nope"] } })).toThrow();
  });
});

describe("rolled-out page fields", () => {
  const membershipSource = () => { const data = source(); data.mappings.push(membershipMapping as never); return data; };
  const saved = (id: string, extra: Partial<FieldDefinition> = {}) => ({ key: id, included: true, definition: { id, label: `Saved ${id}`, inputType: "text", helperText: "Saved help", ...extra } as FieldDefinition });

  it("replaces the authored keys, keeps saved runtime keys, order and inclusion", () => {
    const data = membershipSource();
    detail(data, "member-id").label = "JSON membership ID";
    const fields = [saved("phone", { phoneTypeFieldId: "phone-type", format: "phone" }), { ...saved("member-id"), included: false }, saved("not-mapped")];
    const resolved = withRequirementPageFields("membership", fields, "asce", data);
    expect(resolved.map(field => [field.key, field.included])).toEqual([["phone", true], ["member-id", false], ["not-mapped", true]]);
    expect(resolved[0].definition).toMatchObject({ label: "Phone Number", phoneTypeFieldId: "phone-type", format: "phone" });
    expect(resolved[0].definition.helperText).toBeUndefined();
    expect(resolved[1].definition).toMatchObject({ label: "JSON membership ID", required: true });
    expect(resolved[2]).toBe(fields[2]);
  });

  it("leaves sites without requirements and pages not yet rolled out unchanged", () => {
    const fields = [saved("member-id")];
    expect(withRequirementPageFields("membership", fields, "abe", membershipSource())).toBe(fields);
    expect(withRequirementPageFields("profile", fields, "asce", membershipSource())).toBe(fields);
  });

  it("ASCE's saved Membership fields already match the requirements JSON", () => {
    const page = resolveEffectiveSite(catalog.data as never, "asce").configuration.pages.find(entry => entry.key === "membership")!;
    const included = page.fields.filter(field => field.included);
    expect(included.map(field => field.definition.id)).toEqual(["membership", "first-name", "last-name", "email", "phone", "member-id"]);
    const resolved = withRequirementPageFields("membership", included, "asce");
    resolved.forEach((field, index) => expect(field.definition, field.key).toEqual(included[index].definition));
  });
});

describe("requirement field loader across pages", () => {
  it("resolves page- and person-specific labels, required and helper text", () => {
    const data = source();
    data.mappings.push({ page: "health-di", fields: [{ field: "health-detail-physician-address", people: ["self", "spouse"] }, { field: "email", people: ["self", "spouse"] }] } as never);
    data.mappings.push({ page: "health-si", fields: [{ field: "health-detail-physician-address", people: ["self"] }] } as never);
    const [address, email] = resolve(data, { page: "health-di" });
    expect(address).toMatchObject({ label: "Name and address of each physician, practitioner, and hospital", required: false, multiline: true });
    expect(email.helperText).toMatch(/valid email/);
    expect(resolve(data, { page: "health-di" }, { person: "spouse" })[1].helperText).toBeUndefined();
    expect(resolve(data, { page: "health-si" })[0]).toMatchObject({ label: "Name and Address of Each Physician, Practitioner, and Hospital", required: true });
  });

  it("resolves every page and component mapping in the requirements", () => {
    for (const mapping of [quoteMapping, coverageMapping]) {
      const ref = "component" in mapping ? { component: String(mapping.component) } : { page: String((mapping as { page: string }).page) };
      for (const person of ["self", "spouse", "child"] as const) expect(() => resolveMappedFields(ref, { person, siteId: "asce" })).not.toThrow();
    }
  });
});

describe("site page include and hide", () => {
  const eligibility = { component: "eligibility" } as const;
  const ids = (siteId: string | undefined, person: "self" | "spouse" | "child", sitePages?: RequirementFieldSource["sitePages"]) => {
    const data = { ...source(), mappings: [eligibilityMapping], sitePages } as RequirementFieldSource;
    return resolveMappedFields(eligibility, { siteId, person, page: "eligibility", source: data }).map(field => field.id);
  };

  it("leaves default-off fields out unless the site includes them", () => {
    expect(ids("asce", "child")).not.toContain("full-time-student");
    expect(ids("asce", "child", { asce: { eligibility: { include: ["full-time-student"] } } })).toContain("full-time-student");
    expect(ids(undefined, "child", { asce: { eligibility: { include: ["full-time-student"] } } })).not.toContain("full-time-student");
  });

  it("lets a site hide a default-on field", () => {
    expect(ids("asce", "child", { asce: { eligibility: { hide: ["gender"] } } })).not.toContain("gender");
  });

  it("resolves ASCE's reviewed Eligibility fields for each person", () => {
    const resolve = (person: "self" | "spouse" | "child") => resolveMappedFields(eligibility, { siteId: "asce", person, page: "eligibility" });
    expect(resolve("self").map(field => field.id)).toEqual(["zip-postal-code", "state-province", "birth-date", "dependents"]);
    expect(resolve("spouse").map(field => [field.id, field.label, field.required])).toEqual([
      ["membership", "Is your spouse also a member of the American Society of Civil Engineers?", true],
      ["first-name", "First Name", true], ["last-name", "Last Name", true], ["birth-date", "Date of Birth", true],
    ]);
    expect(resolve("child").map(field => field.id)).toEqual(["first-name", "last-name", "birth-date", "gender", "full-time-student"]);
  });
});


describe("Eligibility answer keys and overlay", () => {
  it("round-trips only mapped person and field pairs", () => {
    for (const [field, person] of [["birth-date", "self"], ["membership", "spouse"], ["first-name", "child"], ["full-time-student", "child"]] as const) {
      const key = requirementAnswerKey(field, person);
      expect(parseRequirementAnswerKey(key)).toEqual({ field, person });
    }
    expect(parseRequirementAnswerKey("child-membership")).toBeUndefined();
    expect(parseRequirementAnswerKey("spouse-full-time-student")).toBeUndefined();
    expect(parseRequirementAnswerKey("child-firstName")).toBeUndefined();
  });
  it("resolves saved spouse IDs and removes excluded or hidden fields", () => {
    const data = { ...source(), mappings: [eligibilityMapping], sitePages: { asce: { eligibility: { include: ["full-time-student"] } } } } as RequirementFieldSource;
    const saved = (id: string) => ({ definition: { id, label: "old", inputType: "text" } as FieldDefinition });
    const rows = [saved("spouse-membership"), saved("spouse-first-name"), saved("child-full-time-student"), saved("child-membership")];
    const resolved = withRequirementPageFields("eligibility", rows, "asce", data);
    expect(resolved.map(row => row.definition.id)).toEqual(["spouse-membership", "spouse-first-name", "child-full-time-student"]);
    expect(resolved[0].definition).toMatchObject({ label: "Is your spouse also a member of the American Society of Civil Engineers?", required: true });
    expect(resolved[1].definition).toMatchObject({ label: "First Name", required: true });
    expect(resolved[2].definition.label).toBe("Is the child a full-time student?");
    data.sitePages = { asce: { eligibility: { hide: ["first-name"] } } };
    expect(withRequirementPageFields("eligibility", rows, "asce", data).map(row => row.definition.id)).toEqual(["spouse-membership"]);
  });
});
