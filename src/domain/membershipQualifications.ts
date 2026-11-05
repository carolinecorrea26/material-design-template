/** Reusable qualification definitions. A Site opts into the shared field and
 * condition through stored placements; these choices are not a global default. */
export const waepaQualifications = [
  { value: "federal-active", label: "I am a civilian federal employee of the U.S. government actively at work" },
  { value: "former-federal", label: "I am a former federal employee" },
  { value: "spouse-associate", label: "I am a spouse of a WAEPA member and want to apply as an Associate member" },
  { value: "child-associate", label: "I am an Adult Child/Step-Child of a WAEPA member and want to apply as an Associate member" },
  { value: "parent-associate", label: "I am a parent/parent-in-law of a WAEPA member and want to apply as an Associate Member" },
  { value: "sibling-associate", label: "I am a sibling of a WAEPA member and want to apply as an Associate Member" },
] as const;

export const associateQualificationValues = waepaQualifications.filter(option => option.value.endsWith("-associate")).map(option => option.value);

export function associatedMemberNotice(qualification: unknown, associationName = "WAEPA"): string | undefined {
  if (qualification === "spouse-associate") return `To apply as an Associate Member, please include your spouse's current ${associationName} membership information.`;
  if (qualification === "child-associate") return `To apply as an Associate Member, please include your parent's current ${associationName} membership information.`;
  if (qualification === "parent-associate" || qualification === "sibling-associate") return `To apply as an Associate Member, please include the current ${associationName} member's membership information.`;
  return undefined;
}
