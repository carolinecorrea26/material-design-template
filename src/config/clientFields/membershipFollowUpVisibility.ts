import type {
  ActiveAssociationResolution,
  AssociationSelectionMode,
} from "../../data";
import type { ClientId } from "../../types";

export function shouldShowMembershipFollowUpFields({
  clientId,
  selectionMode,
  membershipValue,
  associationStatus,
}: {
  clientId: ClientId;
  selectionMode?: AssociationSelectionMode;
  membershipValue: unknown;
  associationStatus: ActiveAssociationResolution["status"];
}): boolean {
  if (selectionMode === "select") {
    return associationStatus === "resolved";
  }
  if (clientId === "ama") return Boolean(membershipValue);
  if (clientId === "waepa") {
    return membershipValue === "current" || membershipValue === "new";
  }
  return membershipValue === "yes";
}
