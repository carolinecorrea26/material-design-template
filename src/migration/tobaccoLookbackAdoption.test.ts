import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyTobaccoLookbackAdoption } from "./tobaccoLookbackAdoption";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import { collectRateInputs, isRateInputPolicy, type RateInputPolicy } from "../domain/rateInputPolicy";
import { tobaccoRateAnswer } from "../domain/tobaccoLookback";
import { quoteCandidateWithMock, type MockRatingService } from "../domain/mockRating";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { prototypeRateRequest } from "../app/usePrototypeRates";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
const now = Date.UTC(2026, 9, 21, 12);
const general = "akron-bar-association";
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
const policy = () => db.configurationValues.find(row => row.key === "isitrust.li-group-term.rate-input-policy")!.value as unknown as RateInputPolicy;

it("classifies both rate inputs and classes at the 12/24-month calendar boundaries without altering answers", () => {
  const p = policy(); expect(isRateInputPolicy(p)).toBe(true);
  for (const [association, lastUsed, expected] of [[general, "2025-10-21", "no"], [general, "2025-10-22", "yes"], [atpeAssociationKey, "2024-10-21", "no"], [atpeAssociationKey, "2024-10-22", "yes"], [general, "04/01/2025", "no"], [atpeAssociationKey, "04/01/2025", "yes"]]) for (const applicant of ["member", "spouse"]) {
    const facts = { association, applicant, tobacco: "yes", tobaccoLastUsed: lastUsed };
    const inputs = collectRateInputs(p, facts, now).inputs;
    expect(inputs.tobacco, `${association}/${lastUsed}`).toBe(expected);
    expect(inputs.rateClass).toBe(expected === "yes" ? "Smoker" : "Non smoker");
    expect(facts.tobacco).toBe("yes"); expect(facts.tobaccoLastUsed).toBe(lastUsed);
  }
  for (const date of [undefined, "", "2025-02-30", "2025-13-01", "10/99/2020", "not-a-date", "2027-01-01"]) expect(tobaccoRateAnswer(p.tobaccoLookback, "yes", date, general, now)).toBe("yes");
  expect(tobaccoRateAnswer(p.tobaccoLookback, "no", "2026-10-21", general, now)).toBe("no");
  expect(tobaccoRateAnswer(p.tobaccoLookback, undefined, "2020-01-01", general, now)).toBeUndefined();
  expect(tobaccoRateAnswer(p.tobaccoLookback, "yes", "2024-02-29", general, Date.UTC(2025, 1, 27))).toBe("yes");
  expect(tobaccoRateAnswer(p.tobaccoLookback, "yes", "2024-02-29", general, Date.UTC(2025, 1, 28))).toBe("no");
});

it("carries each applicant's last-use date into mock pricing, while ATPE estimates stay suppressed", async () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "lookback"); installPrototypeLibrary(library);
  const values = { membership: general, "birth-date": "1986-01-01", "spouse-birth-date": "1988-01-01", "state-province": "PA", gender: "female", "spouse-gender": "male", smoker: "yes", "spouse-smoker": "yes", "tobacco-last-used": "2025-04-01", "spouse-tobacco-last-used": "2026-04-01" };
  const service = { quote: vi.fn<MockRatingService["quote"]>(async () => ({ mode: "mock", premiumCents: 12000, expiresAt: now + 60000, authority: "Synthetic test rates" })) };
  const member = prototypeRateRequest("li-group-term", "member", 100000, values, "monthly")!;
  expect(member.facts.tobaccoLastUsed).toBe("2025-04-01");
  const response = await quoteCandidateWithMock(library.site, member.productKey, member.facts, member.payment, service, now, "coverage");
  expect(response.status).toBe("mock");
  expect(service.quote.mock.calls[0][0].dimensions).toMatchObject({ tobacco: "no", rateClass: "Non smoker" });
  const spouse = prototypeRateRequest("li-group-term", "spouse", 100000, values, "monthly")!;
  expect(collectRateInputs(policy(), spouse.facts, now).inputs).toMatchObject({ tobacco: "yes", rateClass: "Smoker" });
  expect(service.quote.mock.calls[0][0].dimensions).not.toHaveProperty("tobaccoLastUsed");
  service.quote.mockClear();
  const suppressed = await quoteCandidateWithMock(library.site, member.productKey, { ...member.facts, association: atpeAssociationKey }, member.payment, service, now, "coverage");
  expect(suppressed).toMatchObject({ status: "unavailable", displayPrice: false }); expect(service.quote).not.toHaveBeenCalled();
  expect(values.smoker).toBe("yes");
});

