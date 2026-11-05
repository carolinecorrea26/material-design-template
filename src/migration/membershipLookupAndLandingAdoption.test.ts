import { expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyMembershipLookupAndLandingAdoption } from "./membershipLookupAndLandingAdoption";
import { prototypeRateRequest } from "../app/usePrototypeRates";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { isApplicantExperience } from "../domain/applicantExperience";
import { validateMigrationDatabase } from "./integrity";
it("assigns reusable lookup/viewer definitions explicitly, preserving ABE Review and source evidence", () => {
  const db = createReviewedMigrationDatabase();
  const ama = resolvePrototypeLibrary(db, "ama", "lookup"), abe = resolvePrototypeLibrary(db, "abe", "notice"), asce = resolvePrototypeLibrary(db, "asce", "isolation");
  expect(ama.client.applicantExperience?.membershipLookup).toEqual({ provider: "ama-mock", title: "AMA record lookup" });
  expect(abe.client.applicantExperience?.landingNotice?.text).toContain("Founded by the ABA in 1942");
  expect(abe.client.applicantExperience?.landingNotice?.text).not.toContain("+A16");
  expect(ama.client.applicantExperience?.landingNotice).toBeUndefined(); expect(asce.client.applicantExperience?.membershipLookup).toBeUndefined();
  const values = { membership: "physician", "first-name": "Taylor", "last-name": "Morgan", "birth-date": "1980-05-04", membershipLookupResult: JSON.stringify({ mode: "mock", provider: "ama-mock", status: "matched", identity: { firstName: "Taylor", lastName: "Morgan", birthDate: "1980-05-04" }, medicalEducationNumber: "MOCK-ME-1234567890", isMember: false }) };
  try {
    installPrototypeLibrary(ama);
    expect(prototypeRateRequest("di-step-rated", "member", 1000, values, "monthly")?.facts.membership).toBe(false);
    expect(prototypeRateRequest("di-step-rated", "member", 1000, { ...values, "birth-date": "1981-05-04" }, "monthly")?.facts.membership).toBeUndefined();
    installPrototypeLibrary(asce);
    expect(prototypeRateRequest("di-ltd", "member", 1000, values, "monthly")?.facts.membership).toBeUndefined();
  } finally { installPrototypeLibrary(null); }
  const review = structuredClone(db.configurationValues.find(row => row.key === "abe.review-policy"));
  const copy = structuredClone(db); applyMembershipLookupAndLandingAdoption(copy); expect(copy).toEqual(db);
  expect(copy.configurationValues.find(row => row.key === "abe.review-policy")).toEqual(review); expect(validateMigrationDatabase(db)).toEqual([]);
  expect(isApplicantExperience({ membershipLookup: { provider: "real-ama", title: "Lookup" } })).toBe(false);
  expect(isApplicantExperience({ landingNotice: { title: "Notice", text: "" } })).toBe(false);
}, 120000);
