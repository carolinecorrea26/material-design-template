import { expect, it } from "vitest";
import { currentMembershipLookup } from "./membershipLookup";
const result = { mode: "mock", provider: "ama-mock", status: "matched", identity: { firstName: "Taylor", lastName: "Morgan", birthDate: "1980-05-04" }, medicalEducationNumber: "MOCK-ME-1234567890", isMember: true };
const values = { "first-name": "Taylor", "last-name": "Morgan", "birth-date": "1980-05-04", membershipLookupResult: JSON.stringify(result) };
it("restores a captured mock result and ignores stale or malformed record data", () => {
  expect(currentMembershipLookup(JSON.parse(JSON.stringify(values)))).toEqual(result);
  for (const patch of [{ "first-name": "Other" }, { "birth-date": "1981-05-04" }, { membershipLookupResult: "invalid" }, { membershipLookupResult: JSON.stringify({ ...result, medicalEducationNumber: "1234" }) }]) expect(currentMembershipLookup({ ...values, ...patch })).toBeUndefined();
  expect(currentMembershipLookup({ ...values, "first-name": " taylor " })).toEqual(result);
  expect(currentMembershipLookup({ ...values, membershipLookupResult: JSON.stringify({ ...result, status: "not-found", medicalEducationNumber: null, isMember: false }) })?.isMember).toBe(false);
});
