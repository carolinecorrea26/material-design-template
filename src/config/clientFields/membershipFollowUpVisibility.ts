import type {
  ActiveAssociationResolution,
  AssociationSelectionMode,
} from "../../data";

export function shouldShowMembershipFollowUpFields({
  membershipOptions,
  selectionMode,
  membershipValue,
  associationStatus,
}: {
  membershipOptions: string[];
  selectionMode?: AssociationSelectionMode;
  membershipValue: unknown;
  associationStatus: ActiveAssociationResolution["status"];
}): boolean {
  if (selectionMode === "select") {
    return associationStatus === "resolved";
  }
  if (membershipOptions.includes("physician") || membershipOptions.includes("spouse")) return membershipOptions.includes(String(membershipValue));
  if (membershipOptions.includes("current") || membershipOptions.includes("new")) {
    return membershipValue === "current" || membershipValue === "new" || membershipValue === "yes";
  }
  return membershipValue === "yes";
}
