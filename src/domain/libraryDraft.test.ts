import { beforeAll, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository } from "../repositories/portalDataRepository";
import { createLibraryDraft, editDraftField, editDraftRates, editDraftExperience, isLibraryDraft } from "./libraryDraft";
import { resolvePrototypeLibrary } from "./prototypeLibrary";
import { resolveEffectiveSite } from "./effectiveSite";
import { resolveRatePresentation } from "./ratePresentation";

let seed: ReturnType<typeof createReviewedMigrationDatabase>;
// Each LocalStorageAdapter clones this seed; fixture compilation is shared,
// while every test still owns an independent captured revision and draft.
beforeAll(() => { seed = createReviewedMigrationDatabase(); }, 120000);

it("keeps draft records detached without replacing authored shared payment options", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const draft = createLibraryDraft(await createPortalDataRepository(new LocalStorageAdapter(seed)).open(), "asce");
  const before = resolvePrototypeLibrary(draft.data, draft.siteKey, "before").client.applicantExperience ?? {};
  const edited = editDraftExperience(draft, { ...before, payment: { allowSharedMethod: true, allowSharedFrequency: false } });
  expect(edited.data).not.toEqual(draft.data);
  expect(resolvePrototypeLibrary(edited.data, edited.siteKey, "after").client.applicantExperience?.payment).toEqual(before.payment);
  expect(resolvePrototypeLibrary(draft.data, draft.siteKey, "before").client.applicantExperience?.payment).toEqual(before.payment);
}, 15000);

it("isolates edits and preserves all rows of captured tables beyond 1000 records", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const adapter = new LocalStorageAdapter(seed);
  const revision = await createPortalDataRepository(adapter).open();
  const draft = createLibraryDraft(revision, "ama");
  expect(draft.data.semanticRequirements.length).toBe(revision.query("semanticRequirements").total);
  const site = resolveEffectiveSite(draft.data, draft.siteKey), page = site.configuration.pages.find(p => p.fields.some(f => f.included))!, field = page.fields.find(f => f.included)!;
  const edited = editDraftField(draft, page.key, field.key, { label: "Draft label", required: true });
  expect(edited.data.siteFieldConfigurations.some(row => row.siteKey === draft.siteKey && row.fieldKey === field.key && row.values.label === "Draft label")).toBe(true);
  expect(resolveEffectiveSite(edited.data, draft.siteKey).configuration.pages.find(p => p.key === page.key)!.fields.find(f => f.key === field.key)!.definition.label).toBe(field.definition.label);
  expect(resolveEffectiveSite(draft.data, draft.siteKey).configuration.pages.find(p => p.key === page.key)!.fields.find(f => f.key === field.key)!.definition.label).not.toBe("Draft label");
  expect((await createPortalDataRepository(adapter).open()).revision).toBe(revision.revision);
  expect(isLibraryDraft(JSON.parse(JSON.stringify(edited)))).toBe(true);
  expect(() => editDraftField(draft, "unknown", field.key, { required: false })).toThrow();
}, 15000);
it("uses Site precedence for draft PRASE controls and displays only configured references", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const revision = await createPortalDataRepository(new LocalStorageAdapter(seed)).open();
  const draft = createLibraryDraft(revision, "csea");
  const table = { version: 1 as const, kind: "pdf" as const, title: "Reference rates", url: "/client/csea/reference.pdf" };
  const edited = editDraftRates(draft, { version: 1, praseConfigured: false, quoteToolEnabled: true, coverageQuoteEnabled: true }, "di-ltd", table);
  expect(resolveRatePresentation(resolveEffectiveSite(edited.data, edited.siteKey), "di-ltd")).toMatchObject({ status: "resolved", quoteToolEnabled: false, hideCalculatedRates: true, referenceTable: table });
  expect(resolveRatePresentation(resolveEffectiveSite(draft.data, draft.siteKey), "di-ltd").referenceTable).toMatchObject({ kind: "html-table", title: "CSEA Disability Income — Office / Clerical rates" });
  expect(() => editDraftRates(draft, { version: 1, praseConfigured: false, quoteToolEnabled: false, coverageQuoteEnabled: false }, "di-ltd", { ...table, url: "javascript:alert(1)" })).toThrow();
}, 15000);

it('keeps captured billing edits isolated without bypassing authored Site billing', async () => {
  const { editDraftBilling } = await import('./libraryDraft');
  const { resolveCoverageJourneyPolicy, resolveBilling } = await import('./coverageJourneyPolicy');
  vi.stubGlobal('crypto', webcrypto);
  const draft = createLibraryDraft(await createPortalDataRepository(new LocalStorageAdapter(seed)).open(), 'asce');
  const before = resolveEffectiveSite(draft.data, draft.siteKey);
  const policy = resolveCoverageJourneyPolicy(before, 'li-term')!;
  const edited = editDraftBilling(draft, 'li-term', { ...policy.billing, feePerCollection: { ...policy.billing.feePerCollection, 'bill-me': 2 } });
  const after = resolveEffectiveSite(edited.data, edited.siteKey);
  expect(edited.data).not.toEqual(draft.data);
  expect(resolveBilling(resolveCoverageJourneyPolicy(after, 'li-term')!, 'bill-me', 'monthly', 30)).toEqual(resolveBilling(policy, 'bill-me', 'monthly', 30));
  expect(resolveCoverageJourneyPolicy(before, 'li-term')!.billing.feePerCollection['bill-me']).toBe(0);
  expect(resolveCoverageJourneyPolicy(after, 'di-ltd')).toEqual(resolveCoverageJourneyPolicy(before, 'di-ltd'));
  expect(() => editDraftBilling(draft, 'li-term', { ...policy.billing, annualCredit: -1 })).toThrow();
}, 15000);
