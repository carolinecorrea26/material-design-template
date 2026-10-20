import { expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository } from "../repositories/portalDataRepository";
import { createLibraryDraft, editDraftField, editDraftRates, editDraftExperience, isLibraryDraft } from "./libraryDraft";
import { resolvePrototypeLibrary } from "./prototypeLibrary";
import { resolveEffectiveSite } from "./effectiveSite";
import { resolveRatePresentation } from "./ratePresentation";

it("persists independent shared payment options with Site precedence", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const draft = createLibraryDraft(await createPortalDataRepository(new LocalStorageAdapter(createReviewedMigrationDatabase())).open(), "asce");
  const before = resolvePrototypeLibrary(draft.data, draft.siteKey, "before").client.applicantExperience ?? {};
  const edited = editDraftExperience(draft, { ...before, payment: { allowSharedMethod: true, allowSharedFrequency: false } });
  expect(resolvePrototypeLibrary(edited.data, edited.siteKey, "after").client.applicantExperience?.payment).toEqual({ allowSharedMethod: true, allowSharedFrequency: false });
  expect(resolvePrototypeLibrary(draft.data, draft.siteKey, "before").client.applicantExperience?.payment).toEqual(before.payment);
}, 15000);

it("isolates edits and preserves all rows of captured tables beyond 1000 records", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const adapter = new LocalStorageAdapter(createReviewedMigrationDatabase());
  const revision = await createPortalDataRepository(adapter).open();
  const draft = createLibraryDraft(revision, "ama");
  expect(draft.data.semanticRequirements.length).toBe(revision.query("semanticRequirements").total);
  const site = resolveEffectiveSite(draft.data, draft.siteKey), page = site.configuration.pages.find(p => p.fields.some(f => f.included))!, field = page.fields.find(f => f.included)!;
  const edited = editDraftField(draft, page.key, field.key, { label: "Draft label", required: true });
  expect(resolveEffectiveSite(edited.data, draft.siteKey).configuration.pages.find(p => p.key === page.key)!.fields.find(f => f.key === field.key)!.definition.label).toBe("Draft label");
  expect(resolveEffectiveSite(draft.data, draft.siteKey).configuration.pages.find(p => p.key === page.key)!.fields.find(f => f.key === field.key)!.definition.label).not.toBe("Draft label");
  expect((await createPortalDataRepository(adapter).open()).revision).toBe(revision.revision);
  expect(isLibraryDraft(JSON.parse(JSON.stringify(edited)))).toBe(true);
  expect(() => editDraftField(draft, "unknown", field.key, { required: false })).toThrow();
}, 15000);
it("uses Site precedence for draft PRASE controls and displays only configured references", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const revision = await createPortalDataRepository(new LocalStorageAdapter(createReviewedMigrationDatabase())).open();
  const draft = createLibraryDraft(revision, "csea");
  const table = { version: 1 as const, kind: "pdf" as const, title: "Reference rates", url: "/client/csea/reference.pdf" };
  const edited = editDraftRates(draft, { version: 1, praseConfigured: false, quoteToolEnabled: true, coverageQuoteEnabled: true }, "di-ltd", table);
  expect(resolveRatePresentation(resolveEffectiveSite(edited.data, edited.siteKey), "di-ltd")).toMatchObject({ status: "resolved", quoteToolEnabled: false, hideCalculatedRates: true, referenceTable: table });
  expect(resolveRatePresentation(resolveEffectiveSite(draft.data, draft.siteKey), "di-ltd").referenceTable).toMatchObject({ kind: "html-table", title: "CSEA Disability Income — Office / Clerical rates" });
  expect(() => editDraftRates(draft, { version: 1, praseConfigured: false, quoteToolEnabled: false, coverageQuoteEnabled: false }, "di-ltd", { ...table, url: "javascript:alert(1)" })).toThrow();
}, 15000);

it('edits ASCE synthetic billing without changing other products or catalog data', async () => {
  const { editDraftBilling } = await import('./libraryDraft');
  const { resolveCoverageJourneyPolicy, resolveBilling } = await import('./coverageJourneyPolicy');
  vi.stubGlobal('crypto', webcrypto);
  const draft = createLibraryDraft(await createPortalDataRepository(new LocalStorageAdapter(createReviewedMigrationDatabase())).open(), 'asce');
  const before = resolveEffectiveSite(draft.data, draft.siteKey);
  const policy = resolveCoverageJourneyPolicy(before, 'li-term')!;
  const edited = editDraftBilling(draft, 'li-term', { ...policy.billing, feePerCollection: { ...policy.billing.feePerCollection, 'bill-me': 2 } });
  const after = resolveEffectiveSite(edited.data, edited.siteKey);
  expect(resolveBilling(resolveCoverageJourneyPolicy(after, 'li-term')!, 'bill-me', 'monthly', 30).amount).toBe(4.5);
  expect(resolveCoverageJourneyPolicy(before, 'li-term')!.billing.feePerCollection['bill-me']).toBe(0);
  expect(resolveCoverageJourneyPolicy(after, 'di-ltd')).toEqual(resolveCoverageJourneyPolicy(before, 'di-ltd'));
  expect(() => editDraftBilling(draft, 'li-term', { ...policy.billing, annualCredit: -1 })).toThrow();
}, 15000);
