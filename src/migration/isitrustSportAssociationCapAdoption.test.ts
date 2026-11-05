import dayjs from "dayjs";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyIsitrustSportAssociationCapAdoption, sportAssociationKeys } from "./isitrustSportAssociationCapAdoption";
import { isAssociationAmountPolicy, resolveAssociationAmounts } from "../domain/associationAmountPolicy";
import { resolvePrototypeLibrary, installPrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveApplicationCoverage, validateApplicationCoverages } from "../domain/coverageRuntime";
import { validateNormalizedCoverageAmount } from "../domain/normalizedCoverageAmounts";
import { createCoverageJourneyFixture } from "./coverageJourneyExceptionAcceptance";
import { evaluateCoverageJourney } from "../domain/coverageJourney";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { validateMigrationDatabase } from "./integrity";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it("caps the two Associations' member amounts at 500000 with existing minima and increments in both native and UI paths", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "sport-caps"); installPrototypeLibrary(library);
  for (const association of sportAssociationKeys) for (const [productKey, increment] of [["li-add", 50000], ["li-group-term", 10000]] as const) {
    const product = library.products.find(product => product.id === productKey)!;
    const values = { membership: association, state: "PA", gender: "male", "birth-date": dayjs().subtract(40, "year").format("YYYY-MM-DD"), coverageSelections: [productKey], productApplicants: { [productKey]: ["member"] }, coverageAmounts: { [`${productKey}:member`]: 500000 } };
    const choices = resolveApplicationCoverage(product, "member", values, library.products).amounts;
    expect(choices[0]).toBe(50000); expect(choices.at(-1)).toBe(500000); expect(choices[1] - choices[0]).toBe(increment);
    expect(validateNormalizedCoverageAmount(library.site, productKey, "member", 500000, undefined, association).allowed).toBe(true);
    expect(validateNormalizedCoverageAmount(library.site, productKey, "member", 500000 + increment, undefined, association).allowed).toBe(false);
    expect(validateApplicationCoverages(library.products, values)).toBeUndefined();
    expect(validateApplicationCoverages(library.products, { ...values, coverageAmounts: { [`${productKey}:member`]: 500000 + increment } })).toContain("select an available benefit amount");
  }
  const other = resolveCoverageJourneyPolicy(library.site, "li-add")!.associationChoices.find(choice => ![...sportAssociationKeys, atpeAssociationKey].includes(choice.key))!.key;
  expect(validateNormalizedCoverageAmount(library.site, "li-add", "member", 750000, undefined, other).allowed).toBe(true);
  expect(validateNormalizedCoverageAmount(library.site, "li-add", "member", 750000, undefined, atpeAssociationKey).allowed).toBe(true);
  expect(resolveAssociationAmounts(library.site, "li-group-term", sportAssociationKeys[0]).rules.filter(row => row.value.applicantTypeKey !== "member")).toEqual(resolveAssociationAmounts(library.site, "li-group-term", other).rules.filter(row => row.value.applicantTypeKey !== "member"));
});
it("rejects an oversized native election and retains captured isolation, reapplication and assignment validation", async () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "native-caps");
  const mapping = resolveCoverageJourneyPolicy(library.site, "li-add")!.mappings.find(row => row.when.applicantKey === "member" && row.when.mode === "new" && row.when.associationKey === sportAssociationKeys[0])!;
  const fixture = createCoverageJourneyFixture(library.site, "li-add", mapping.when);
  fixture.input.amount = 500000; expect((await evaluateCoverageJourney(library.site, fixture.input, { policies: fixture.policies })).allowed).toBe(true);
  fixture.input.amount = 550000; expect((await evaluateCoverageJourney(library.site, fixture.input, { policies: fixture.policies })).allowed).toBe(false);
  const copy = structuredClone(db); applyIsitrustSportAssociationCapAdoption(copy); expect(copy).toEqual(db); expect(validateMigrationDatabase(db)).toEqual([]);
  const row = copy.configurationValues.find(row => row.key === "isitrust.li-add.sport-association-member-amounts")!;
  (row.value as { associationKeys: string[] }).associationKeys.push(atpeAssociationKey);
  expect(resolveAssociationAmounts(resolvePrototypeLibrary(copy, "isitrust", "overlap").site, "li-add", atpeAssociationKey).status).toBe("unresolved");
  expect(resolveAssociationAmounts(library.site, "li-add", atpeAssociationKey).status).toBe("resolved");
  expect(isAssociationAmountPolicy({ version: 1, associationKey: "one", associationKeys: ["two"], amounts: [{ applicantKey: "member", amountPatternKey: "pattern" }] })).toBe(false);
  expect(isAssociationAmountPolicy({ version: 1, associationKeys: ["one", "one"], amounts: [{ applicantKey: "member", amountPatternKey: "pattern" }] })).toBe(false);
});
