import { describe, expect, it } from "vitest";
import { shouldShowMembershipFollowUpFields } from "./membershipFollowUpVisibility";

describe("Membership follow-up visibility", () => {
  it("shows association follow-up fields after a canonical Association is selected", () => {
    expect(
      shouldShowMembershipFollowUpFields({
        membershipOptions: ["example-association"],
        selectionMode: "select",
        membershipValue: "akron-bar-association",
        associationStatus: "resolved",
      }),
    ).toBe(true);
  });

  it("keeps select-mode follow-up fields hidden without a valid Association", () => {
    expect(
      shouldShowMembershipFollowUpFields({
        membershipOptions: ["example-association"],
        selectionMode: "select",
        membershipValue: "not-enabled-for-this-site",
        associationStatus: "invalid",
      }),
    ).toBe(false);
  });

  it("uses configured membership choices for shared follow-up behavior", () => {
    expect(
      shouldShowMembershipFollowUpFields({
        membershipOptions: ["yes", "no"],
        selectionMode: "fixed",
        membershipValue: "yes",
        associationStatus: "resolved",
      }),
    ).toBe(true);
    expect(
      shouldShowMembershipFollowUpFields({
        membershipOptions: ["new", "current"],
        selectionMode: "fixed",
        membershipValue: "new",
        associationStatus: "resolved",
      }),
    ).toBe(true);
  });
});
