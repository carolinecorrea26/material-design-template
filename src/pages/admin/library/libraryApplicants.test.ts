import { describe, expect, it } from "vitest";
import { libraryApplicantLabel, libraryApplicantText } from "./libraryApplicants";

describe("Library applicant terminology", () => {
  it.each([
    ["self", "Member"], ["member", "Member"], ["You", "Member"],
    ["spouse", "Spouse"], ["Your Spouse", "Spouse"],
    ["child", "Child"], ["children", "Child"], ["Your Child(ren)", "Child"],
  ])("maps %s to %s", (source, expected) => {
    expect(libraryApplicantLabel(source)).toBe(expected);
  });
  it("maps heading aliases without altering embedded stored field IDs", () => {
    expect(libraryApplicantText("self / health-li-self-q1 details")).toBe("Member / health-li-self-q1 details");
    expect(libraryApplicantText("Eligibility page · Your Child(ren)")).toBe("Eligibility page · Child");
    expect(libraryApplicantText("Membership Information")).toBe("Membership Information");
  });
});
