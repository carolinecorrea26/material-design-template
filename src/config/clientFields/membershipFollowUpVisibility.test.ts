import { describe, expect, it } from "vitest";
import { shouldShowMembershipFollowUpFields } from "./membershipFollowUpVisibility";

describe("Membership follow-up visibility", () => {
  it("shows ISITRUST follow-up fields after a canonical Association is selected", () => {
    expect(
      shouldShowMembershipFollowUpFields({
        clientId: "isitrust",
        selectionMode: "select",
        membershipValue: "akron-bar-association",
        associationStatus: "resolved",
      }),
    ).toBe(true);
  });

  it("keeps select-mode follow-up fields hidden without a valid Association", () => {
    expect(
      shouldShowMembershipFollowUpFields({
        clientId: "isitrust",
        selectionMode: "select",
        membershipValue: "not-enabled-for-this-site",
        associationStatus: "invalid",
      }),
    ).toBe(false);
  });

  it("preserves legacy membership behavior for other Sites", () => {
    expect(
      shouldShowMembershipFollowUpFields({
        clientId: "asce",
        selectionMode: "fixed",
        membershipValue: "yes",
        associationStatus: "resolved",
      }),
    ).toBe(true);
    expect(
      shouldShowMembershipFollowUpFields({
        clientId: "waepa",
        selectionMode: "fixed",
        membershipValue: "new",
        associationStatus: "resolved",
      }),
    ).toBe(true);
  });
});