it("retains captured edits and other product policies, and rejects malformed or orphaned Association scopes", async () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "captured");
  const copy = structuredClone(db); applyTobaccoLookbackAdoption(copy); expect(copy).toEqual(db);
  const stored = copy.configurationValues.find(row => row.key === "isitrust.li-group-term.rate-input-policy")!.value as unknown as RateInputPolicy;
  stored.tobaccoLookback!.months = 6;
  const current = resolvePrototypeLibrary(copy, "isitrust", "edited").site.configuration.products.find(row => row.productKey === "li-group-term")!.rateInputPolicies[0].value as unknown as RateInputPolicy;
  const captured = library.site.configuration.products.find(row => row.productKey === "li-group-term")!.rateInputPolicies[0].value as unknown as RateInputPolicy;
  expect(collectRateInputs(current, { tobacco: "yes", tobaccoLastUsed: "2026-01-01" }, now).inputs.tobacco).toBe("no");
  expect(collectRateInputs(captured, { tobacco: "yes", tobaccoLastUsed: "2026-01-01" }, now).inputs.tobacco).toBe("yes");
  for (const row of db.configurationValues.filter(row => row.key.endsWith(".rate-input-policy") && row.key !== "isitrust.li-group-term.rate-input-policy")) expect((row.value as unknown as RateInputPolicy).tobaccoLookback).toBeUndefined();
  for (const lookback of [{ months: 0, sourceReferences: ["test"] }, { months: 1.5, sourceReferences: ["test"] }, { months: 12, sourceReferences: [] }, { months: 12, sourceReferences: ["test"], associationOverrides: [{ months: 24, associationKeys: ["a", "a"], sourceReferences: ["test"] }] }]) expect(isRateInputPolicy({ ...policy(), tobaccoLookback: lookback })).toBe(false);
  stored.tobaccoLookback!.associationOverrides![0].associationKeys = ["not-assigned"];
  expect(validateMigrationDatabase(copy)).toContain("Orphan tobacco lookback Association isitrust.li-group-term.rate-input-policy");
  const invalid = resolvePrototypeLibrary(copy, "isitrust", "orphan").site;
  const service = { quote: vi.fn() };
  expect(await quoteCandidateWithMock(invalid, "li-group-term", { amount: 100000, tobacco: "yes" }, { method: "bank-account", frequency: "monthly" }, service, now)).toMatchObject({ status: "error", displayPrice: false });
  expect(service.quote).not.toHaveBeenCalled();
});

it("retains disabled Association policies without rejecting another enabled Association's quote", async () => {
  const copy = structuredClone(db);
  copy.siteAssociations.find(row => row.siteKey === "isitrust" && row.associationKey === atpeAssociationKey)!.enabled = false;
  const library = resolvePrototypeLibrary(copy, "isitrust", "inactive-lookback");
  expect(library.site.assignedAssociationKeys).toContain(atpeAssociationKey);
  expect(library.site.enabledAssociationKeys).not.toContain(atpeAssociationKey);
  expect(library.associationContext.associations.some(row => row.id === atpeAssociationKey)).toBe(false);
  expect(validateMigrationDatabase(copy)).toEqual([]);
  const service = { quote: vi.fn<MockRatingService["quote"]>(async () => ({ mode: "mock", premiumCents: 12000, expiresAt: now + 60000, authority: "Synthetic test rates" })) };
  const facts = { amount: 100000, age: 40, gender: "female", jurisdiction: "US-PA", applicant: "member", association: general, tobacco: "yes", tobaccoLastUsed: "2025-04-01", membership: true, riders: [] };
  expect(await quoteCandidateWithMock(library.site, "li-group-term", facts, { method: "bank-account", frequency: "monthly" }, service, now, "coverage")).toMatchObject({ status: "mock", displayPrice: true });
  expect(service.quote.mock.calls[0][0].dimensions).toMatchObject({ tobacco: "no", rateClass: "Non smoker" });
});
