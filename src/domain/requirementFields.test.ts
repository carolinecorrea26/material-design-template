import { describe, expect, it } from "vitest";
import fieldIds from "../../requirements/global/fields.json";
import fieldDetails from "../../requirements/parked/field-details.json";
import optionLists from "../../requirements/global/option-lists.json";
import quoteMapping from "../../requirements/mappings/components/quote-calculator.json";
import coverageMapping from "../../requirements/mappings/page-fields/coverage.json";
import membershipMapping from "../../requirements/mappings/components/membership.json";
import eligibilityMapping from "../../requirements/mappings/components/eligibility.json";
import asceFields from "../../requirements/parked/sites/asce/fields.json";
import asceMembershipPage from "../../requirements/parked/sites/asce/pages/membership.json";
import contactMapping from "../../requirements/mappings/page-fields/contact.json";
import paymentMapping from "../../requirements/mappings/page-fields/payment.json";
import healthSiMapping from "../../requirements/mappings/page-fields/health-si.json";
import healthTeleMapping from "../../requirements/mappings/page-fields/health-tele.json";
import healthDiMapping from "../../requirements/mappings/page-fields/health-di-supp.json";
import healthCirMapping from "../../requirements/mappings/page-fields/health-cir.json";
import advisorMapping from "../../requirements/mappings/page-fields/advisor-login.json";
import resumeMapping from "../../requirements/mappings/page-fields/resume.json";
import resumeMethodMapping from "../../requirements/mappings/page-fields/resume-method.json";
import resumeCodeMapping from "../../requirements/mappings/page-fields/resume-code.json";
import catalog from "../../public/catalog/portal.json";
import type { FieldDefinition } from "./fields";
import { resolveEffectiveSite } from "./effectiveSite";
import { defaultRequirementFieldSource, requirementAnswerKey, parseRequirementAnswerKey, requirementPageNote, requirementSectionNotes, resolveMappedFields, siteUsesRequirementFields, withRequirementFields, type RequirementFieldSource } from "./requirementFields";

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
  it.each([resumeMapping, resumeMethodMapping, resumeCodeMapping])('keeps $page collection, copy and validation global', mapping => {
    const data = source(); data.mappings.push(mapping as never);
    data.sites.example = { fields: {} };
    data.sitePages = { example: { [mapping.page]: {} } };
    const fields = () => resolveMappedFields({ page: mapping.page }, { source: data, siteId: 'example' });
    const id = mapping.fields[0].field;
    expect(fields().find(field => field.id === id)?.required).toBe(true);
    data.sitePages.example[mapping.page] = { hide: [id] };
    expect(fields).toThrow('Required mapped field cannot be hidden');
    data.sitePages.example[mapping.page] = {};
    for (const override of [{ required: false }, { required: { [mapping.page]: false } }, { optionalForProducts: ['li-term'] }]) {
      data.sites.example.fields[id] = override;
      expect(fields).toThrow('Required mapped field cannot be optional');
    }
    for (const [property, value] of Object.entries({ label: 'Changed wording', options: ['email'], format: 'alphanumeric', inputMode: 'text', minLength: 1, maxLength: 8 })) {
      data.sites.example.fields[id] = { [property]: value };
      expect(fields, `${id}/${property}`).toThrow('Fixed mapped field property');
    }
  });
  it('keeps Advisor core collection and validation global while retaining ordinary field labels', () => {
    const data = source(); data.mappings.push(advisorMapping as never);
    data.sites.example = { fields: {} };
    data.sitePages = { example: { 'advisor-login': {} } };
    const fields = () => resolveMappedFields({ page: 'advisor-login' }, { source: data, siteId: 'example' });
    for (const { field: id } of advisorMapping.fields) {
      data.sitePages.example['advisor-login'] = { hide: [id] };
      expect(fields, id).toThrow('Required mapped field cannot be hidden');
      data.sitePages.example['advisor-login'] = {};
      for (const override of [{ required: false }, { required: { 'advisor-login': false } }, { optionalForProducts: ['li-term'] }]) {
        data.sites.example.fields[id] = override;
        expect(fields, id).toThrow('Required mapped field cannot be optional');
      }
      for (const [property, value] of Object.entries({ format: 'digits', inputMode: 'numeric', minLength: 1, maxLength: 6 })) {
        data.sites.example.fields[id] = { [property]: value };
        expect(fields, `${id}/${property}`).toThrow('Fixed mapped field property');
      }
      data.sites.example.fields[id] = { label: 'Configured label' };
      if (id === 'advisor-flow-type') expect(fields).toThrow('Fixed mapped field property');
      else expect(fields().find(field => field.id === id)?.label).toBe('Configured label');
      delete data.sites.example.fields[id];
    }
    data.sites.example.fields['advisor-flow-type'] = { options: ['new'] };
    expect(fields).toThrow('Fixed mapped field property');
  });
  it.each([healthSiMapping, healthTeleMapping, healthDiMapping, healthCirMapping])('keeps $page medical fields questionnaire-controlled for both adults', mapping => {
    const data = source();
    data.mappings.push(mapping as never);
    data.sites.example = { fields: {} };
    data.sitePages = { example: { [mapping.page]: {} } };
    const fields = (person: 'self' | 'spouse' = 'self') => resolveMappedFields({ page: mapping.page }, { source: data, siteId: 'example', person });
    for (const { field: id } of mapping.fields) {
      const definition = fields().find(field => field.id === id)!;
      for (const person of ['self', 'spouse'] as const) {
        data.sitePages.example[mapping.page] = { fieldParticipation: { [person]: { hide: [id] } } };
        expect(() => fields(person), id).toThrow('Required mapped field cannot be hidden');
        data.sitePages.example[mapping.page] = {};
        for (const override of [{ label: 'Changed medical wording' }, { required: !definition.required }, { format: 'email' }, { minLength: 1 }, { maxLength: 5 }, { optionalForProducts: ['li-term'] }, ...(definition.options ? [{ options: [definition.options[0].value] }] : [])]) {
          data.sites.example.fields[id] = override;
          expect(() => fields(person), id).toThrow('Fixed mapped field property');
        }
        delete data.sites.example.fields[id];
      }
    }
    const physician = fields().find(field => field.id === 'health-detail-physician-address');
    if (physician) expect(physician.required).toBe(mapping.page === 'health-si');
  });
  it('keeps applicable Payment fields and formats global while retaining Site labels', () => {
    const data = source();
    data.mappings.push(paymentMapping as never);
    data.sites.example = { fields: {} };
    data.sitePages = { example: { payment: {} } };
    const fields = () => resolveMappedFields({ page: 'payment' }, { source: data, siteId: 'example' });
    expect(fields().every(field => field.required)).toBe(true);
    for (const { field: id } of paymentMapping.fields) {
      data.sitePages.example.payment = { hide: [id] };
      expect(fields, id).toThrow('Required mapped field cannot be hidden');
      data.sitePages.example.payment = {};
      for (const override of [{ required: false }, { required: { payment: false } }, { optionalForProducts: ['li-term'] }]) {
        data.sites.example.fields[id] = override;
        expect(fields, id).toThrow('Required mapped field cannot be optional');
      }
      for (const [property, value] of Object.entries({ format: 'email', inputMode: 'text', minLength: 1, maxLength: 5 })) {
        data.sites.example.fields[id] = { [property]: value };
        expect(fields, `${id}/${property}`).toThrow('Fixed mapped field property');
      }
      data.sites.example.fields[id] = { label: `Configured ${id}` };
      expect(fields().find(field => field.id === id)?.label).toBe(`Configured ${id}`);
    }
    for (const id of ['payment-information-opt-in', 'payment-method', 'payment-frequency', 'payment-shared-method', 'payment-shared-frequency']) {
      const option = fields().find(field => field.id === id)!.options![0].value;
      data.sites.example.fields[id] = { options: [option] };
      expect(fields, id).toThrow('Fixed mapped field property');
      delete data.sites.example.fields[id];
    }
  });
  it('fixes member Eligibility collection while allowing person-scoped dependent fields', () => {
    const data = source(); data.mappings.push(eligibilityMapping as never);
    data.sites.example = { fields: { 'birth-date': { required: { spouse: false, child: false } } } };
    data.sitePages = { example: { eligibility: { fieldParticipation: { spouse: { hide: ['birth-date', 'membership'] }, child: { hide: ['gender'], include: ['active-military', 'full-time-student'] } } } } };
    const fields = (person: 'self' | 'spouse' | 'child' = 'self') => resolveMappedFields({ component: 'eligibility' }, { source: data, siteId: 'example', page: 'eligibility', person });
    for (const id of ['zip-postal-code', 'state-province', 'birth-date']) expect(fields().find(field => field.id === id)?.required).toBe(true);
    expect(fields('spouse').some(field => field.id === 'birth-date' || field.id === 'membership')).toBe(false);
    expect(fields('child').find(field => field.id === 'birth-date')?.required).toBe(false);
    expect(fields('child').some(field => field.id === 'gender')).toBe(false);
    expect(fields('child').filter(field => ['active-military', 'full-time-student'].includes(field.id)).map(field => field.id)).toEqual(['full-time-student', 'active-military']);
    for (const id of ['zip-postal-code', 'state-province', 'birth-date']) {
      const original = data.sitePages!.example.eligibility;
      for (const assignment of [{ hide: [id] }, { fieldParticipation: { self: { hide: [id] } } }]) {
        data.sitePages!.example.eligibility = assignment;
        expect(() => fields(), id).toThrow('Required mapped field cannot be hidden');
      }
      data.sitePages!.example.eligibility = original;
      data.sites.example.fields[id] = { required: false };
      expect(() => fields(), id).toThrow('Required mapped field cannot be optional');
      delete data.sites.example.fields[id];
    }
    for (const id of ['birth-date', 'zip-postal-code']) for (const [property, value] of Object.entries({ format: 'digits', inputMode: 'numeric', minLength: 1, maxLength: 5 })) {
      data.sites.example.fields[id] = { [property]: value };
      expect(() => fields(), `${id}/${property}`).toThrow('Fixed mapped field property');
      delete data.sites.example.fields[id];
    }
    for (const fieldParticipation of [{ unknown: { hide: [] } }, { spouse: { include: ['active-military'] } }, { child: { hide: ['no-such-field'] } }, { child: { include: ['gender'] } }]) {
      data.sitePages!.example.eligibility = { fieldParticipation };
      expect(() => fields()).toThrow('Invalid scoped field participation');
    }
  });
  it('preserves required Membership core fields and fixed contact validation while allowing other placement overrides', () => {
    const core = ['membership', 'first-name', 'last-name', 'email', 'phone', 'phone-type'];
    const membership = (data: ReturnType<typeof source>) => resolveMappedFields({ component: 'membership' }, { source: data, siteId: 'example', page: 'membership' });
    const configured = () => {
      const data = source();
      data.mappings.push(structuredClone(membershipMapping) as never, contactMapping as never);
      data.sites.example = { fields: {} };
      data.sitePages = { example: { membership: { hide: ['title'], include: ['member-id'] } } };
      return data;
    };
    for (const id of core) {
      const hidden = configured();
      hidden.sitePages!.example.membership = { hide: [id] };
      expect(() => membership(hidden), id).toThrow('Required mapped field cannot be hidden');
      for (const required of [false, { self: false }, { default: false }, { membership: false }]) {
        const optional = configured(); optional.sites.example.fields[id] = { required };
        expect(() => membership(optional), id).toThrow('Required mapped field cannot be optional');
      }
      const productException = configured(); productException.sites.example.fields[id] = { optionalForProducts: ['example-product'] };
      expect(() => membership(productException), id).toThrow('Required mapped field cannot be optional');
    }
    for (const id of ['email', 'phone']) for (const [property, value] of Object.entries({ format: 'digits', inputMode: 'text', minLength: 1, maxLength: 5 })) {
      const data = configured(); data.sites.example.fields[id] = { [property]: value };
      expect(() => membership(data), `${id}/${property}`).toThrow('Fixed mapped field property');
    }
    const allowed = configured();
    allowed.sites.example.fields = { email: { required: { contact: false } }, 'member-id': { required: false, format: 'alphanumeric', minLength: 3, maxLength: 12 } };
    const fields = membership(allowed);
    expect(core.every(id => fields.find(field => field.id === id)?.required === true)).toBe(true);
    expect(fields.some(field => field.id === 'title')).toBe(false);
    expect(fields.find(field => field.id === 'member-id')).toMatchObject({ required: false, format: 'alphanumeric', minLength: 3, maxLength: 12 });
    expect(resolveMappedFields({ page: 'contact' }, { source: allowed, siteId: 'example', person: 'spouse' }).find(field => field.id === 'email')?.required).toBe(false);
  });
  it('accepts declared membership category outcomes and rejects unsupported or missing meanings', () => {
    const data = source(); data.mappings.push(membershipMapping as never);
    const options = [
      { value: 'professional', label: 'Professional', outcome: 'member' },
      { value: 'joining', label: 'Joining', outcome: 'new-member' },
      { value: 'unqualified', label: 'Not eligible', outcome: 'not-eligible' },
    ];
    data.sites.asce.fields.membership = { configuration: 'category', options };
    const membership = () => resolveMappedFields({ component: 'membership' }, { source: data, siteId: 'asce' }).find(field => field.id === 'membership')!;
    expect(membership().options).toEqual(options);
    data.sites.asce.fields.membership = { configuration: 'category', options: [{ value: 'professional', label: 'Professional', outcome: 'unknown-meaning' }] };
    expect(membership).toThrow('Invalid site option outcome: asce/membership');
    data.sites.asce.fields.membership = { configuration: 'category', options: [{ value: 'professional', label: 'Professional' }] };
    expect(membership).toThrow('Missing site option outcome: asce/membership');
  });
  it('shares the Mobile phone default across Membership and Contact, and exposes definitions independently of participation', () => {
    const data = source();
    data.mappings.push(contactMapping as never, membershipMapping as never);
    data.sitePages = { asce: { contact: { hide: ['apt-suite'] } } };
    expect(resolveMappedFields({ page: 'contact' }, { source: data, person: 'spouse' }).find(field => field.id === 'phone-type')?.defaultValue).toBe('mobile');
    expect(resolveMappedFields({ component: 'membership' }, { source: data }).find(field => field.id === 'phone-type')?.defaultValue).toBe('mobile');
    expect(resolveMappedFields({ page: 'contact' }, { source: data, siteId: 'asce' }).some(field => field.id === 'apt-suite')).toBe(false);
    expect(resolveMappedFields({ page: 'contact' }, { source: data, includeAll: true }).find(field => field.id === 'apt-suite')).toBeDefined();
    detail(data, 'phone-type').defaultValue = { contact: 25 };
    expect(() => resolveMappedFields({ page: 'contact' }, { source: data, person: 'spouse' })).toThrow('Invalid field requirement: phone-type/defaultValue');
    detail(data, 'phone-type').defaultValue = { contact: 'mobile' };
    data.sites.asce.fields['phone-type'] = { options: ['home'] };
    expect(() => resolveMappedFields({ page: 'contact' }, { source: data, person: 'spouse', siteId: 'asce' })).toThrow('Unavailable field default: phone-type');
  });
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

  it("matches the deployed fresh-start field inputs and names", () => {
    const legacy = new Map(catalog.data.fields.map(field => [field.key, field.definition as FieldDefinition]));
    for (const { displayName, ...field } of resolveMappedFields(quote, { siteId: "asce" }).filter(field => quoteInputIds.includes(field.id))) {
      const { displayName: legacyName, ...before } = legacy.get(field.id)!;
      expect(field, field.id).toEqual(field.id === "birth-date" ? { ...before, autoComplete: "bday" } : before);
      expect([legacyName, displayName], field.id).toEqual([displayName, displayName]);
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

  it('inherits identifier format and length from the Site and rejects invalid bounds', () => {
    const data = source();
    data.mappings.push(membershipMapping as never);
    const member = (siteId?: string) => resolveMappedFields({ component: 'membership' }, { source: data, siteId, includeAll: true }).find(field => field.id === 'member-id')!;
    expect(member('asce')).toMatchObject({ inputType: 'text', format: 'digits', inputMode: 'numeric', minLength: 6 });
    expect(member()).not.toHaveProperty('minLength');
    for (const values of [{ minLength: -1 }, { minLength: '6' }, { minLength: 6, maxLength: 5 }, { format: 'unknown' }, { inputMode: 'invalid' }]) {
      data.sites.asce.fields['member-id'] = values;
      expect(() => member('asce')).toThrow();
    }
    data.sites.example = { fields: { 'member-id': { required: true, minLength: 3 } } };
    expect(member('example')).toMatchObject({ required: true, minLength: 3 });
    expect(member('example').format).toBeUndefined();
  });

  it("ASCE names the association in the spouse membership question and gets every Eligibility section note", () => {
    expect(resolveMappedFields({ component: "eligibility" }, { siteId: "asce", person: "spouse" }).find(field => field.id === "membership")?.label)
      .toBe("Is your spouse also a member of the American Society of Civil Engineers?");
    expect(requirementSectionNotes("eligibility", "asce")).toEqual({
      selfEligibility: "",
      spouseSection: 'Domestic Partnership/Civil Union is determined by State Law and they will be referred to as "Spouse" throughout the application.',
      childSection: "Only unmarried children are eligible for coverage.",
    });
    expect(requirementSectionNotes("eligibility", "abe")).toBeUndefined();
    expect(() => requirementSectionNotes("eligibility", "asce", undefined, {})).toThrow(/not in the requirements content/);
    expect(requirementPageNote("membership", "asce")).toBe("Throughout this site you will be referred to as a Member of the Civil Engineering profession.");
    expect(requirementPageNote("eligibility", "asce")).toBeUndefined();
    expect(requirementPageNote("membership", "abe")).toBeUndefined();
    expect(() => requirementPageNote("membership", "asce", undefined, {})).toThrow(/not in the requirements content/);
  });

  it('resolves configurable Eligibility notes from the same Site content values as the page compiler', () => {
    const source = structuredClone(defaultRequirementFieldSource());
    source.sitePages!.asce.eligibility = { page: 'eligibility', content: { 'eligibility.note.self': 'Configured member note', 'eligibility.note.spouse': 'Configured spouse note', 'eligibility.note.children': 'Configured child note' } };
    expect(requirementSectionNotes('eligibility', 'asce', source)).toEqual({ selfEligibility: 'Configured member note', spouseSection: 'Configured spouse note', childSection: 'Configured child note' });
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
      ["gender", "underwritingVariants", { FUW: { hidden: true } }],
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
  const membershipSource = () => { const data = source(); data.mappings.push(membershipMapping as never); return { ...data, sitePages: { asce: { membership: asceMembershipPage } } }; };
  it("ASCE's saved Membership fields already match the requirements JSON", () => {
    const page = resolveEffectiveSite(catalog.data as never, "asce").configuration.pages.find(entry => entry.key === "membership")!;
    const included = page.fields.filter(field => field.included);
    expect(included.map(field => field.definition.id)).toEqual(["membership", "first-name", "last-name", "email", "phone", "member-id", "phone-type"]);
    const expected = resolveMappedFields({ component: "membership" }, { siteId: "asce", page: "membership" });
    included.forEach(field => expect(field.definition).toMatchObject(expected.find(row => row.id === field.key)!));
    expect(included.find(field => field.key === 'phone-type')?.definition.defaultValue).toBe('mobile');
  });

  it("lets ASCE include or hide additional Membership fields through its page JSON", () => {
    const data = membershipSource();
    const ids = () => resolveMappedFields({ component: "membership" }, { siteId: "asce", page: "membership", source: data }).map(field => field.id);
    expect(ids()).not.toContain("title");
    expect(ids()).toContain("member-id");
    data.sitePages.asce.membership = { ...asceMembershipPage, include: [], hide: ["title"] };
    expect(ids()).not.toContain("member-id");
    data.sitePages.asce.membership = { ...asceMembershipPage, include: ["member-id"], hide: [] };
    expect(ids()).toEqual(expect.arrayContaining(["title", "first-name", "member-id"]));
  });

  it("offers browser hints for self only across page and component mappings", () => {
    for (const [mapping, id, token] of [
      [{ component: "membership" }, "first-name", "given-name"],
      [{ component: "membership" }, "email", "email"],
      [{ component: "membership" }, "phone", "tel"],
      [{ component: "eligibility" }, "birth-date", "bday"],
      [{ component: "quote-calculator" }, "birth-date", "bday"],
    ] as const) expect(resolveMappedFields(mapping, { siteId: "asce" }).find(field => field.id === id)?.autoComplete).toBe(token);
    for (const person of ["spouse", "child"] as const) {
      const fields = resolveMappedFields({ component: "eligibility" }, { siteId: "asce", person });
      for (const id of ["first-name", "last-name", "birth-date"]) expect(fields.find(field => field.id === id)?.autoComplete).toBe("off");
    }
  });
});

describe("requirement field loader across pages", () => {
  it("resolves page- and person-specific labels, required and helper text", () => {
    const data = source();
    data.mappings.push({ page: "health-di-supp", fields: [{ field: "health-detail-physician-address", people: ["self", "spouse"] }, { field: "email", people: ["self", "spouse"] }] } as never);
    data.mappings.push({ page: "health-si", fields: [{ field: "health-detail-physician-address", people: ["self"] }] } as never);
    const [address, email] = resolve(data, { page: "health-di-supp" });
    expect(address).toMatchObject({ label: "Name and address of each physician, practitioner, and hospital", required: false, multiline: true });
    expect(email.helperText).toMatch(/valid email/);
    expect(resolve(data, { page: "health-di-supp" }, { person: "spouse" })[1].helperText).toBeUndefined();
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


describe("Eligibility answer keys", () => {
  it("round-trips only mapped person and field pairs", () => {
    for (const [field, person] of [["birth-date", "self"], ["membership", "spouse"], ["first-name", "child"], ["full-time-student", "child"]] as const) {
      const key = requirementAnswerKey(field, person);
      expect(parseRequirementAnswerKey(key)).toEqual({ field, person });
    }
    expect(parseRequirementAnswerKey("child-membership")).toBeUndefined();
    expect(parseRequirementAnswerKey("spouse-full-time-student")).toBeUndefined();
    expect(parseRequirementAnswerKey("child-firstName")).toBeUndefined();
  });

});
